import { ApiResponse } from "../../utils/index.js";
import * as usersService from "./users.service.js";

const register = async (req, res) => {
  const user = await usersService.register(req.body);
  res.status(201).json(new ApiResponse(201, { user }, "User registered successfully"));
};

const login = async (req, res) => {
  const data = await usersService.login(req.body);
  res.status(200).json(new ApiResponse(200, data, "Login successful"));
};

const getMe = async (req, res) => {
  const user = await usersService.getMe(req.user.id);
  res.status(200).json(new ApiResponse(200, { user }, "Profile fetched successfully"));
};

const updateMe = async (req, res) => {
  const user = await usersService.updateMe(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, { user }, "Profile updated successfully"));
};

const listUsers = async (req, res) => {
  const result = await usersService.listUsers(req.query);
  res.status(200).json(new ApiResponse(200, result, "Users fetched successfully"));
};

const getUser = async (req, res) => {
  const user = await usersService.getUser(req.params.id);
  res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"));
};

const updateUser = async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { user }, "User updated successfully"));
};

const setUserStatus = async (req, res) => {
  const user = await usersService.setUserStatus(req.user.id, req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, { user }, "User status updated successfully"));
};

export { register, login, getMe, updateMe, listUsers, getUser, updateUser, setUserStatus };
