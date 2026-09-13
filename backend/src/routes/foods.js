import { Router } from "express";
import { findFoodById, listAllFoods, searchFoods } from "../services/foodsService.js";

const router = Router();

router.get("/", (req, res) => {
  const { query } = req.query;
  const results = query ? searchFoods(query) : listAllFoods();
  res.json(results);
});

router.get("/:id", (req, res) => {
  const food = findFoodById(req.params.id);
  if (!food) {
    return res.status(404).json({ error: "FOOD_NOT_FOUND" });
  }
  res.json(food);
});

export default router;
