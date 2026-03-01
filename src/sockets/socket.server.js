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

        /* 
        // saving user message in MongoDB
        const userMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: content,
          role: "user",
        });

        // generating vector 
        const vectors = await aiService.generateVector(content);

        // saving user message (with vector) to Pinecone DB
        await createVectorMemory({
          vectors,
          messageId: userMessage._id,
          metadata: {
            chat: chatId,
            user: socket.user._id,
            text: content,
          },
        });
        */

        // These two tasks are independent to each other. So, we can combine them to do work at the same time
        const [userMessage, vectors] = await Promise.all([
          // saving user message in MongoDB
          messageModel.create({
            chat: chatId,
            user: socket.user._id,
            content: content,
            role: "user",
          }),

          // generating vector
          aiService.generateVector(content),
        ]);

        // saving user message (with vector) to Pinecone DB
          await createVectorMemory({
            vectors,
            messageId: userMessage._id,
            metadata: {
              chat: chatId,
              user: socket.user._id,
              text: content,
            },
          });

        /*
        // query in Pinecone
        const vectorMemory = await queryMemory({
          queryVector: vectors,
          limit: 3,
          metadata: {
            user: socket.user._id,
          },
        });

        // Maintain Chat History - (short-term-memory) - retrieve chat history
        const chatHistory = (
          await messageModel
            .find({
              chat: chatId,
            })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        ).reverse();
        */

        // Here both tasks are independent to each other. So, we can combine them to do work at the same time
        const [vectorMemory, chatHistory] = await Promise.all([
          // query in Pinecone
          await queryMemory({
            queryVector: vectors,
            limit: 3,
            metadata: {
              user: socket.user._id,
            },
          }),

          // Maintain Chat History - (short-term-memory) - retrieve chat history
          (
            await messageModel
              .find({
                chat: chatId,
              })
              .sort({ createdAt: -1 })
              .limit(20)
              .lean()
          ).reverse(),
        ]);

        const shortTermMemory = chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.content }],
          };
        });

        const longTermMemory = [
          {
            role: "user",
            parts: [
              {
                text: `
                  These are some previous messages from the chat, use them to generate a response
                  ${vectorMemory.map((item) => item.metadata.text).join("\n")}
                `,
              },
            ],
          },
        ];

        const aiResponse = await aiService.generateResponse([
          ...longTermMemory,
          ...shortTermMemory,
        ]);

        socket.emit("ai-response", {
          content: aiResponse,
          chatId: chatId,
        });

        /* 
        // saving ai response message in MongoDB
        const aiMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: aiResponse,
          role: "model",
        });

        // saving vector message
        const vectorResponse = await aiService.generateVector(aiResponse);
        */

        const [aiMessage, vectorResponse] = await Promise.all([
          // saving ai response message in MongoDB
          messageModel.create({
            chat: chatId,
            user: socket.user._id,
            content: aiResponse,
            role: "model",
          }),

          // saving vector message
          aiService.generateVector(aiResponse),
        ]);

        // saving ai message (with vector) to Pinecone DB
        await createVectorMemory({
          vectors: vectorResponse,
          messageId: aiMessage._id,
          metadata: {
            chat: chatId,
            user: socket.user._id,
            text: aiResponse,
          },
        });
      } catch (error) {
        console.error("Socket Payload Error:", error.message);
      }
    });
  });
}

module.exports = initSocketServer;
