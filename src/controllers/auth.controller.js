const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUserController(req, res) {
  try {
    const {
      fullName: { firstName, lastName },
      email,
      password,
    } = req.body;

    const isUserEmailAlreadyExist = await userModel.findOne({ email });

    if (isUserEmailAlreadyExist) {
      return res.status(409).json({ message: "User already exist " });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      fullName: { firstName, lastName },
      email,
      password: hashPassword,
    });

    const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.cookie("userToken", userToken);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        email: user.email,
        id: user._id,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.log("Registeration Error", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error });
  }
}

async function loginUserControllers(req, res) {
  const { email, password } = req.body;

  const isUserExist = await userModel.findOne({ email });

  if (!isUserExist) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isValidPassword = await bcrypt.compare(password, isUserExist.password);

  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const userToken = jwt.sign({ id: isUserExist._id }, process.env.JWT_SECRET);

  res.cookie("userToken", userToken);

  res.status(200).json({
    message: "User logged in successfully",
    isUserExist: {
      email: isUserExist.email,
      id: isUserExist._id,
      fullName: isUserExist.fullName,
    },
  });
}

module.exports = {
  registerUserController,
  loginUserControllers,
};
