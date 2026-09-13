import { Router } from "express";
import MealLog from "../models/MealLog.js";
import { resolveMealItem } from "../services/foodsService.js";
import { broadcastMealsChanged } from "../services/sseHub.js";

const router = Router();

function dayRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return { start, end };
}

router.get("/", async (req, res) => {
  const { date, from, to, food, limit, sort } = req.query;
  const filter = {};

  if (date) {
    const { start, end } = dayRange(date);
    filter.loggedAt = { $gte: start, $lte: end };
  }
  if (from || to) {
    filter.loggedAt = filter.loggedAt || {};
    if (from) filter.loggedAt.$gte = new Date(from);
    if (to) filter.loggedAt.$lte = new Date(to);
  }
  if (food) {
    filter.foodName = { $regex: food, $options: "i" };
  }

  const sortField = sort === "createdAt" ? "createdAt" : "loggedAt";

  const meals = await MealLog.find(filter)
    .sort({ [sortField]: -1 })
    .limit(Math.min(Number(limit) || 50, 200));

  res.json(meals);
});

router.post("/", async (req, res) => {
  const { foodId, foodQuery, quantity, unit, mealType, loggedAt, rawTranscript } = req.body;

  if (!quantity || quantity <= 0 || !unit || (!foodId && !foodQuery)) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  const resolved = resolveMealItem({ foodId, foodQuery, quantity, unit });
  if (resolved.error) {
    return res.status(400).json({ error: resolved.error });
  }

  const { food, unit: resolvedUnit, grams, macros } = resolved;

  const meal = await MealLog.create({
    foodId: food.id,
    foodName: food.name,
    quantity,
    unit: resolvedUnit.name,
    grams,
    ...macros,
    mealType,
    loggedAt: loggedAt ? new Date(loggedAt) : undefined,
    rawTranscript,
  });

  broadcastMealsChanged();
  res.status(201).json(meal);
});

router.patch("/:id", async (req, res) => {
  const existing = await MealLog.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const { foodId, foodQuery, quantity, unit, mealType, loggedAt } = req.body;

  const resolved = resolveMealItem({
    foodId: foodId ?? existing.foodId,
    foodQuery,
    quantity: quantity ?? existing.quantity,
    unit: unit ?? existing.unit,
  });
  if (resolved.error) {
    return res.status(400).json({ error: resolved.error });
  }

  const { food, unit: resolvedUnit, grams, macros } = resolved;

  existing.foodId = food.id;
  existing.foodName = food.name;
  existing.quantity = quantity ?? existing.quantity;
  existing.unit = resolvedUnit.name;
  existing.grams = grams;
  Object.assign(existing, macros);
  if (mealType) existing.mealType = mealType;
  if (loggedAt) existing.loggedAt = new Date(loggedAt);

  await existing.save();
  broadcastMealsChanged();
  res.json(existing);
});

router.delete("/:id", async (req, res) => {
  const deleted = await MealLog.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }
  broadcastMealsChanged();
  res.status(204).send();
});

export default router;
