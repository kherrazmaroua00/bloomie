require("dotenv").config({ quiet: true });
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const moodRoutes = require("./routes/moods");
const diaryRoutes = require("./routes/diary");
const focusSessionRoutes = require("./routes/focusSessions");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/focus-sessions", focusSessionRoutes);

app.get("/", (req, res) => {
  res.send("Bloomie backend is running ✅");
});

app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});