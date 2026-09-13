import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const foodsPath = path.join(__dirname, "../../data/foods.json");
const { foods } = JSON.parse(readFileSync(foodsPath, "utf-8"));

function normalize(str) {
  return String(str).trim().toLowerCase();
}

function round(n) {
  return Math.round(n * 10) / 10;
}

export function listAllFoods() {
  return foods;
}

export function findFoodById(id) {
  return foods.find((f) => f.id === id) || null;
}

export function searchFoods(query) {
  const q = normalize(query);
  if (!q) return [];
  return foods.filter((f) => {
    if (normalize(f.name).includes(q)) return true;
    if (normalize(f.id).includes(q)) return true;
    return f.aliases?.some((a) => normalize(a).includes(q));
  });
}

export function findBestFoodMatch(query) {
  const q = normalize(query);
  const exact = foods.find(
    (f) =>
      normalize(f.id) === q ||
      normalize(f.name) === q ||
      f.aliases?.some((a) => normalize(a) === q)
  );
  if (exact) return exact;
  return searchFoods(query)[0] || null;
}

export function resolveUnit(food, unitName) {
  const u = normalize(unitName);
  return food.units.find((unit) => normalize(unit.name) === u) || null;
}

export function computeMacros(food, grams) {
  const factor = grams / 100;
  const m = food.macrosPer100g;
  return {
    calories: round(m.calories * factor),
    protein: round(m.protein * factor),
    carbs: round(m.carbs * factor),
    fat: round(m.fat * factor),
  };
}

export function resolveMealItem({ foodId, foodQuery, quantity, unit }) {
  const food = foodId ? findFoodById(foodId) : findBestFoodMatch(foodQuery);
  if (!food) {
    return { error: "FOOD_NOT_FOUND" };
  }

  const resolvedUnit = resolveUnit(food, unit);
  if (!resolvedUnit) {
    return { error: "INVALID_UNIT", food };
  }

  const grams = round(quantity * resolvedUnit.grams);
  const macros = computeMacros(food, grams);

  return { food, unit: resolvedUnit, grams, macros };
}
