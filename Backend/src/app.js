const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

/* Routes */
const authRoutes = require("./routes/auth.route");
const chatRoutes = require("./routes/chat.route");

const app = express();

// CORS configuration for allowing requests from the frontend because they are on different origins (ports).
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies to be sent
  }),
);

// using middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Using Routes */

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

module.exports = app;
