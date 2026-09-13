export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export async function fetchMeals({ from, to, limit } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", limit);
  const qs = params.toString();

  const res = await fetch(`${BACKEND_URL}/api/meals${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load meals");
  return res.json();
}

export async function fetchFood(foodId) {
  const res = await fetch(`${BACKEND_URL}/api/foods/${foodId}`);
  if (!res.ok) throw new Error("Failed to load food details");
  return res.json();
}

export async function updateMeal(id, changes) {
  const res = await fetch(`${BACKEND_URL}/api/meals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update meal");
  return data;
}

export async function deleteMeal(id) {
  const res = await fetch(`${BACKEND_URL}/api/meals/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete meal");
  }
}
