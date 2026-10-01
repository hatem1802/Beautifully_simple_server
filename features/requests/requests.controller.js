import { ApiResponse } from "../../utils/index.js";
import * as requestsService from "./requests.service.js";

const createRequest = async (req, res) => {
  const request = await requestsService.createRequest(req.user.id, req.body ?? {}, req.file);
  res.status(201).json(new ApiResponse(201, { request }, "Request created successfully"));
};

const getAllRequests = async (req, res) => {
  const result = await requestsService.getAllRequests(req.query);
  res.status(200).json(new ApiResponse(200, result, "Requests fetched successfully"));
};

const getRequestsByUser = async (req, res) => {
  const result = await requestsService.getRequestsByUser(req.user, req.params.userId, req.query);
  res.status(200).json(new ApiResponse(200, result, "Requests fetched successfully"));
};

const getRequestById = async (req, res) => {
  const request = await requestsService.getRequestById(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, { request }, "Request fetched successfully"));
};

const updateRequest = async (req, res) => {
  const request = await requestsService.updateRequest(
    req.user,
    req.params.id,
    req.body ?? {},
    req.file
  );
  res.status(200).json(new ApiResponse(200, { request }, "Request updated successfully"));
};

const reviewRequest = async (req, res) => {
  const result = await requestsService.reviewRequest(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, `Request ${req.body.decision} successfully`));
};

const cancelRequest = async (req, res) => {
  const request = await requestsService.cancelRequest(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, { request }, "Request cancelled successfully"));
};

const deleteRequest = async (req, res) => {
  await requestsService.deleteRequest(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Request deleted successfully"));
};

export {
  createRequest,
  getAllRequests,
  getRequestsByUser,
  getRequestById,
  updateRequest,
  reviewRequest,
  cancelRequest,
  deleteRequest,
};
