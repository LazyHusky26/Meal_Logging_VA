# Meal Logging Voice Assistant

Log meals by talking. Say "I had two rotis and a katori of dal for lunch" and it shows up in
your meal log with calories/protein/carbs/fat already computed. You can also fix or remove
entries by voice — "actually make that three rotis," "remove the chai I logged this morning."

Three folders, three services:

| Folder | Stack | What it does |
|---|---|---|
| `backend/` | Express + MongoDB | Owns the meal data and the food/macro reference data. Everything else talks to it over HTTP. |
| `agent/` | LiveKit Agents (Node) | Listens, figures out what you meant, calls the backend. Doesn't talk back. |
| `frontend/` | React + Vite | The page you actually look at — meal list, mic button, manual edit/delete. |

---

## Setting it up from scratch

**You'll need:**
- Node 20+ (built on 22)
- MongoDB running somewhere — easiest is just installing it locally (on Windows it runs as a
  background service on `127.0.0.1:27017`), but a Docker container (`docker run -d --name mongo
  -p 27017:27017 mongo`) or a free Atlas cluster work too
- A free LiveKit Cloud account ([cloud.livekit.io](https://cloud.livekit.io)) — make a project,
  grab the URL/API key/API secret from Settings → Keys. LiveKit Inference (bundled free) covers
  both STT (Deepgram) and the LLM (OpenAI GPT-4.1 mini) — you don't need your own OpenAI or
  Deepgram account, just the one LiveKit key.

**Install:**
```
cd backend && npm install
cd ../agent && npm install
cd ../frontend && npm install
```

**Env files** — each folder has a `.env.example`, copy it to `.env` and fill it in:

```
# backend/.env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/meal_logging_va
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```
```
# agent/.env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
BACKEND_URL=http://localhost:4000
```
```
# frontend/.env
VITE_BACKEND_URL=http://localhost:4000
```

Same LiveKit project in both `backend` and `agent` — the backend needs it to mint tokens for
the browser, the agent needs it to actually connect. The secret never leaves the backend.

**Run it** (three terminals):
```
cd backend && npm run dev
cd agent && npm run dev
cd frontend && npm run dev
```

Open whatever URL the frontend prints (usually `localhost:5173`), tap the mic, wait a second
for it to say it's listening, say something like "I had two rotis for lunch," stop, and it
should show up in a couple seconds.

Want to test the agent without the browser at all? `npm run console` in `agent/` runs the
whole thing through your computer's own mic/speakers, no LiveKit room involved.

---

## How it fits together

```
browser mic <--WebRTC--> LiveKit room <--WebRTC--> agent
     |                                                |
     | (get a token)                                  | (log/edit/delete calls)
     v                                                v
              backend (Express) <-----------------> same API
                     |
                     v
                 MongoDB <---- also read by ---- frontend (polls + SSE)
```

**Backend** holds `data/foods.json` (30 dishes, macros per 100g, and which household units
each one can be logged in) and the actual meal log in MongoDB. Nothing else touches that JSON
file directly — the agent and frontend both go through the backend's API, so there's one place
that knows what a "katori" of dal weighs. Routes: `GET/POST /api/meals`, `PATCH/DELETE
/api/meals/:id` (filterable by date/from/to/food, which is how both the frontend's
Today/Week/Month view and the agent's "the chai I logged this morning" resolution work),
`GET /api/foods(/:id)` for lookups, `POST /api/voice/token` to mint a LiveKit token for the
browser, and `GET /api/events` — a Server-Sent Events stream so the frontend updates live
instead of needing a reload.

Two timestamps on each entry: `loggedAt` is when you actually ate it (can be backdated —
"a few hours ago"), `createdAt` is when the row was written, which is what "edit the last
thing I said" resolves against.

**Agent** is a LiveKit worker (`agent/src/main.js`): Deepgram for STT, GPT-4.1 mini for the
LLM, three tools (`log_meal`, `edit_last_meal`, `delete_meal`) that just call the backend. No
TTS — it never talks, it just acts. That's on purpose: since it can't ask "did you mean X?",
mistakes get fixed through the frontend instead of a back-and-forth conversation. It runs with
`agentName` set (explicit dispatch), so it only joins a room that specifically asks for it —
which is exactly what the token endpoint does. Each voice session gets its own fresh room
rather than reusing one, so starting a new session never has to worry about a previous one
still winding down in the background.

**Frontend** is one page: meals grouped by day (collapsible, today open by default), a
Today/Week/Month filter with matching nutrition totals, the mic button, and manual edit
(quantity + a unit dropdown scoped to whatever units that food actually supports) and delete
per entry.

### A few decisions worth knowing about

- **No login, one implicit user.** Built for one person.
- **No TTS, on purpose.** The frontend is the safety net for mistakes, not a conversation.
- **`closeOnDisconnect: false` on the agent session.** Without this, tapping "stop" right after
  finishing a sentence would kill the tool call before it reached the backend. Trade-off: a
  session hangs around a bit after you disconnect instead of closing instantly (it cleans
  itself up after an idle timeout).
- **A short delay after tapping the mic before it says "go ahead."** The WebRTC connection
  needs a beat to actually be ready; talking immediately can clip the first word or two.
- **Server-Sent Events instead of polling or a full WebSocket.** All we need is the backend
  telling the browser "something changed, go refetch" — one direction. SSE does that with zero
  extra dependencies (native browser API), and it already reconnects on its own.
- **GPT-4.1 mini instead of Gemma 4.** Gemma was the original choice, but it kept merging
  multi-food sentences ("two rotis and a glass of milk") into one garbled tool call instead of
  two separate ones, even with explicit examples in the prompt. Swapping the LLM fixed it.

---

## What I'd do with more time

Mainly two things: throw a lot more test phrases at the agent instead of the fairly narrow set i've tried, and
improve the UI.
