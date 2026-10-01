import fs from "node:fs";
import path from "node:path";
import { Package, Subject, Subscription } from "../../models/index.js";
import { ApiError, isCloudinaryUrl, lectureFileName, pageMeta, paginate, removeFile, uploadPdf } from "../../utils/index.js";
import { canOpenLecture, getAccess } from "../subscriptions/subscriptions.service.js";

// pick* copy only the allowed fields so extra body fields never reach the database.
const pickQuiz = (quiz) =>
  quiz
    ? {
        questions: quiz.questions.map(({ question, options, correctAnswer, duration }) => ({
          question,
          options,
          correctAnswer,
          duration,
        })),
      }
    : null;

const pickLecture = ({ title, order, description, quiz }) => ({
  title,
  order,
  description,
  quiz: pickQuiz(quiz),
});

const assignDefined = (target, data, fields) => {
  for (const field of fields) {
    if (data[field] !== undefined) target[field] = data[field];
  }
};

const quizSummary = (quiz) =>
  quiz
    ? {
        questionsCount: quiz.questions.length,
        totalDuration: quiz.questions.reduce((sum, question) => sum + question.duration, 0),
      }
    : null;

// Public view: counts and durations only, no correct answers or file URLs.
const toCatalog = (subject) => ({
  _id: subject._id,
  name: subject.name,
  description: subject.description,
  price: subject.price,
  durationDays: subject.durationDays,
  lecturesCount: subject.lectures.length,
  lectures: [...subject.lectures]
    .sort((a, b) => a.order - b.order)
    .map((lecture) => ({
      _id: lecture._id,
      title: lecture.title,
      order: lecture.order,
      description: lecture.description,
      filesCount: lecture.files.length,
      quiz: quizSummary(lecture.quiz),
    })),
  finalQuiz: quizSummary(subject.finalQuiz),
  created_at: subject.created_at,
});

const present = (requester, subject) => (requester?.role === "admin" ? subject : toCatalog(subject));

const findSubject = async (subjectId) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, "Subject not found");
  return subject;
};

const findLecture = async (subjectId, lectureId) => {
  const subject = await findSubject(subjectId);
  const lecture = subject.lectures.id(lectureId);
  if (!lecture) throw new ApiError(404, "Lecture not found in this subject");
  return { subject, lecture };
};

const assertOrderAvailable = (subject, order, exceptLectureId = null) => {
  const taken = subject.lectures.some(
    (lecture) => lecture.order === order && !lecture._id.equals(exceptLectureId)
  );
  if (taken) throw new ApiError(409, `Lecture number ${order} already exists in this subject`);
};

const lectureFilePaths = (lectures) => lectures.flatMap((lecture) => lecture.files.map((file) => file.url));

const originalName = (file) => Buffer.from(file.originalname, "latin1").toString("utf8");

// Uploads one PDF to Cloudinary and points file.path at the URL so a later error deletes it.
const storeLectureFile = async (file, subjectName, lectureOrder, order) => {
  const url = await uploadPdf(file.buffer, `${lectureFileName(subjectName, lectureOrder)}.pdf`);
  file.path = url;
  return { name: originalName(file), url, order, size: file.size };
};

const finalizeLectureFiles = async (subjectName, lectureOrder, files, startOrder = 0) => {
  const lectureFiles = [];
  for (const file of files) {
    lectureFiles.push(await storeLectureFile(file, subjectName, lectureOrder, startOrder + lectureFiles.length + 1));
  }
  return lectureFiles;
};

const lectureOrderFromField = (file) => Number(file.fieldname.split("_")[1]);

const createSubject = async (data, files = []) => {
  const lectures = [];
  for (const lecture of data.lectures ?? []) {
    const lectureUploads = files.filter((file) => lectureOrderFromField(file) === lecture.order);
    lectures.push({
      ...pickLecture(lecture),
      files: await finalizeLectureFiles(data.name, lecture.order, lectureUploads),
    });
  }

  return Subject.create({
    name: data.name,
    description: data.description,
    price: data.price,
    durationDays: data.durationDays,
    lectures,
    finalQuiz: pickQuiz(data.finalQuiz),
  });
};

const listSubjects = async (requester, query) => {
  const { page, limit, skip } = paginate(query);
  const [total, subjects] = await Promise.all([
    Subject.countDocuments(),
    Subject.find().sort({ created_at: -1 }).skip(skip).limit(limit),
  ]);
  return {
    subjects: subjects.map((subject) => present(requester, subject)),
    pagination: pageMeta(page, limit, total),
  };
};

const getSubject = async (requester, subjectId) => present(requester, await findSubject(subjectId));

const updateSubject = async (subjectId, data) => {
  const subject = await findSubject(subjectId);
  assignDefined(subject, data, ["name", "description", "price", "durationDays"]);
  return subject.save();
};

const deleteSubject = async (subjectId) => {
  const subject = await findSubject(subjectId);

  if (await Subscription.exists({ "enrollment.subjects.subjectId": subjectId, status: "active" })) {
    throw new ApiError(409, "Subject has active subscriptions and cannot be deleted");
  }
  if (await Package.exists({ subjectIds: subjectId })) {
    throw new ApiError(409, "Subject is part of a package, remove it from the package first");
  }

  await subject.deleteOne();
  await Promise.all(lectureFilePaths(subject.lectures).map(removeFile));
};

