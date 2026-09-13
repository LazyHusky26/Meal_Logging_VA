import { useState } from "react";
import MealCard from "./MealCard.jsx";

function dayLabel(dateKey) {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DayGroup({ dateKey, meals, defaultOpen, onUpdate, onDelete }) {
  const [open, setOpen] = useState(defaultOpen);
  const calorieTotal = Math.round(meals.reduce((sum, m) => sum + m.calories, 0));

  return (
    <div className="day-group">
      <button className="day-header" onClick={() => setOpen((o) => !o)}>
        <span className={`chevron${open ? " open" : ""}`}>▸</span>
        <span className="day-label">{dayLabel(dateKey)}</span>
        <span className="day-sub">
          {meals.length} {meals.length === 1 ? "entry" : "entries"} · {calorieTotal} kcal
        </span>
      </button>

      {open && (
        <div className="meal-list">
          {meals.map((meal) => (
            <MealCard key={meal._id} meal={meal} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
