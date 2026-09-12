import { Router } from "express";
import { listAllFoods, searchFoods } from "../services/foodsService.js";

const router = Router();

// GET /api/foods?query=dal -> matches; no query -> full list
router.get("/", (req, res) => {
  const { query } = req.query;
  const results = query ? searchFoods(query) : listAllFoods();
  res.json(results);
});

export default router;
