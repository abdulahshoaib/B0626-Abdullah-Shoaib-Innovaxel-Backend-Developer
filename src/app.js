import express from "express";
import db from "./db/database.js";
import eventRoutes from "./routes/event.routes.js";
import registerRoutes from "./routes/register.routes.js";

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

app.use("/events", eventRoutes);
app.use("/events/reg", registerRoutes);

export default app;