const setFinalQuiz = async (subjectId, quiz) => {
  const subject = await findSubject(subjectId);
  subject.finalQuiz = pickQuiz(quiz);
  await subject.save();
  return subject.finalQuiz;
};

const removeFinalQuiz = async (subjectId) => {
  const subject = await findSubject(subjectId);
  subject.finalQuiz = null;
  await subject.save();
};

const addLecture = async (subjectId, data, files = []) => {
  const subject = await findSubject(subjectId);
  assertOrderAvailable(subject, data.order);
  subject.lectures.push({
    ...pickLecture(data),
    files: await finalizeLectureFiles(subject.name, data.order, files),
  });
  await subject.save();
  return subject.lectures.at(-1);
};

const updateLecture = async (subjectId, lectureId, data) => {
  const { subject, lecture } = await findLecture(subjectId, lectureId);
  if (data.order !== undefined) assertOrderAvailable(subject, data.order, lecture._id);
  assignDefined(lecture, data, ["title", "order", "description"]);
  await subject.save();
  return lecture;
};

const deleteLecture = async (subjectId, lectureId) => {
  const { subject, lecture } = await findLecture(subjectId, lectureId);
  const paths = lectureFilePaths([lecture]);
  lecture.deleteOne();
  await subject.save();
  await Promise.all(paths.map(removeFile));
};

const setLectureQuiz = async (subjectId, lectureId, quiz) => {
  const { subject, lecture } = await findLecture(subjectId, lectureId);
  lecture.quiz = pickQuiz(quiz);
  await subject.save();
  return lecture.quiz;
};

const removeLectureQuiz = async (subjectId, lectureId) => {
  const { subject, lecture } = await findLecture(subjectId, lectureId);
  lecture.quiz = null;
  await subject.save();
};

const addLectureFiles = async (subject, lecture, files) => {
  let order = lecture.files.reduce((max, file) => Math.max(max, file.order), 0);
  for (const file of files) {
    order += 1;
    lecture.files.push(await storeLectureFile(file, subject.name, lecture.order, order));
  }
  await subject.save();
  return lecture.files;
};

// ---------- Subscribed content (admin, or a student with an active subscription) ----------

const isAdmin = (requester) => requester.role === "admin";

// Questions to solve: no correct answers.
const quizForStudent = (quiz) =>
  quiz
    ? {
        questions: quiz.questions.map(({ _id, question, options, duration }) => ({
          _id,
          question,
          options,
          duration,
        })),
      }
    : null;

const lectureForStudent = (lecture) => ({
  _id: lecture._id,
  title: lecture.title,
  order: lecture.order,
  description: lecture.description,
  files: [...lecture.files]
    .sort((a, b) => a.order - b.order)
    .map(({ _id, name, order, size }) => ({ _id, name, order, size })),
  quiz: quizForStudent(lecture.quiz),
});

const assertLectureAccess = async (requester, subjectId, lectureId) => {
  if (isAdmin(requester)) return;
  if (!(await canOpenLecture(requester.id, subjectId, lectureId))) {
    throw new ApiError(403, "You don't have an active subscription to this lecture");
  }
};

const getLectureContent = async (requester, subjectId, lectureId) => {
  const { lecture } = await findLecture(subjectId, lectureId);
  await assertLectureAccess(requester, subjectId, lectureId);
  return isAdmin(requester) ? lecture : lectureForStudent(lecture);
};

const getFinalQuizContent = async (requester, subjectId) => {
  const subject = await findSubject(subjectId);
  if (!subject.finalQuiz) throw new ApiError(404, "This subject has no final quiz");
  if (isAdmin(requester)) return subject.finalQuiz;

  const access = await getAccess(requester.id, subjectId);
  if (!access.fullAccess) {
    throw new ApiError(403, "Final quiz requires an active full subject subscription");
  }
  return quizForStudent(subject.finalQuiz);
};

const getLectureFile = async (requester, subjectId, lectureId, fileId) => {
  const { lecture } = await findLecture(subjectId, lectureId);
  await assertLectureAccess(requester, subjectId, lectureId);
  const file = lecture.files.id(fileId);
  if (!file) throw new ApiError(404, "File not found in this lecture");

  if (isCloudinaryUrl(file.url)) return { url: file.url, name: file.name };

  const filePath = path.resolve(file.url);
  if (!fs.existsSync(filePath)) throw new ApiError(404, "File is missing on the server");
  return { path: filePath, name: file.name };
};

const deleteLectureFile = async (subjectId, lectureId, fileId) => {
  const { subject, lecture } = await findLecture(subjectId, lectureId);
  const file = lecture.files.id(fileId);
  if (!file) throw new ApiError(404, "File not found in this lecture");
  const filePath = file.url;
  file.deleteOne();
  await subject.save();
  await removeFile(filePath);
};

export {
  findLecture,
  createSubject,
  listSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  setFinalQuiz,
  removeFinalQuiz,
  addLecture,
  updateLecture,
  deleteLecture,
  setLectureQuiz,
  removeLectureQuiz,
  addLectureFiles,
  deleteLectureFile,
  getLectureContent,
  getFinalQuizContent,
  getLectureFile,
};
