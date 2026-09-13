import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL, fetchMeals, updateMeal, deleteMeal } from "./api.js";
import { getRangeBounds, RANGE_LABELS } from "./dateRanges.js";
import DayGroup from "./components/DayGroup.jsx";
import FilterBar from "./components/FilterBar.jsx";
import VoiceButton from "./components/VoiceButton.jsx";
import { BowlIcon, RefreshIcon } from "./icons.jsx";

export default function App() {
  const [range, setRange] = useState("today");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { from, to } = getRangeBounds(range);
      setMeals(
        await fetchMeals({ from: from.toISOString(), to: to.toISOString(), limit: 200 })
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const source = new EventSource(`${BACKEND_URL}/api/events`);
    source.onmessage = () => load();
    return () => source.close();
  }, [load]);

  async function handleUpdate(id, changes) {
    const updated = await updateMeal(id, changes);
    setMeals((prev) => prev.map((m) => (m._id === id ? updated : m)));
  }

  async function handleDelete(id) {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m._id !== id));
  }

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const todayKey = new Date().toDateString();
  const groups = {};
  for (const meal of meals) {
    const key = new Date(meal.loggedAt).toDateString();
    (groups[key] ??= []).push(meal);
  }
  const orderedDayKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">
            <BowlIcon size={20} />
          </span>
          <div>
            <h1>Meal Log</h1>
            <p>Logged by voice</p>
          </div>
        </div>
        <button className="icon-btn" onClick={load} title="Refresh">
          <RefreshIcon size={16} />
        </button>
      </header>

      <VoiceButton onMealsChanged={load} />

      <FilterBar range={range} onChange={setRange} />

      {!loading && !error && meals.length > 0 && (
        <>
          <p className="section-label">Totals — {RANGE_LABELS[range]}</p>
          <div className="stats">
            <StatTile label="Calories" value={Math.round(totals.calories)} />
            <StatTile label="Protein" value={`${Math.round(totals.protein)}g`} />
            <StatTile label="Carbs" value={`${Math.round(totals.carbs)}g`} />
            <StatTile label="Fat" value={`${Math.round(totals.fat)}g`} />
          </div>
        </>
      )}

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && meals.length === 0 && (
        <div className="empty">No meals logged in this range — tap the mic and say what you ate.</div>
      )}

      {!loading && !error &&
        orderedDayKeys.map((key) => (
          <DayGroup
            key={key}
            dateKey={key}
            meals={groups[key]}
            defaultOpen={key === todayKey}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
