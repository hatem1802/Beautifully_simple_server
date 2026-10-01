import { Package, Request, Subject } from "../../models/index.js";
import { ApiError, pageMeta, paginate, removeFile, toFilePath } from "../../utils/index.js";
import { createFromRequest } from "../subscriptions/subscriptions.service.js";

const isAdmin = (requester) => requester.role === "admin";

const assertCanAccess = (requester, request) => {
  if (!isAdmin(requester) && request.userId.toString() !== requester.id) {
    throw new ApiError(403, "You are not allowed to access this request");
  }
};

// Checks the subject / lecture / package exists and returns exactly one target.
const resolveTarget = async ({ subjectId, lectureId, packageId }) => {
  if (packageId) {
    const pkg = await Package.findById(packageId).select("status");
    // Drafts stay hidden: a student can only request a published package.
    if (!pkg || pkg.status !== "published") throw new ApiError(404, "Package not found");
    return { subjectId: null, lectureId: null, packageId };
  }

  const subject = await Subject.findById(subjectId).select("lectures._id");
  if (!subject) throw new ApiError(404, "Subject not found");
  if (lectureId && !subject.lectures.id(lectureId)) {
    throw new ApiError(404, "Lecture not found in this subject");
  }

  return { subjectId, lectureId: lectureId || null, packageId: null };
};

const findRequest = async (id) => {
  const request = await Request.findById(id);
  if (!request) throw new ApiError(404, "Request not found");
  return request;
};

const createRequest = async (userId, data, file) => {
  const target = await resolveTarget(data);

  return Request.create({
    userId,
    ...target,
    paymentProof: toFilePath(file),
    notes: data.notes,
    // Always starts as reviewing, whatever the body says.
    status: "reviewing",
  });
};

const pagedRequests = async (filter, query) => {
  const { page, limit, skip } = paginate(query);
  const [total, requests] = await Promise.all([
    Request.countDocuments(filter),
    Request.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
  ]);
  return { requests, pagination: pageMeta(page, limit, total) };
};

const getAllRequests = (query) => pagedRequests(query.status ? { status: query.status } : {}, query);

const getRequestsByUser = async (requester, userId, query) => {
  if (!isAdmin(requester) && requester.id !== userId) {
    throw new ApiError(403, "You are not allowed to access these requests");
  }
  return pagedRequests({ userId }, query);
};

const getRequestById = async (requester, id) => {
  const request = await findRequest(id);
  assertCanAccess(requester, request);
  return request;
};

// Student only: status changes go through reviewRequest.
const updateRequest = async (requester, id, data, file) => {
  const request = await findRequest(id);
  assertCanAccess(requester, request);
  if (request.status !== "returned") {
    throw new ApiError(409, "Only returned requests can be edited");
  }

  if (["subjectId", "lectureId", "packageId"].some((field) => data[field])) {
    Object.assign(request, await resolveTarget(data));
  }
  if (data.notes !== undefined) request.notes = data.notes;

  const oldProof = file ? request.paymentProof : null;
  if (file) request.paymentProof = toFilePath(file);
  request.status = "reviewing";

  await request.save();
  // Delete the old image only after the new one is saved.
  await removeFile(oldProof);
  return request;
};

// No replica set, so no transaction: the request is claimed atomically (only while "reviewing"),
// and put back to "reviewing" if creating the subscription fails.
const reviewRequest = async (id, { decision, adminNotes = "" }) => {
  const previous = await Request.findOneAndUpdate(
    { _id: id, status: "reviewing" },
    { $set: { status: decision, adminNotes, reviewedAt: new Date() } },
    { returnDocument: "before" }
  );
  if (!previous) {
    await findRequest(id);
    throw new ApiError(409, "Only requests under review can be reviewed");
  }

  if (decision !== "approved") return { request: await findRequest(id), subscription: null };

  try {
    const subscription = await createFromRequest(previous);
    return { request: await findRequest(id), subscription };
  } catch (error) {
    await Request.updateOne(
      { _id: id },
      { $set: { status: "reviewing", adminNotes: previous.adminNotes, reviewedAt: previous.reviewedAt } }
    );
    throw error;
  }
};

// The student withdraws their own request while it is still open (reviewing or returned).
const cancelRequest = async (requester, id) => {
  const request = await findRequest(id);
  assertCanAccess(requester, request);
  if (!["reviewing", "returned"].includes(request.status)) {
    throw new ApiError(409, "Only open requests can be cancelled");
  }
  request.status = "cancelled";
  return request.save();
};

const deleteRequest = async (id) => {
  const request = await findRequest(id);
  if (request.status === "approved") {
    throw new ApiError(409, "Approved requests are linked to a subscription and cannot be deleted");
  }
  await request.deleteOne();
  await removeFile(request.paymentProof);
  return request;
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
