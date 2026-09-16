import { ApiResponse } from "../../utils/index.js";

const getHealth = (req, res) => {
  res.status(200).json(new ApiResponse(200, { status: "ok" }, "Server is healthy"));
};

export { getHealth };
