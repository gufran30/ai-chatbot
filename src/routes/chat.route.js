const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const chatMiddleware = require("../controllers/chat.controller");

const router = express.Router();

/* POST /api/chat/ */
router.post("/", authMiddleware.authUser, chatMiddleware.createChat);

module.exports = router;
