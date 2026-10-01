import { Package, Subject, Subscription, User } from "../../models/index.js";
import { ApiError, pageMeta, paginate } from "../../utils/index.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const isAdmin = (requester) => requester.role === "admin";
const sameId = (a, b) => String(a) === String(b);
const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
const byOrder = (a, b) => a.order - b.order;

// ---------- Approval: build the enrollment from what was requested ----------

const fullSubjectEntry = (subject) => ({
  subjectId: subject._id,
  fullAccess: true,
  lectures: [...subject.lectures].sort(byOrder).map((lecture) => ({ lectureId: lecture._id })),
});

const buildEnrollment = async ({ subjectId, lectureId, packageId }) => {
  if (packageId) {
    const pkg = await Package.findById(packageId);
    if (!pkg) throw new ApiError(404, "Package not found");
    const subjects = await Subject.find({ _id: { $in: pkg.subjectIds } });
    if (subjects.length === 0) throw new ApiError(409, "Package has no existing subjects");
    return { durationDays: pkg.durationDays, subjects: subjects.map(fullSubjectEntry) };
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, "Subject not found");
  if (!lectureId) return { durationDays: subject.durationDays, subjects: [fullSubjectEntry(subject)] };

  if (!subject.lectures.id(lectureId)) throw new ApiError(404, "Lecture not found in this subject");
  return {
    durationDays: subject.durationDays,
    subjects: [{ subjectId: subject._id, fullAccess: false, lectures: [{ lectureId }] }],
  };
};

// Copies completed lectures and quiz attempts from the student's older subscriptions of the same subjects.
const carryOverProgress = async (userId, subjects) => {
  const previous = await Subscription.find({
    userId,
    "enrollment.subjects.subjectId": { $in: subjects.map((entry) => entry.subjectId) },
  }).sort({ created_at: 1 });

  const lectureProgress = new Map();
  const finalAttempts = new Map();
  for (const subscription of previous) {
    for (const entry of subscription.enrollment.subjects) {
      if (entry.finalQuizAttempt) finalAttempts.set(String(entry.subjectId), entry.finalQuizAttempt);
      for (const lecture of entry.lectures) {
        const key = `${entry.subjectId}:${lecture.lectureId}`;
        const known = lectureProgress.get(key) ?? {};
        lectureProgress.set(key, {
          completed: known.completed || lecture.completed,
          completedAt: known.completedAt ?? lecture.completedAt,
          quizAttempt: known.quizAttempt ?? lecture.quizAttempt,
        });
      }
    }
  }

  for (const entry of subjects) {
    entry.lectures = entry.lectures.map((lecture) => {
      const known = lectureProgress.get(`${entry.subjectId}:${lecture.lectureId}`);
      return known
        ? {
            lectureId: lecture.lectureId,
            completed: Boolean(known.completed),
            completedAt: known.completedAt ?? null,
            quizAttempt: known.quizAttempt?.toObject?.() ?? known.quizAttempt ?? null,
          }
        : lecture;
    });
    const finalAttempt = finalAttempts.get(String(entry.subjectId));
    if (entry.fullAccess && finalAttempt) entry.finalQuizAttempt = finalAttempt.toObject();
  }
};

const createFromRequest = async (request) => {
  const { durationDays, subjects } = await buildEnrollment(request);
  await carryOverProgress(request.userId, subjects);

  const startedAt = new Date();
  return Subscription.create({
    userId: request.userId,
    requestId: request._id,
    subjectId: request.subjectId,
    lectureId: request.lectureId,
    packageId: request.packageId,
    startedAt,
    endAt: addDays(startedAt, durationDays),
    status: "active",
    enrollment: { subjects },
  });
};

// ---------- Expiry & sync ----------

