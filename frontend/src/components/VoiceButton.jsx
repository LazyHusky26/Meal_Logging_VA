import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { MicIcon } from "../icons.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Brief pause between the mic actually going live and telling the user it's
// safe to talk — covers the WebRTC track-subscription warm-up on the agent
// side, so the first word or two doesn't get clipped.
const WARM_UP_MS = 1200;

const LABELS = {
  idle: "Tap to log a meal",
  connecting: "Connecting…",
  warming: "Get ready…",
  listening: "Listening — go ahead",
  error: "Something went wrong — tap to retry",
};

export default function VoiceButton({ onMealsChanged }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const roomRef = useRef(null);
  const warmUpTimer = useRef(null);

  useEffect(() => {
    if (status !== "listening") return;
    const interval = setInterval(() => onMealsChanged?.(), 3000);
    return () => clearInterval(interval);
  }, [status, onMealsChanged]);

  useEffect(() => () => clearTimeout(warmUpTimer.current), []);

  async function start() {
    setStatus("connecting");
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/voice/token`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start voice session");
      const { token, url } = await res.json();

      const room = new Room();
      roomRef.current = room;
      room.on(RoomEvent.Disconnected, () => {
        clearTimeout(warmUpTimer.current);
        setStatus("idle");
        roomRef.current = null;
      });

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      setStatus("warming");
      warmUpTimer.current = setTimeout(() => setStatus("listening"), WARM_UP_MS);
    } catch (err) {
      setError(err.message);
      setStatus("error");
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  }

  async function stop() {
    clearTimeout(warmUpTimer.current);
    await roomRef.current?.disconnect();
    roomRef.current = null;
    setStatus("idle");
    onMealsChanged?.();
  }

  const isConnecting = status === "connecting";
  const isWarming = status === "warming";
  const isListening = status === "listening";
  const isActive = isConnecting || isWarming || isListening;

  let stateClass = "";
  if (isWarming) stateClass = " is-warming";
  else if (isListening) stateClass = " is-active";

  return (
    <div className="voice-panel">
      <button
        className={`voice-btn${stateClass}`}
        onClick={isActive ? stop : start}
        disabled={isConnecting}
        aria-label={LABELS[status]}
      >
        <span className="ring" />
        <MicIcon size={24} />
      </button>
      <span className={`voice-label${stateClass}`}>{LABELS[status]}</span>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
