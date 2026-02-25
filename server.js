require("dotenv").config();

const app = require("./src/app");
const PORT = 3000;
const connectDB = require("./src/db/db");

connectDB();

app.get("/", (req, res) => {
  res.json({ msg: "Hi there" });
});

app.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}`);
});
