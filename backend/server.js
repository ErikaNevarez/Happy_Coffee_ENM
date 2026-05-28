import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.conf.js";
import apiRoutes from "./src/routes/index.js";

dotenv.config();

const app = express();
connectDB();

app.use(express.json());

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:4200,http://localhost:58810").split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} is not allowed`));
      }
    },
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
