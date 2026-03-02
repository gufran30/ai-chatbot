require("dotenv").config();

const app = require("./src/app");
const PORT = 3000;
const connectDB = require("./src/db/db");
const initSocketServer = require("./src/sockets/socket.server");
const httpServer = require("http").createServer(app);

connectDB();
initSocketServer(httpServer);

app.get("/", (req, res) => {
  res.json({ msg: "Hi there" });
});

httpServer.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}`);
});
