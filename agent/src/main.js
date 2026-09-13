import "dotenv/config";
import { fileURLToPath } from "node:url";
import { cli, defineAgent, inference, voice, ServerOptions } from "@livekit/agents";
import { createAgent } from "./agent.js";

export default defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      stt: new inference.STT({ model: "deepgram/nova-3" }),
      llm: new inference.LLM({ model: "google/gemma-4-31b-it" }),
      tts: null, // explicitly disable speech output — omitting this isn't enough to silence it
      turnHandling: {
        turnDetection: new inference.TurnDetector(),
      },
    });

    await session.start({
      agent: createAgent(),
      room: ctx.room,
      // Don't hard-abort an in-flight turn (e.g. a tool call) just because the
      // browser disconnected right after the user finished speaking.
      inputOptions: { closeOnDisconnect: false },
    });

    await ctx.connect();
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: "meal-logging-agent" }));
