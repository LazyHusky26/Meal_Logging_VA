import "dotenv/config";
import { fileURLToPath } from "node:url";
import { cli, defineAgent, inference, voice, ServerOptions } from "@livekit/agents";
import { createAgent } from "./agent.js";

export default defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      stt: new inference.STT({ model: "deepgram/nova-3" }),
      llm: new inference.LLM({ model: "openai/gpt-4.1-mini" }),
      tts: null, // explicitly disable speech output — omitting this isn't enough to silence it
      turnHandling: {
        turnDetection: new inference.TurnDetector(),
        endpointing: { minDelay: 800 }, // default 300ms cuts off mid-thought pauses too eagerly
      },
    });

    await session.start({
      agent: createAgent(),
      room: ctx.room,
      inputOptions: { closeOnDisconnect: false }, // don't abort an in-flight tool call on disconnect
    });

    await ctx.connect();
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: "meal-logging-agent" }));
