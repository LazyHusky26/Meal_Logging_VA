import express from "express";
import cors from "cors";
import foodsRouter from "./routes/foods.js";
import mealsRouter from "./routes/meals.js";
import voiceRouter from "./routes/voice.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/foods", foodsRouter);
  app.use("/api/meals", mealsRouter);
  app.use("/api/voice", voiceRouter);

  return app;
}
