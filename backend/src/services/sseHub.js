const clients = new Set();

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

export function broadcastMealsChanged() {
  const payload = `data: ${JSON.stringify({ event: "meals-changed" })}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}
