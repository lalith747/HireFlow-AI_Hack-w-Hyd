# HireFlow AI Final Integrated Handoff

## What This Contains

This folder is the final integrated full-stack demo:

- Polished React/Vite frontend.
- FastAPI backend runtime.
- Hindsight memory setup and recall layer.
- CascadeFlow governance/decision engine.
- Visible frontend proof of backend execution.
- Realistic analytics charts and platform performance views.
- Audit trail, memory citations, runtime path, and override UI.

## Final Demo Flow

1. The user opens the frontend and creates or launches a hiring campaign.
2. The UI sends the campaign payload to `POST /api/launch`.
3. The backend logs the CascadeFlow runtime intercept.
4. The backend recalls campaign memory from Hindsight, or from the local retained-memory fallback.
5. CascadeFlow evaluates historical platform performance.
6. If a platform has spend and zero hires, CascadeFlow overrides the user action.
7. The UI renders the override, removed platform, budget reallocation, Hindsight citation, and audit trail.

## Main Integration Points

### Frontend

- `src/main.jsx`
  - Added `API_BASE_URL`.
  - Added runtime state for backend decisions.
  - Added memory state for Hindsight memory profile/setup.
  - Wired landing CTA and campaign launch button to the backend.
  - Added memory setup panel.
  - Added backend request preview.
  - Added runtime decision panel.
  - Added Hindsight citation display.
  - Added audit trail display.
  - Added backend-driven history/memory views.
  - Replaced artificial charts with meaningful analytics.

- `src/styles.css`
  - Added runtime panel styling.
  - Added memory setup/history styling.
  - Added realistic chart styles.
  - Added platform performance bars.
  - Added budget allocation chart styling.

### Backend

- `backend/main.py`
  - FastAPI app.
  - `/api/health` health check.
  - `/api/memory` exposes retained campaign history/profile.
  - `/api/setup-memory` runs Hindsight `retain()`.
  - `/api/launch` runs the complete integrated flow:
    UI payload -> CascadeFlow intercept -> Hindsight recall -> CascadeFlow decision -> response to UI.

- `backend/hindsight_service.py`
  - Loads historical campaigns.
  - Builds memory strings.
  - Uses Hindsight `retain()` when `HINDSIGHT_API_KEY` is configured.
  - Uses Hindsight `recall()` when credentials are available.
  - Falls back to local retained memory for demo reliability and low latency.
  - Returns citations, source, latency, and normalized history for CascadeFlow.

- `backend/decision_engine.py`
  - Preserved the existing CascadeFlow decision logic.
  - Added memory citation awareness.
  - Added Hindsight source and latency in audit logs.
  - Returns override metadata for the UI.

- `backend/data/campaigns.json`
  - Historical campaign memory data used for Hindsight retain/recall and local fallback.

## How To Run

Backend:

```bash
cd /Users/tlalithkrishna/Documents/Codex/2026-06-28/you-are-a-senior-full-stack/outputs/hireflow-integrated
npm run dev:backend
```

Frontend:

```bash
cd /Users/tlalithkrishna/Documents/Codex/2026-06-28/you-are-a-senior-full-stack/outputs/hireflow-integrated
npm run dev
```

Open the frontend URL printed by Vite, usually:

```text
http://127.0.0.1:5174/
```

## Optional Hindsight Cloud Mode

```bash
export HINDSIGHT_API_KEY="your_key"
export HINDSIGHT_BASE_URL="https://api.hindsight.vectorize.io"
npm run dev:backend
```

Then use the UI's **Retain History** button or call:

```bash
curl -X POST http://127.0.0.1:8000/api/setup-memory
```

Without a key, the app still works using local retained memory from `backend/data/campaigns.json`.

## Verification Completed

- React production build passes with `npm run build`.
- Backend Python compile passes.
- `/api/health` returns operational status.
- `/api/launch` returns a CascadeFlow override.
- Hindsight/local recall returns historical citations.
- UI displays backend runtime path, audit trail, memory citation, and changed platform allocation.

## Demo Script In 5 Lines

1. Click **Launch Your First Campaign** or launch from **Create Campaign**.
2. The UI sends the campaign to the backend through `/api/launch`.
3. CascadeFlow intercepts the launch and asks Hindsight for similar campaign history.
4. Hindsight returns an Indeed zero-hire citation, so CascadeFlow removes Indeed and reallocates budget.
5. The UI shows the override, Hindsight evidence, budget allocation, and complete audit trail.
