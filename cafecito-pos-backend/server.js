import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.conf.js";
import apiRoutes from "./src/routes/index.js";

dotenv.config();

const app = express();
connectDB();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
  }),
);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port: ${process.env.PORT}`);
});
