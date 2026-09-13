import { Router } from "express";
import { findFoodById, listAllFoods, searchFoods } from "../services/foodsService.js";

const router = Router();

// GET /api/foods?query=dal -> matches; no query -> full list
router.get("/", (req, res) => {
  const { query } = req.query;
  const results = query ? searchFoods(query) : listAllFoods();
  res.json(results);
});

// GET /api/foods/:id -> single food record, including its valid units
// (used by the frontend to populate the unit dropdown when editing an entry)
router.get("/:id", (req, res) => {
  const food = findFoodById(req.params.id);
  if (!food) {
    return res.status(404).json({ error: "FOOD_NOT_FOUND" });
  }
  res.json(food);
});

export default router;
