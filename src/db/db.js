const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB")
  } catch (error) {
    console.log(
      `Something went wrong while connecting to db, \nerror: ${error}`,
    );
  }
}

module.exports = connectDB;
