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

export { register, login };
