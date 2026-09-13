# Meal Logging Voice Assistant

Log meals by talking. Say "I had two rotis and a katori of dal for lunch" and it shows up
in your meal log with computed calories/protein/carbs/fat — no typing required. You can also
edit ("actually make that three rotis") and delete ("remove the chai I logged this morning")
entries by voice.

Three services, each its own folder/package:

| Folder | Stack | Job |
|---|---|---|
| `backend/` | Express + MongoDB (Mongoose) | Owns meal data + the food/macro reference data. Exposes the REST API everything else talks to. |
| `agent/` | LiveKit Agents (Node) | A voice worker: transcribes speech, decides what you meant, calls the backend's API. Never speaks back. |
| `frontend/` | React + Vite | A single page showing your meal log, with manual edit/delete and a mic button to talk to the agent directly from the browser. |

---

## 1. Prerequisites (starting from a clean machine)

- **Node.js 20+** (this project was built on 22) and npm.
- **MongoDB** running somewhere reachable — pick one:
  - A local install (Windows: [MongoDB Community Server](https://www.mongodb.com/try/download/community), runs as a background service on `127.0.0.1:27017`).
  - A local Docker container: `docker run -d --name mongo -p 27017:27017 mongo`.
  - A free [MongoDB Atlas](https://mongodb.com/cloud/atlas) cluster (cloud-hosted, gives you a connection string instead of a local port).
- **A LiveKit Cloud account** (free tier) — sign up at [cloud.livekit.io](https://cloud.livekit.io) and create a project. From the project's **Settings → Keys** page you'll need three values later: the WebSocket **URL**, **API Key**, and **API Secret**. This app uses LiveKit Inference (bundled into every Cloud project, including free) for speech-to-text (Deepgram Nova-3) and the LLM (Google Gemma 4 31B) — no separate OpenAI/Deepgram/Google accounts needed.

## 2. Install dependencies

Each of the three folders is its own npm package:

```
cd backend && npm install
cd ../agent && npm install
cd ../frontend && npm install
```

## 3. Configure environment variables

Each service has a `.env.example` — copy it to `.env` in the same folder and fill in the blanks.

**`backend/.env`**
```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/meal_logging_va
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```
`MONGODB_URI` should match whichever MongoDB option you picked above. The `LIVEKIT_*` values are used to mint short-lived tokens for the browser's voice sessions (see [Architecture](#architecture) below) — same project as the agent, but note the backend only ever uses the secret server-side, it's never sent to the browser.

**`agent/.env`**
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
BACKEND_URL=http://localhost:4000
```
Same LiveKit project credentials as the backend.

**`frontend/.env`**
```
VITE_BACKEND_URL=http://localhost:4000
```

## 4. Run it

Three separate terminals:

```
cd backend && npm run dev     # Express API on http://localhost:4000
cd agent && npm run dev       # LiveKit worker — connects to your LiveKit Cloud project and waits
cd frontend && npm run dev    # Vite dev server, prints a URL (usually http://localhost:5173)
```

Open the frontend URL in a browser. Tap the mic button, wait a beat for it to say
"Listening," say something like *"I had two rotis for lunch"*, then stop — after a couple of
seconds the entry should appear in the list.

**Testing the agent without a browser:** `npm run console` in `agent/` runs the whole voice
pipeline through your machine's local mic/speakers directly in the terminal — no LiveKit room,
no frontend needed. Good for quickly checking the agent logic in isolation.

---

## Architecture

```
   [ Browser mic ] <---- WebRTC ---->  [ LiveKit Cloud room ]  <---- WebRTC ---->  [ agent/ worker ]
         |                                                                              |
         | HTTP (mint token)                                                           | HTTP (tool calls)
         v                                                                              v
   [ backend/ Express API ]  <-------------------------------------------------->  (same API)
         |
         v
   [ MongoDB ]  <---- also read by ---->  [ frontend/ React page ]  <---- HTTP (poll/refresh) ---- backend
```

**`backend/`** is the source of truth. It holds:
- `data/foods.json` — 30 dishes with macros-per-100g and their valid household units (e.g. roti: piece/gram; dal: katori/bowl/gram). Nothing else reads this file directly — the agent and frontend both go through the backend's API, so there's exactly one place that knows food macros/units.
- `MealLog` documents in MongoDB — one per logged item: food, quantity, unit, resolved grams, computed macros, `mealType`, `loggedAt` (when the meal was eaten — can be backdated) vs. `createdAt` (when the row was written — used to resolve "edit the last thing I said").
- The REST API: `GET/POST /api/meals`, `PATCH/DELETE /api/meals/:id` (with `date`/`from`/`to`/`food` filtering used both by the frontend's Today/Week/Month view and by the agent's "the chai I logged this morning" resolution), `GET /api/foods` + `GET /api/foods/:id` (food lookup/search, and the per-food unit list the frontend's edit dropdown uses), and `POST /api/voice/token` (mints a LiveKit access token for the browser — see below).

**`agent/`** is a LiveKit Agents worker (`src/main.js`). Pipeline: Deepgram STT → Gemma 4 LLM → three tools (`src/tools.js`) that call the backend's meal API — `log_meal`, `edit_last_meal`, `delete_meal`. Deliberately has **no TTS** — it never speaks, it just acts. That's a real design tradeoff, not an oversight: since there's no spoken confirmation, mis-heard entries are meant to be fixed via the frontend's manual edit/delete controls rather than a back-and-forth voice conversation. The agent registers with a specific `agentName`, which puts it in *explicit dispatch* mode — it only joins a room that specifically asks for it by name, which is exactly what `POST /api/voice/token` does when minting a token (embeds the dispatch request in the token's room config).

**`frontend/`** is a single-page React app: meals grouped by day (collapsible, Today expanded by default) with Today/This Week/This Month filters and matching nutrition totals; a mic button (`VoiceButton`) that connects straight to the LiveKit room via `livekit-client` using a token from the backend, so you can talk to the agent without LiveKit's own Playground or console; manual edit (quantity + a unit dropdown scoped to that food's valid units) and delete per entry.

### Why some things are the way they are
- **No auth, single implicit user** — this was built for one person's own use.
- **No TTS** — see above; the UI (not voice) is the correction mechanism.
- **`closeOnDisconnect: false`** on the agent session — without it, tapping "stop" right after finishing a sentence would abort the in-flight tool call before it reached the backend. The tradeoff: a session lingers briefly in the background after you disconnect rather than closing instantly (it cleans itself up on an idle timeout).
- **A short "Get ready…" delay after tapping the mic** — covers the WebRTC track-subscription warm-up between the browser and the agent, so the first word or two doesn't get clipped.
