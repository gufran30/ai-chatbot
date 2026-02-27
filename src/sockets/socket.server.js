const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    if (!cookies.userToken) {
      return next(new Error("Authentication error: No token provided"));
    }

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
    socket.on("ai-message", async (messagePayload) => {
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

        // Maintain Chat History
        const chatHistory = (await messageModel.find({
          chat: chatId,
        }).sort({ createdAt: -1}).limit(20).lean()).reverse();
        // console.log("Chat history --->", chatHistory);

        // seeing chatHistory with main stuffs (like role & content is necessary here to fetch)
        // now you can pass this chat history to ai-model for retain short-term-history reference
        // console.log(
        //   "Chat history --->",
        //   chatHistory.map((item) => {
        //     return {
        //       role: item.role,
        //       parts: [{ text: item.content }],
        //     };
        //   }),
        // );

        // saving user message in DB, in order to maintain history
        await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: content,
          role: "user",
        });

        const aiResponse = await aiService.generateResponse(
          chatHistory.map((item) => {
            return {
              role: item.role,
              parts: [{ text: item.content }],
            };
          }),
        );
        console.log("Gemini AI Response --->", aiResponse);

        // saving ai response message in DB, in order to maintain history
        await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: aiResponse,
          role: "model",
        });

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
