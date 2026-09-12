import { tool } from "@livekit/agents";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

async function findRecentMeal({ foodQuery, from, to }) {
  const params = new URLSearchParams({ limit: "1", sort: "createdAt" });
  if (foodQuery) params.set("food", foodQuery);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const res = await fetch(`${BACKEND_URL}/api/meals?${params}`);
  const matches = await res.json();
  return matches[0] || null;
}

export function createMealTools() {
  return {
    log_meal: tool({
      description:
        "Log a single food item the user says they ate. Call this once per distinct food " +
        "item mentioned — if the user names multiple foods in one sentence, call this " +
        "tool separately for each one.",
      parameters: {
        type: "object",
        properties: {
          foodQuery: {
            type: "string",
            description: "The food name as the user said it, e.g. 'roti', 'dal', 'chai'.",
          },
          quantity: {
            type: "number",
            description: "How many units of the food, e.g. 2.",
          },
          unit: {
            type: "string",
            description: "The household unit as said, e.g. 'piece', 'katori', 'glass'.",
          },
          mealType: {
            type: "string",
            enum: ["breakfast", "lunch", "dinner", "snack", "other"],
            description: "Which meal this was for, if the user said so (e.g. 'for lunch').",
          },
          loggedAt: {
            type: "string",
            description:
              "ISO 8601 datetime, only if the user implies a time other than right now " +
              "(e.g. backdating to earlier today). Omit to use the current time.",
          },
        },
        required: ["foodQuery", "quantity", "unit"],
      },
      execute: async (args) => {
        const res = await fetch(`${BACKEND_URL}/api/meals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args),
        });
        const data = await res.json();

        if (!res.ok) {
          return { ok: false, error: data.error };
        }

        return {
          ok: true,
          mealId: data._id,
          foodName: data.foodName,
          grams: data.grams,
          macros: {
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
          },
        };
      },
    }),

    edit_last_meal: tool({
      description:
        "Change something about a meal entry the user already logged, e.g. 'actually make " +
        "that three rotis'. Omit foodQuery/from/to to target the single most recently " +
        "logged entry; provide them only to disambiguate which entry the user means.",
      parameters: {
        type: "object",
        properties: {
          foodQuery: {
            type: "string",
            description: "Narrows the search to the most recent entry matching this food.",
          },
          from: { type: "string", description: "ISO 8601 datetime lower bound to narrow the search." },
          to: { type: "string", description: "ISO 8601 datetime upper bound to narrow the search." },
          quantity: { type: "number", description: "New quantity, if changed." },
          unit: { type: "string", description: "New unit, if changed." },
          mealType: {
            type: "string",
            enum: ["breakfast", "lunch", "dinner", "snack", "other"],
            description: "New meal type, if changed.",
          },
          loggedAt: { type: "string", description: "New ISO 8601 logged time, if changed." },
        },
      },
      execute: async ({ foodQuery, from, to, quantity, unit, mealType, loggedAt }) => {
        if (quantity == null && unit == null && mealType == null && loggedAt == null) {
          return { ok: false, error: "NO_CHANGES_PROVIDED" };
        }

        const target = await findRecentMeal({ foodQuery, from, to });
        if (!target) {
          return { ok: false, error: "NOT_FOUND" };
        }

        const res = await fetch(`${BACKEND_URL}/api/meals/${target._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodQuery, quantity, unit, mealType, loggedAt }),
        });
        const data = await res.json();

        if (!res.ok) {
          return { ok: false, error: data.error };
        }

        return {
          ok: true,
          mealId: data._id,
          foodName: data.foodName,
          quantity: data.quantity,
          unit: data.unit,
          macros: {
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
          },
        };
      },
    }),

    delete_meal: tool({
      description:
        "Delete a meal entry the user asks to remove, e.g. 'remove the chai I logged this " +
        "morning'. Use foodQuery to identify the food and from/to to narrow by when it was " +
        "logged.",
      parameters: {
        type: "object",
        properties: {
          foodQuery: { type: "string", description: "The food name to match, e.g. 'chai'." },
          from: { type: "string", description: "ISO 8601 datetime lower bound to narrow the search." },
          to: { type: "string", description: "ISO 8601 datetime upper bound to narrow the search." },
        },
      },
      execute: async ({ foodQuery, from, to }) => {
        const target = await findRecentMeal({ foodQuery, from, to });
        if (!target) {
          return { ok: false, error: "NOT_FOUND" };
        }

        const res = await fetch(`${BACKEND_URL}/api/meals/${target._id}`, { method: "DELETE" });
        if (!res.ok) {
          return { ok: false, error: "DELETE_FAILED" };
        }

        return { ok: true, deletedMealId: target._id, foodName: target.foodName };
      },
    }),
  };
}
