import express from "express";
import db from "./db/database.js";

const app = express();

app.use(express.json());

app.get("/health", (_, res) => {
  const result = db.prepare("SELECT 1 as ok").get();

  res.status(200).json({
    success: true,
    message: "server running",
    database: result.ok === 1 ? "connected" : "error",
  });
});

export default app;
