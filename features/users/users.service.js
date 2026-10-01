import jwt from "jsonwebtoken";
import { User } from "../../models/index.js";
import { ApiError, pageMeta, paginate } from "../../utils/index.js";

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, "JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "3d" }
  );
};

const register = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await User.create({ name, email, password, role: "student" });
  return user.toPublic();
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.status === "disabled") {
    throw new ApiError(403, "Account is disabled");
  }

  const token = signToken(user);

  return {
    token,
    user: user.toPublic(),
  };
};

const findUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

const getMe = (userId) => findUser(userId).then((user) => user.toPublic());

// Student: name, phone, and password (password needs the current one).
const updateMe = async (userId, { name, phone, password, currentPassword }) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  if (password) {
    const matches = await user.comparePassword(currentPassword ?? "");
    if (!matches) throw new ApiError(400, "Current password is incorrect");
    user.password = password;
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  return user.toPublic();
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listUsers = async (query) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const { page, limit, skip } = paginate(query);
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
  ]);

  return { users: users.map((user) => user.toPublic()), pagination: pageMeta(page, limit, total) };
};

const getUser = async (id) => (await findUser(id)).toPublic();

const updateUser = async (id, { name, phone }) => {
  const user = await findUser(id);
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  await user.save();
  return user.toPublic();
};

const setUserStatus = async (requesterId, id, status) => {
  if (requesterId === id) {
    throw new ApiError(409, "You cannot change your own account status");
  }
  const user = await findUser(id);
  user.status = status;
  await user.save();
  return user.toPublic();
};

export { register, login, getMe, updateMe, listUsers, getUser, updateUser, setUserStatus };