// Lazy expiry: active subscriptions past endAt become expired whenever they are read.
const expireOverdue = (filter = {}) =>
  Subscription.updateMany(
    { ...filter, status: "active", endAt: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );

const loadSubjects = async (subscriptions) => {
  const ids = subscriptions.flatMap((subscription) =>
    subscription.enrollment.subjects.map((entry) => entry.subjectId)
  );
  const subjects = await Subject.find({ _id: { $in: ids } });
  return new Map(subjects.map((subject) => [String(subject._id), subject]));
};

// Adds lectures created after the subscription to full-access subjects (active subscriptions only).
const syncNewLectures = (subscription, subjectsById) => {
  if (subscription.status !== "active") return false;
  let changed = false;
  for (const entry of subscription.enrollment.subjects) {
    const subject = subjectsById.get(String(entry.subjectId));
    if (!entry.fullAccess || !subject) continue;
    for (const lecture of subject.lectures) {
      if (!entry.lectures.some((progress) => sameId(progress.lectureId, lecture._id))) {
        entry.lectures.push({ lectureId: lecture._id });
        changed = true;
      }
    }
  }
  return changed;
};

const syncAndSave = async (subscriptions, subjectsById) => {
  for (const subscription of subscriptions) {
    if (syncNewLectures(subscription, subjectsById)) await subscription.save();
  }
};

// ---------- Views ----------

const targetView = (subscription) => ({
  subjectId: subscription.subjectId,
  lectureId: subscription.lectureId,
  packageId: subscription.packageId,
});

// Only lectures that still exist in the subject are shown.
const existingLectures = (entry, subject) =>
  subject ? entry.lectures.filter((progress) => subject.lectures.id(progress.lectureId)) : [];

const attemptSummary = (attempt) =>
  attempt ? { score: attempt.score, total: attempt.total, submittedAt: attempt.submittedAt } : null;

const subjectSummary = (entry, subject) => {
  const lectures = existingLectures(entry, subject);
  const completedCount = lectures.filter((lecture) => lecture.completed).length;
  return {
    subjectId: entry.subjectId,
    name: subject?.name ?? null,
    fullAccess: entry.fullAccess,
    lecturesCount: lectures.length,
    completedCount,
    percent: lectures.length ? Math.round((completedCount / lectures.length) * 100) : 0,
    finalQuizAttempt: attemptSummary(entry.finalQuizAttempt),
  };
};

const summaryView = (subscription, subjectsById) => ({
  _id: subscription._id,
  userId: subscription.userId,
  requestId: subscription.requestId,
  ...targetView(subscription),
  startedAt: subscription.startedAt,
  endAt: subscription.endAt,
  status: subscription.status,
  subjects: subscription.enrollment.subjects.map((entry) =>
    subjectSummary(entry, subjectsById.get(String(entry.subjectId)))
  ),
  created_at: subscription.created_at,
});

// Correct answers are shown only for questions the student already submitted.
const attemptDetail = (attempt, quiz) => {
  if (!attempt) return null;
  return {
    score: attempt.score,
    total: attempt.total,
    submittedAt: attempt.submittedAt,
    answers: attempt.answers.map((answer) => {
      const question = quiz?.questions.id(answer.questionId);
      return {
        questionId: answer.questionId,
        question: question?.question ?? null,
        options: question?.options ?? [],
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question?.correctAnswer ?? null,
        isCorrect: answer.isCorrect,
      };
    }),
  };
};

const quizView = (quiz, attempt) => ({
  available: Boolean(quiz),
  questionsCount: quiz?.questions.length ?? 0,
  totalDuration: quiz?.questions.reduce((sum, question) => sum + question.duration, 0) ?? 0,
  attempt: attemptDetail(attempt, quiz),
});

const detailView = (subscription, subjectsById) => ({
  ...summaryView(subscription, subjectsById),
  subjects: subscription.enrollment.subjects.map((entry) => {
    const subject = subjectsById.get(String(entry.subjectId));
    return {
      ...subjectSummary(entry, subject),
      lectures: existingLectures(entry, subject)
        .map((progress) => {
          const lecture = subject.lectures.id(progress.lectureId);
          return {
            lectureId: progress.lectureId,
            title: lecture.title,
            order: lecture.order,
            completed: progress.completed,
            completedAt: progress.completedAt,
            quiz: quizView(lecture.quiz, progress.quizAttempt),
          };
        })
        .sort(byOrder),
      finalQuiz: entry.fullAccess ? quizView(subject?.finalQuiz, entry.finalQuizAttempt) : null,
    };
  }),
});

// ---------- Read ----------

const listSubscriptions = async (filter, query) => {
  await expireOverdue(filter.userId ? { userId: filter.userId } : {});
  const { page, limit, skip } = paginate(query);
  const [total, subscriptions] = await Promise.all([
    Subscription.countDocuments(filter),
    Subscription.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
  ]);
  const subjectsById = await loadSubjects(subscriptions);
  await syncAndSave(subscriptions, subjectsById);
  return {
    subscriptions: subscriptions.map((subscription) => summaryView(subscription, subjectsById)),
    pagination: pageMeta(page, limit, total),
  };
};

const getMySubscriptions = (userId, query) => listSubscriptions({ userId }, query);

const getAllSubscriptions = (query) => {
  const filter = {};
  if (query.userId) filter.userId = query.userId;
  if (query.status) filter.status = query.status;
  return listSubscriptions(filter, query);
};

const findSubscription = async (id) => {
  await expireOverdue({ _id: id });
  const subscription = await Subscription.findById(id);
  if (!subscription) throw new ApiError(404, "Subscription not found");
  return subscription;
};

const getSubscription = async (requester, id) => {
  const subscription = await findSubscription(id);
  if (!isAdmin(requester) && !sameId(subscription.userId, requester.id)) {
    throw new ApiError(403, "You are not allowed to access this subscription");
  }
  const subjectsById = await loadSubjects([subscription]);
  await syncAndSave([subscription], subjectsById);
  return detailView(subscription, subjectsById);
};

// ---------- Progress & quizzes (owner + active only) ----------

const loadOwnActive = async (requester, id, subjectId) => {
  const subscription = await findSubscription(id);
  if (!sameId(subscription.userId, requester.id)) {
    throw new ApiError(403, "You are not allowed to access this subscription");
  }
  if (subscription.status !== "active") {
    throw new ApiError(403, `Subscription is ${subscription.status}`);
  }

  const entry = subscription.enrollment.subjects.find((item) => sameId(item.subjectId, subjectId));
  if (!entry) throw new ApiError(404, "Subject is not part of this subscription");

  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, "Subject not found");
  syncNewLectures(subscription, new Map([[String(subject._id), subject]]));

  return { subscription, entry, subject };
};

