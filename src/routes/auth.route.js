const express = require("express");
const authControllers = require("../controllers/auth.controller");
const router = express.Router();

router.post("/register", authControllers.registerUserController);
router.post("/login", authControllers.loginUserControllers);

module.exports = router;
