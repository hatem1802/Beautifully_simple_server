import { ApiResponse } from "../../utils/index.js";
import * as subscriptionsService from "./subscriptions.service.js";

const send = (res, statusCode, data, message) =>
  res.status(statusCode).json(new ApiResponse(statusCode, data, message));

const getMySubscriptions = async (req, res) => {
  const result = await subscriptionsService.getMySubscriptions(req.user.id, req.query);
  send(res, 200, result, "Subscriptions fetched successfully");
};

const getAllSubscriptions = async (req, res) => {
  const result = await subscriptionsService.getAllSubscriptions(req.query);
  send(res, 200, result, "Subscriptions fetched successfully");
};

const grantAccess = async (req, res) => {
  const subscription = await subscriptionsService.grantAccess(req.body);
  send(res, 201, { subscription }, "Access granted successfully");
};

const cancelSubscription = async (req, res) => {
  const subscription = await subscriptionsService.cancelSubscription(req.params.id);
  send(res, 200, { subscription }, "Subscription cancelled successfully");
};

const getSubscription = async (req, res) => {
  const subscription = await subscriptionsService.getSubscription(req.user, req.params.id);
  send(res, 200, { subscription }, "Subscription fetched successfully");
};

const completeLecture = async (req, res) => {
  const { id, subjectId, lectureId } = req.params;
  const progress = await subscriptionsService.completeLecture(req.user, id, subjectId, lectureId);
  send(res, 200, { progress }, "Lecture marked as completed");
};

const submitLectureQuiz = async (req, res) => {
  const { id, subjectId, lectureId } = req.params;
  const attempt = await subscriptionsService.submitLectureQuiz(
    req.user,
    id,
    subjectId,
    lectureId,
    req.body.answers
  );
  send(res, 201, { attempt }, "Quiz submitted successfully");
};

const submitFinalQuiz = async (req, res) => {
  const { id, subjectId } = req.params;
  const attempt = await subscriptionsService.submitFinalQuiz(req.user, id, subjectId, req.body.answers);
  send(res, 201, { attempt }, "Final quiz submitted successfully");
};

export {
  getMySubscriptions,
  getAllSubscriptions,
  getSubscription,
  grantAccess,
  cancelSubscription,
  completeLecture,
  submitLectureQuiz,
  submitFinalQuiz,
};
