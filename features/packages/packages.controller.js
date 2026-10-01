import { ApiResponse } from "../../utils/index.js";
import * as packagesService from "./packages.service.js";

const send = (res, statusCode, data, message) =>
  res.status(statusCode).json(new ApiResponse(statusCode, data, message));

const listPackages = async (req, res) => {
  const result = await packagesService.listPackages(req.user, req.query);
  send(res, 200, result, "Packages fetched successfully");
};

const getPackage = async (req, res) => {
  const pkg = await packagesService.getPackage(req.user, req.params.id);
  send(res, 200, { package: pkg }, "Package fetched successfully");
};

const createPackage = async (req, res) => {
  const pkg = await packagesService.createPackage(req.body);
  send(res, 201, { package: pkg }, "Package created successfully");
};

const updatePackage = async (req, res) => {
  const pkg = await packagesService.updatePackage(req.params.id, req.body);
  send(res, 200, { package: pkg }, "Package updated successfully");
};

const deletePackage = async (req, res) => {
  await packagesService.deletePackage(req.params.id);
  send(res, 200, null, "Package deleted successfully");
};

export { listPackages, getPackage, createPackage, updatePackage, deletePackage };
