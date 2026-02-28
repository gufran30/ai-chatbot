const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const {
  createVectorMemory,
  queryMemory,
} = require("../services/vector.service");

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

        // saving user message in MongoDB, in order to maintain history
        const userMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: content,
          role: "user",
        });

        // creating vector & long-term-memory in PineCone DB
        const vectors = await aiService.generateVector(content);

        console.log("Vector length check:", vectors?.length); // Should be a number (e.g., 768)
        console.log("Is vector an array?", Array.isArray(vectors));

        // create vector memory
        const vectorMemory = await queryMemory({
          queryVector: vectors,
          limit: 3,
          metadata: {},
        });

        console.log("vectorMemory --->", vectorMemory);

        // saving user message (with vector) to Pinecone DB
        await createVectorMemory({
          vectors,
          messageId: userMessage._id,
          metadata: {
            chat: chatId,
            user: socket.user._id.toString(), // Convert ObjectId to string for Pinecone
            text: content,
          },
        });

        // Maintain Chat History - (short-term-memory)
        const chatHistory = (
          await messageModel
            .find({
              chat: chatId,
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();

        const aiResponse = await aiService.generateResponse(
          chatHistory.map((item) => {
            return {
              role: item.role,
              parts: [{ text: item.content }],
            };
          }),
        );
        console.log("Gemini AI Response --->", aiResponse);

        // saving ai response message in MongoDB, in order to maintain history
        const aiMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: aiResponse,
          role: "model",
        });

        // saving vector message
        const vectorResponse = await aiService.generateVector(aiResponse);

        // saving ai message (with vector) to Pinecone DB
        await createVectorMemory({
          vectors: vectorResponse,
          messageId: aiMessage._id,
          metadata: {
            chat: chatId,
            user: socket.user._id.toString(), // Convert ObjectId to string for Pinecone
            text: aiResponse,
          },
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
