function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Calendar-aligned ranges: week is Monday-Sunday of the current week, month is
// the 1st of the current month through today.
export function getRangeBounds(range) {
  const now = new Date();

  if (range === "week") {
    const day = now.getDay(); // 0 = Sun ... 6 = Sat
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = startOfDay(now);
    monday.setDate(monday.getDate() - diffToMonday);
    return { from: monday, to: endOfDay(now) };
  }

  if (range === "month") {
    const first = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    return { from: first, to: endOfDay(now) };
  }

  // "today"
  return { from: startOfDay(now), to: endOfDay(now) };
}

export const RANGE_LABELS = {
  today: "Today",
  week: "This week",
  month: "This month",
};
