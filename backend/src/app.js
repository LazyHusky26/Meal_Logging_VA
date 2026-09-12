import express from "express";
import cors from "cors";
import foodsRouter from "./routes/foods.js";
import mealsRouter from "./routes/meals.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/foods", foodsRouter);
  app.use("/api/meals", mealsRouter);

  return app;
}
