import { Router } from "express";
import { addClient, removeClient } from "../services/sseHub.js";

const router = Router();

// Server-Sent Events stream - frontend refetches whenever it gets a "meals-changed" event.
router.get("/", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  addClient(res);

  req.on("close", () => {
    removeClient(res);
  });
});

export default router;
