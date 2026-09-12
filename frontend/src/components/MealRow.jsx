import { useState } from "react";

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MealRow({ meal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(meal.quantity);
  const [unit, setUnit] = useState(meal.unit);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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
    if (!window.confirm(`Delete "${meal.foodName}"?`)) return;
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
    <tr>
      <td>{meal.foodName}</td>
      <td>
        {editing ? (
          <div className="edit-form">
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        ) : (
          `${meal.quantity} ${meal.unit}`
        )}
        {error && <div className="error">{error}</div>}
      </td>
      <td className="macro">
        {meal.calories} kcal · {meal.protein}g P · {meal.carbs}g C · {meal.fat}g F
      </td>
      <td>{meal.mealType !== "other" ? meal.mealType : ""}</td>
      <td>{formatTime(meal.loggedAt)}</td>
      <td className="actions">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={busy}>
              Save
            </button>
            <button onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} disabled={busy}>
              Edit
            </button>
            <button onClick={handleDelete} disabled={busy}>
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
