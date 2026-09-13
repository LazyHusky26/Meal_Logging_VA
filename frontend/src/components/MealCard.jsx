import { useEffect, useState } from "react";
import { fetchFood } from "../api.js";
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from "../icons.jsx";

function formatTime(iso) {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  return date.toLocaleString(undefined, {
    month: isToday ? undefined : "short",
    day: isToday ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MealCard({ meal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [quantity, setQuantity] = useState(meal.quantity);
  const [unit, setUnit] = useState(meal.unit);
  const [unitOptions, setUnitOptions] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing || unitOptions) return;
    fetchFood(meal.foodId)
      .then((food) => setUnitOptions(food.units.map((u) => u.name)))
      .catch(() => setUnitOptions([meal.unit])); // fall back to the current unit only
  }, [editing, unitOptions, meal.foodId, meal.unit]);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await onUpdate(meal._id, { quantity: Number(quantity), unit });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await onDelete(meal._id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="meal-card">
      <div className="meal-main">
        <div className="meal-title-row">
          <span className="meal-name">{meal.foodName}</span>
          {meal.mealType !== "other" && <span className="pill">{meal.mealType}</span>}
        </div>

        {editing ? (
          <div className="edit-form" style={{ marginTop: "0.4rem" }}>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={!unitOptions}
            >
              {(unitOptions ?? [unit]).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button className="mini-btn confirm" onClick={handleSave} disabled={busy} title="Save">
              <CheckIcon size={15} />
            </button>
            <button className="mini-btn" onClick={() => setEditing(false)} disabled={busy} title="Cancel">
              <XIcon size={15} />
            </button>
          </div>
        ) : (
          <div className="meal-sub">
            {meal.quantity} {meal.unit}
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </div>

      <div className="meal-side">
        <div>
          <div className="meal-macros">
            {meal.calories} kcal · {meal.protein}g P · {meal.carbs}g C · {meal.fat}g F
          </div>
          <div className="meal-time" style={{ textAlign: "right", marginTop: "0.2rem" }}>
            {formatTime(meal.loggedAt)}
          </div>
        </div>

        {!editing && (
          <div className="meal-actions">
            {confirmingDelete ? (
              <>
                <button
                  className="mini-btn danger"
                  onClick={handleDelete}
                  disabled={busy}
                  title="Confirm delete"
                >
                  <CheckIcon size={15} />
                </button>
                <button
                  className="mini-btn"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={busy}
                  title="Cancel"
                >
                  <XIcon size={15} />
                </button>
              </>
            ) : (
              <>
                <button className="mini-btn" onClick={() => setEditing(true)} title="Edit">
                  <PencilIcon size={15} />
                </button>
                <button
                  className="mini-btn danger"
                  onClick={() => setConfirmingDelete(true)}
                  title="Delete"
                >
                  <TrashIcon size={15} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
