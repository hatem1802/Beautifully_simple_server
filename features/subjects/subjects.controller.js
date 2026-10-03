import fs from "node:fs";
import { User } from "../../models/index.js";
import { ApiResponse, readOriginalPdf, stampPdf } from "../../utils/index.js";
import * as subjectsService from "./subjects.service.js";

const send = (res, statusCode, data, message) =>
  res.status(statusCode).json(new ApiResponse(statusCode, data, message));

const loadLecture = async (req, res, next) => {
  const { subject, lecture } = await subjectsService.findLecture(
    req.params.subjectId,
    req.params.lectureId
  );
  req.subject = subject;
  req.lecture = lecture;
  next();
};

const createSubject = async (req, res) => {
  const subject = await subjectsService.createSubject(req.body, req.files);
  send(res, 201, { subject }, "Subject created successfully");
};

const listSubjects = async (req, res) => {
  const result = await subjectsService.listSubjects(req.user, req.query);
  send(res, 200, result, "Subjects fetched successfully");
};

const getSubject = async (req, res) => {
  const subject = await subjectsService.getSubject(req.user, req.params.subjectId);
  send(res, 200, { subject }, "Subject fetched successfully");
};

const updateSubject = async (req, res) => {
  const subject = await subjectsService.updateSubject(req.params.subjectId, req.body);
  send(res, 200, { subject }, "Subject updated successfully");
};

const deleteSubject = async (req, res) => {
  await subjectsService.deleteSubject(req.params.subjectId);
  send(res, 200, null, "Subject deleted successfully");
};

const setFinalQuiz = async (req, res) => {
  const finalQuiz = await subjectsService.setFinalQuiz(req.params.subjectId, req.body);
  send(res, 200, { finalQuiz }, "Final quiz saved successfully");
};

const removeFinalQuiz = async (req, res) => {
  await subjectsService.removeFinalQuiz(req.params.subjectId);
  send(res, 200, null, "Final quiz removed successfully");
};

const addLecture = async (req, res) => {
  const lecture = await subjectsService.addLecture(req.params.subjectId, req.body, req.files);
  send(res, 201, { lecture }, "Lecture added successfully");
};

const updateLecture = async (req, res) => {
  const { subjectId, lectureId } = req.params;
  const lecture = await subjectsService.updateLecture(subjectId, lectureId, req.body);
  send(res, 200, { lecture }, "Lecture updated successfully");
};

const deleteLecture = async (req, res) => {
  await subjectsService.deleteLecture(req.params.subjectId, req.params.lectureId);
  send(res, 200, null, "Lecture deleted successfully");
};

const setLectureQuiz = async (req, res) => {
  const { subjectId, lectureId } = req.params;
  const quiz = await subjectsService.setLectureQuiz(subjectId, lectureId, req.body);
  send(res, 200, { quiz }, "Lecture quiz saved successfully");
};

const removeLectureQuiz = async (req, res) => {
  await subjectsService.removeLectureQuiz(req.params.subjectId, req.params.lectureId);
  send(res, 200, null, "Lecture quiz removed successfully");
};

const addLectureFiles = async (req, res) => {
  const files = await subjectsService.addLectureFiles(req.subject, req.lecture, req.files);
  send(res, 201, { files }, "Files uploaded successfully");
};

const deleteLectureFile = async (req, res) => {
  const { subjectId, lectureId, fileId } = req.params;
  await subjectsService.deleteLectureFile(subjectId, lectureId, fileId);
  send(res, 200, null, "File deleted successfully");
};

const getLectureContent = async (req, res) => {
  const { subjectId, lectureId } = req.params;
  const lecture = await subjectsService.getLectureContent(req.user, subjectId, lectureId);
  send(res, 200, { lecture }, "Lecture fetched successfully");
};

const getFinalQuizContent = async (req, res) => {
  const finalQuiz = await subjectsService.getFinalQuizContent(req.user, req.params.subjectId);
  send(res, 200, { finalQuiz }, "Final quiz fetched successfully");
};

const sendLectureFile = async (res, requester, file, disposition) => {
  const filename = file.name.replace(/"/g, "");
  const viewer = await User.findById(requester.id).select("name email").lean();
  const original = file.url ? await readOriginalPdf(file.url) : await fs.promises.readFile(file.path);
  const stamped = await stampPdf(original, { name: viewer?.name, email: viewer?.email });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
  res.send(stamped);
};

// Opens the PDF in the browser for an admin or a subscribed student.
const viewLectureFile = async (req, res) => {
  const { subjectId, lectureId, fileId } = req.params;
  const file = await subjectsService.getLectureFile(req.user, subjectId, lectureId, fileId);
  await sendLectureFile(res, req.user, file, "inline");
};

// Saves the PDF. Admin only; students keep the view route.
const downloadLectureFile = async (req, res) => {
  const { subjectId, lectureId, fileId } = req.params;
  const file = await subjectsService.getLectureFile(req.user, subjectId, lectureId, fileId, {
    adminOnly: true,
  });
  await sendLectureFile(res, req.user, file, "attachment");
};

export {
  loadLecture,
  getLectureContent,
  getFinalQuizContent,
  viewLectureFile,
  downloadLectureFile,
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
};