const loadLectureProgress = async (requester, id, subjectId, lectureId) => {
  const context = await loadOwnActive(requester, id, subjectId);
  const lecture = context.subject.lectures.id(lectureId);
  const progress = context.entry.lectures.find((item) => sameId(item.lectureId, lectureId));
  if (!lecture || !progress) throw new ApiError(404, "Lecture is not part of this subscription");
  return { ...context, lecture, progress };
};

const completeLecture = async (requester, id, subjectId, lectureId) => {
  const { subscription, progress } = await loadLectureProgress(requester, id, subjectId, lectureId);
  if (!progress.completed) {
    progress.completed = true;
    progress.completedAt = new Date();
  }
  await subscription.save();
  return { lectureId: progress.lectureId, completed: progress.completed, completedAt: progress.completedAt };
};

// Grades on the server against the subject's correct answers; unanswered questions count as wrong.
const gradeQuiz = (quiz, submitted) => {
  const selectedById = new Map();
  for (const { questionId, selectedAnswer } of submitted) {
    if (!quiz.questions.id(questionId)) {
      throw new ApiError(400, `Question ${questionId} is not part of this quiz`);
    }
    if (selectedById.has(String(questionId))) {
      throw new ApiError(400, `Question ${questionId} is answered more than once`);
    }
    selectedById.set(String(questionId), selectedAnswer);
  }

  const answers = quiz.questions.map((question) => {
    const selectedAnswer = selectedById.get(String(question._id)) ?? null;
    return { questionId: question._id, selectedAnswer, isCorrect: selectedAnswer === question.correctAnswer };
  });

  return {
    answers,
    score: answers.filter((answer) => answer.isCorrect).length,
    total: answers.length,
    submittedAt: new Date(),
  };
};

