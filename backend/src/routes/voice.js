import { Router } from "express";
import { randomUUID } from "crypto";
import { AccessToken } from "livekit-server-sdk";
import { RoomConfiguration, RoomAgentDispatch } from "@livekit/protocol";

const router = Router();

const ROOM_NAME = "meal-logging-room";
const AGENT_NAME = "meal-logging-agent";

// POST /api/voice/token
// Mints a short-lived LiveKit token for the browser to join the voice room.
// The agent has agentName set (explicit dispatch mode - see agent/src/main.js),
// so it only joins rooms that ask for it by name; that's done here via roomConfig
// rather than requiring a separate dispatch API call.
router.post("/token", async (req, res) => {
  const identity = `web-${randomUUID()}`;

  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity,
    ttl: "10m",
  });

  token.addGrant({
    roomJoin: true,
    room: ROOM_NAME,
    canPublish: true,
    canSubscribe: true,
  });

  token.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: AGENT_NAME })],
  });

  res.json({
    token: await token.toJwt(),
    url: process.env.LIVEKIT_URL,
    roomName: ROOM_NAME,
  });
});

export default router;
