import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoute from "./routes/auth.route.js";
import topicRoute from "./routes/topic.route.js";
import lessonRoute from "./routes/lesson.route.js";
import userRoute from "./routes/user.route.js";
import practiceRoute from "./routes/practice.route.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middleware/auth.middleware.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// public routes (contains public GET + protected POST/PATCH/DELETE)
app.use("/api/auth", authRoute);
app.use("/api/topics", topicRoute);
app.use("/api/lessons", lessonRoute);

// private routes (all endpoints require auth)
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/practices", practiceRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});

