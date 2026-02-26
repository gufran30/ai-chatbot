const chatModel = require("../models/chat.model");

async function createChat(req, res) {
  try {
    const { title } = req.body;
    const user = req.user;

    const chat = await chatModel.create({
      user: user._id,
      title,
    });

    return res.status(201).json({
      message: "Chat created successfully",
      chat: {
        id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        user: chat.user,
      },
    });
  } catch (error) {
    console.log("Chat Error", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error });
  }
}

module.exports = {
  createChat,
};
