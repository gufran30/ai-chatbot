const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  /* socket middleware */
  io.use(async (socket, next) => {
    // accessing cookie (userToken from postman)
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    // if user token not provided
    if (!cookies.userToken) {
      return next(new Error("Authentication error: No token provided"));
    }

    // user token provided, so verifying user token
    try {
      const decoded = jwt.verify(cookies.userToken, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);
      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // console.log("User connected --->", socket.user);
    // console.log("New Socket connection established", socket.id);

    // "ai-message" is an Event listener
    socket.on("ai-message", async (messagePayload) => {
      /* 
      
      messagePayload = { 
        "chatId": "69a0513ec5f6b76a0f9eff33",
        "content": "Hello AI."
      } ===> from postman it is coming as "string" but it should be "object", so we have to parse it.
      
      */

      try {
        let data =
          typeof messagePayload === "string"
            ? JSON.parse(messagePayload)
            : messagePayload;

        console.log("Parsed Data (socket.server.js) --->", data);

        const { content, chatId } = data;
        console.log("Extracted Content --->", content);

        if (!content) {
          return socket.emit("error", { message: "Content is required" });
        }

        // saving user message in DB, in order to maintain history
        await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: content,
          role: "user",
        });

        const aiResponse = await aiService.generateResponse(content);
        console.log("Gemini AI Response --->", aiResponse);

        // saving ai response message in DB, in order to maintain history
        await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: aiResponse,
          role: "model",
        });

        // sending ai-response to user
        socket.emit("ai-response", {
          content: aiResponse,
          chatId: chatId,
        });
      } catch (error) {
        console.error("Socket Payload Error:", error.message);
      }
    });
  });
}

module.exports = initSocketServer;
