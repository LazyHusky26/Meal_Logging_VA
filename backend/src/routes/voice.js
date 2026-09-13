import { Router } from "express";
import { randomUUID } from "crypto";
import { AccessToken } from "livekit-server-sdk";
import { RoomConfiguration, RoomAgentDispatch } from "@livekit/protocol";

const router = Router();

const AGENT_NAME = "meal-logging-agent";

// Mints a token for a fresh room each session, and embeds the agent dispatch
// request in roomConfig (the agent uses explicit dispatch - see agent/src/main.js).
router.post("/token", async (req, res) => {
  const identity = `web-${randomUUID()}`;
  const roomName = `meal-logging-${randomUUID()}`;

  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity,
    ttl: "10m",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  token.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: AGENT_NAME })],
  });

  res.json({
    token: await token.toJwt(),
    url: process.env.LIVEKIT_URL,
    roomName,
  });
});

export default router;
