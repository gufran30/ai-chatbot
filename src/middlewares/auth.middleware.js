const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authUser(req, res, next) {
  const { userToken } = req.cookies;

  if (!userToken) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);

    // Find user but EXCLUDE password for security
    const user = await userModel.findById(decodedToken.id).select("-password");

    // Check if user actually exists in DB
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User no longer exists" });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    // Handle specific JWT errors (Optional but helpful)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

module.exports = {
  authUser,
};