const submitLectureQuiz = async (requester, id, subjectId, lectureId, answers) => {
  const { subscription, lecture, progress } = await loadLectureProgress(
    requester,
    id,
    subjectId,
    lectureId
  );
  if (!lecture.quiz) throw new ApiError(404, "This lecture has no quiz");
  if (progress.quizAttempt) throw new ApiError(409, "Quiz already submitted");

  progress.quizAttempt = gradeQuiz(lecture.quiz, answers);
  await subscription.save();
  return attemptDetail(progress.quizAttempt, lecture.quiz);
};

const submitFinalQuiz = async (requester, id, subjectId, answers) => {
  const { subscription, entry, subject } = await loadOwnActive(requester, id, subjectId);
  if (!entry.fullAccess) throw new ApiError(403, "Final quiz requires a full subject subscription");
  if (!subject.finalQuiz) throw new ApiError(404, "This subject has no final quiz");
  if (entry.finalQuizAttempt) throw new ApiError(409, "Final quiz already submitted");

  entry.finalQuizAttempt = gradeQuiz(subject.finalQuiz, answers);
  await subscription.save();
  return attemptDetail(entry.finalQuizAttempt, subject.finalQuiz);
};

// Admin grants access without a request. durationDays overrides the subject/package duration.
const grantAccess = async ({ userId, subjectId, lectureId, packageId, durationDays }) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "student") throw new ApiError(400, "Access can only be granted to a student");
  if (user.status !== "active") throw new ApiError(409, "Account is disabled");

  const built = await buildEnrollment({ subjectId, lectureId, packageId });
  await carryOverProgress(userId, built.subjects);

  const startedAt = new Date();
  return Subscription.create({
    userId,
    subjectId: subjectId || null,
    lectureId: lectureId || null,
    packageId: packageId || null,
    source: "admin",
    startedAt,
    endAt: addDays(startedAt, durationDays ?? built.durationDays),
    status: "active",
    enrollment: { subjects: built.subjects },
  });
};

const cancelSubscription = async (id) => {
  const subscription = await findSubscription(id);
  if (subscription.status !== "active") {
    throw new ApiError(409, `Subscription is ${subscription.status} and cannot be cancelled`);
  }
  subscription.status = "cancelled";
  await subscription.save();
  const subjectsById = await loadSubjects([subscription]);
  return summaryView(subscription, subjectsById);
};

// ---------- Content access ----------

// What a student can open in a subject through their active subscriptions.
const getAccess = async (userId, subjectId) => {
  await expireOverdue({ userId });
  const subscriptions = await Subscription.find({
    userId,
    status: "active",
    "enrollment.subjects.subjectId": subjectId,
  });

  const lectureIds = new Set();
  for (const subscription of subscriptions) {
    for (const entry of subscription.enrollment.subjects) {
      if (!sameId(entry.subjectId, subjectId)) continue;
      if (entry.fullAccess) return { fullAccess: true, lectureIds };
      entry.lectures.forEach((lecture) => lectureIds.add(String(lecture.lectureId)));
    }
  }
  return { fullAccess: false, lectureIds };
};

const canOpenLecture = async (userId, subjectId, lectureId) => {
  const access = await getAccess(userId, subjectId);
  return access.fullAccess || access.lectureIds.has(String(lectureId));
};

export {
  createFromRequest,
  getMySubscriptions,
  getAllSubscriptions,
  getSubscription,
  completeLecture,
  submitLectureQuiz,
  submitFinalQuiz,
  grantAccess,
  cancelSubscription,
  getAccess,
  canOpenLecture,
};
