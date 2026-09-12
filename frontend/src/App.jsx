import { useEffect, useState } from "react";
import { fetchMeals, updateMeal, deleteMeal } from "./api.js";
import MealRow from "./components/MealRow.jsx";

export default function App() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setError(null);
      setMeals(await fetchMeals());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(id, changes) {
    const updated = await updateMeal(id, changes);
    setMeals((prev) => prev.map((m) => (m._id === id ? updated : m)));
  }

  async function handleDelete(id) {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m._id !== id));
  }

  return (
    <div>
      <h1>Meal Log</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && meals.length === 0 && (
        <p className="empty">No meals logged yet.</p>
      )}

      {!loading && !error && meals.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Food</th>
              <th>Quantity</th>
              <th>Macros</th>
              <th>Meal</th>
              <th>Logged</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {meals.map((meal) => (
              <MealRow
                key={meal._id}
                meal={meal}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
