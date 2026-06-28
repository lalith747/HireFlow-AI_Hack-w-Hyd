# HireFlow AI

Autonomous recruitment intelligence for launching smarter hiring campaigns with memory-backed platform governance.

HireFlow AI helps recruiting teams stop guessing where to spend hiring budget. It remembers historical campaign outcomes, recalls similar past campaigns at runtime, blocks poor platform choices, reallocates spend, and explains every decision with an audit trail.

## Live Local Links

When both dev servers are running:

- Frontend: `http://127.0.0.1:5174/` or the URL printed by Vite
- Backend API: `http://127.0.0.1:8000`
- Backend health: `http://127.0.0.1:8000/api/health`
- Backend memory profile: `http://127.0.0.1:8000/api/memory`
- Optional Hindsight API: `http://localhost:8888`
- Optional Hindsight UI: `http://localhost:9999`

## What The App Does

HireFlow AI is a full-stack recruitment campaign demo with four connected layers:

1. **Frontend campaign workspace**
   - A polished React interface for dashboards, campaign creation, memory setup, platform optimization, budget governance, generated posts, monitoring, and reports.

2. **CascadeFlow runtime governance**
   - A FastAPI backend intercepts campaign launches, evaluates platform performance, removes historically poor channels, reallocates budget, and returns a structured audit trail.

3. **Hindsight memory layer**
   - Historical campaign outcomes are retained into a memory bank.
   - At launch time, similar campaign memories are recalled and attached as citations.
   - If live Hindsight is unavailable, the app uses a local retained-memory fallback from `backend/data/campaigns.json` so the demo still works reliably.

4. **Visible audit and explainability**
   - The UI shows the exact backend request path, Hindsight citation, recall source, latency, removed platform, final platform list, budget allocation, and decision audit trail.

## Core Demo Story

A recruiter tries to launch a Senior Backend Engineer campaign on:

```text
LinkedIn, Indeed, Naukri, Wellfound
```

HireFlow AI recalls historical campaign memory and finds that Indeed produced applications but zero hires for similar backend roles. CascadeFlow intercepts the launch, removes Indeed, reallocates the budget across stronger platforms, and shows the exact memory citation that caused the override.

## End-To-End Runtime Flow

```text
User clicks Launch
  -> React sends POST /api/launch
  -> FastAPI receives campaign payload
  -> CascadeFlow runtime intercept logs the request
  -> Hindsight recall searches campaign memory
  -> Historical memories become structured platform evidence
  -> CascadeFlow removes platforms with spend and zero hires
  -> Budget is reallocated across retained platforms
  -> Backend returns result, citation, audit log, and allocation
  -> UI renders override, memory snippet, latency, and audit trail
```

## Why Hindsight Matters Here

Hindsight is used as the persistent memory system. The app stores campaign outcomes such as:

- role
- platform
- budget
- applications
- interviews
- hires
- campaign id

At runtime, the backend asks memory questions like:

```text
Senior Backend Engineer hiring campaign on Indeed
```

The returned memory decides whether CascadeFlow should allow or override the user action.

## Why CascadeFlow Matters Here

CascadeFlow is the runtime governance layer. It is responsible for:

- intercepting the launch request
- routing the campaign through decision phases
- evaluating historical evidence
- blocking weak platforms
- reallocating budget
- producing audit logs
- returning a deterministic decision to the UI

The app treats CascadeFlow as the decision gate, while Hindsight provides the memory evidence.

## Project Structure

```text
hireflow-integrated/
  README.md
  FINAL_HANDOFF.md
  HINDSIGHT_AUDIT_REPORT.md
  package.json
  package-lock.json
  index.html

  src/
    main.jsx
    styles.css
    assets/
      hireflow-dashboard.png

  backend/
    __init__.py
    main.py
    decision_engine.py
    hindsight_service.py
    hindsight_probe.py
    setup_hindsight.py
    requirements.txt
    data/
      campaigns.json
```

## Important Files

### `src/main.jsx`

The main React application.

Includes:

- landing page
- login/workspace shell
- dashboard
- campaign creation flow
- memory setup panel
- backend request preview
- runtime decision panel
- Hindsight citation display
- audit trail rendering
- realistic hiring analytics charts
- platform performance comparisons
- budget allocation visualization

Key frontend API calls:

```js
fetch(`${API_BASE_URL}/api/memory`)
fetch(`${API_BASE_URL}/api/setup-memory`, { method: "POST" })
fetch(`${API_BASE_URL}/api/launch`, ...)
```

### `src/styles.css`

All visual styling for the frontend.

Includes:

- app shell
- dashboard panels
- responsive layouts
- runtime overlay
- memory setup UI
- audit trail UI
- realistic charts
- platform performance bars
- budget allocation stack

### `backend/main.py`

FastAPI application entrypoint.

Endpoints:

```text
GET  /
GET  /api/health
GET  /api/memory
POST /api/setup-memory
POST /api/launch
```

Most important endpoint:

```text
POST /api/launch
```

This endpoint performs the full integrated flow:

```text
request -> Hindsight recall -> CascadeFlow decision -> UI response
```

### `backend/hindsight_service.py`

Hindsight memory integration layer.

Responsibilities:

- load campaign history
- build memory content
- initialize Hindsight client
- create memory bank
- retain campaign history
- recall relevant memories at runtime
- normalize memory into CascadeFlow-readable platform stats
- provide local fallback if live Hindsight is unavailable

Important env vars:

```bash
HINDSIGHT_BASE_URL
HINDSIGHT_API_KEY
HINDSIGHT_BANK_ID
```

### `backend/decision_engine.py`

CascadeFlow-style governance engine.

Responsibilities:

- log runtime intercept
- read Hindsight-backed platform history
- calculate conversion rates
- calculate hire efficiency
- remove platforms with spend and zero hires
- reallocate budget across retained platforms
- return audit logs and decision summary

### `backend/hindsight_probe.py`

Standalone proof script for Hindsight.

It tests:

- `create_bank()`
- `retain()`
- `recall()`
- `reflect()`
- latency
- score threshold
- exact recalled test fact

Use this when you want to prove live Hindsight is actually storing and recalling memory.

### `backend/data/campaigns.json`

Historical campaign dataset.

Used for:

- Hindsight memory seeding
- local fallback recall
- platform performance evidence
- demo determinism

## Setup

### 1. Install Frontend Dependencies

From the project folder:

```bash
cd /Users/tlalithkrishna/Documents/Codex/2026-06-28/you-are-a-senior-full-stack/outputs/hireflow-integrated
npm install
```

### 2. Backend Python Environment

The project uses a Python 3.12 virtualenv:

```text
.venv312/
```

If it already exists, use it. If you need to recreate it:

```bash
python3.12 -m venv .venv312
.venv312/bin/python -m pip install -r backend/requirements.txt
```

Backend requirements:

```text
fastapi
uvicorn
pydantic
python-dotenv
hindsight-client
```

## Run The App

You need two terminals.

### Terminal 1: Start Backend

```bash
cd /Users/tlalithkrishna/Documents/Codex/2026-06-28/you-are-a-senior-full-stack/outputs/hireflow-integrated
npm run dev:backend
```

Expected backend:

```text
http://127.0.0.1:8000
```

Check it:

```bash
curl http://127.0.0.1:8000/api/health
```

Expected:

```json
{
  "status": "operational",
  "engine": "CascadeFlow",
  "memory_bank": "hireflow-campaigns"
}
```

### Terminal 2: Start Frontend

```bash
cd /Users/tlalithkrishna/Documents/Codex/2026-06-28/you-are-a-senior-full-stack/outputs/hireflow-integrated
npm run dev
```

Open the Vite URL, usually:

```text
http://127.0.0.1:5174/
```

## Demo Walkthrough

### Fastest Demo Path

1. Open the frontend.
2. Click **Launch Your First Campaign**.
3. Watch the CascadeFlow Runtime panel open.
4. Confirm that Indeed is removed.
5. Show the Hindsight citation.
6. Show the audit trail.
7. Open the optimization screen to show before/after platforms.

### More Complete Demo Path

1. Open the frontend.
2. Enter the workspace.
3. Go to **Create Campaign**.
4. Review **Step 1: Hindsight Memory Setup**.
5. Click **Retain History**.
6. Review **Step 2: Backend Request Preview**.
7. Click **Launch Through CascadeFlow**.
8. Show the runtime panel.
9. Go to **Historical Intelligence**.
10. Show recalled Hindsight evidence.
11. Go to **Recruitment Memory**.
12. Show memory lifecycle and latest evidence.
13. Go to **Budget Governance**.
14. Show final allocation after override.

## Expected Demo Result

Input campaign:

```json
{
  "job_title": "Senior Backend Engineer",
  "budget": 800000,
  "platforms": ["LinkedIn", "Indeed", "Naukri", "Wellfound"]
}
```

Expected decision:

```text
CascadeFlow removes Indeed.
```

Reason:

```text
Hindsight/local memory shows Indeed spent budget on similar backend campaigns but produced zero hires.
```

Expected UI:

```text
CascadeFlow overrode the launch
Original Platforms: LinkedIn, Indeed, Naukri, Wellfound
Final Platforms: LinkedIn, Naukri, Wellfound
Removed: Indeed
Hindsight Citation: Campaign ID 2...
Audit Trail: CASCADEFLOW RUNTIME: DISTRIBUTION INTERCEPTED...
```

## API Reference

### `GET /api/health`

Checks backend health.

```bash
curl http://127.0.0.1:8000/api/health
```

### `GET /api/memory`

Returns memory profile from campaign history.

```bash
curl http://127.0.0.1:8000/api/memory
```

Returns:

```json
{
  "bank_id": "hireflow-campaigns",
  "campaign_count": 50,
  "platforms": ["Indeed", "LinkedIn", "Naukri", "Wellfound"],
  "zero_hire_count": 10
}
```

### `POST /api/setup-memory`

Retains campaign history into Hindsight if Hindsight credentials are configured.

```bash
curl -X POST http://127.0.0.1:8000/api/setup-memory
```

If no Hindsight key is configured, returns local-only mode.

### `POST /api/launch`

Runs the full runtime decision flow.

```bash
curl -X POST http://127.0.0.1:8000/api/launch \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Backend Engineer",
    "budget": 800000,
    "platforms": ["LinkedIn", "Indeed", "Naukri", "Wellfound"]
  }'
```

Response includes:

- selected platforms
- removed platforms
- budget allocation
- model routing
- audit log
- Hindsight citation
- recall latency
- runtime path
- request payload

## Hindsight Modes

### Mode 1: Local Fallback Memory

This is the default reliable demo mode.

If no Hindsight API key/service is configured, the app uses:

```text
backend/data/campaigns.json
```

This keeps the demo fast and stable.

Expected source:

```text
local-json
```

### Mode 2: Hindsight Cloud

Set:

```bash
export HINDSIGHT_BASE_URL="https://api.hindsight.vectorize.io"
export HINDSIGHT_API_KEY="your_hindsight_api_key"
export HINDSIGHT_BANK_ID="hireflow-campaigns"
```

Then start backend:

```bash
npm run dev:backend
```

### Mode 3: Local Hindsight API

Start Hindsight API/UI separately, then set:

```bash
export HINDSIGHT_BASE_URL="http://localhost:8888"
export HINDSIGHT_BANK_ID="hireflow-campaigns"
```

If the local Hindsight API needs an LLM provider, set these in the terminal that starts Hindsight:

```bash
export HINDSIGHT_API_LLM_PROVIDER="grok"
export HINDSIGHT_API_LLM_API_KEY="your_grok_api_key"
```

Check service:

```bash
curl http://localhost:8888/health
```

Check UI:

```bash
open http://localhost:9999
```

## Hindsight Proof Script

Run:

```bash
cd /Users/tlalithkrishna/Documents/Codex/2026-06-28/you-are-a-senior-full-stack/outputs/hireflow-integrated
.venv312/bin/python backend/hindsight_probe.py
```

The probe stores this exact fact:

```text
Test fact: Grok API verified on 2026-06-28
```

Then recalls:

```text
Grok API verified
```

Expected success output:

```text
[HINDSIGHT MEMORY] retain=ok
[HINDSIGHT MEMORY] recall=ok
[HINDSIGHT MEMORY] reflect=ok
```

If Hindsight is not running, the probe will fail with connection refused.

## Console Logs To Show During Judging

Browser console:

```text
[HINDSIGHT MEMORY] HINDSIGHT RECALL ACTIVE via POST /api/launch
```

Backend terminal:

```text
[CascadeFlow] Runtime intercept received {...}
[HINDSIGHT MEMORY] HINDSIGHT RECALL ACTIVE query='Senior Backend Engineer hiring campaign on Indeed' bank_id='hireflow-campaigns'
[Hindsight] recall source=... history=... latency=...ms
```

These logs prove the app is not only rendering static UI. The frontend is calling the backend, and the backend is calling memory before governance.

## Analytics And Charts

The dashboard charts are not decorative placeholders. They now represent the hiring story:

- monthly applications
- interviews
- hires
- hire rate
- platform budget share
- qualified hire share
- cost per hire
- budget allocation after CascadeFlow override

The charts support the same conclusion as the runtime decision: some platforms create activity, but not all create hires.

## Security Notes

Do not hardcode API keys in source code.

Use env vars:

```bash
export HINDSIGHT_API_KEY="..."
export HINDSIGHT_API_LLM_API_KEY="..."
```

The original supplied folders had a hardcoded Hindsight key. The integrated version avoids putting credentials in source. This is intentional and safer for GitHub submission.

## Current Known Truth

The app has two levels of memory behavior:

1. **Guaranteed demo behavior**
   - Works with local `campaigns.json`.
   - Recalls historical campaign evidence.
   - Removes Indeed.
   - Shows citation and audit trail.

2. **Live Hindsight behavior**
   - Works only after Hindsight API is running and configured.
   - Use `backend/hindsight_probe.py` to prove retain/recall/reflect.

If `curl http://localhost:8888/health` fails, live Hindsight is not running yet.

## Troubleshooting

### Frontend says `Failed to fetch`

Backend is not running.

Fix:

```bash
cd /Users/tlalithkrishna/Documents/Codex/2026-06-28/you-are-a-senior-full-stack/outputs/hireflow-integrated
npm run dev:backend
```

### Port 5173 is in use

Vite will automatically choose another port, such as:

```text
http://127.0.0.1:5174/
```

Use whatever URL Vite prints.

### Hindsight probe cannot connect

Check:

```bash
curl http://localhost:8888/health
```

If it fails, Hindsight API is not running.

### Backend starts but Hindsight source says `local-json`

That means live Hindsight is not configured, so the app is using local fallback memory.

Set:

```bash
export HINDSIGHT_BASE_URL="http://localhost:8888"
export HINDSIGHT_API_KEY="your_hindsight_key_if_required"
```

Then restart backend.

### Python dependency error

Use the project virtualenv:

```bash
.venv312/bin/python -m pip install -r backend/requirements.txt
```

## Build Check

Run:

```bash
npm run build
```

Expected:

```text
✓ built
```

## Final Submission Notes

Recommended files to highlight:

```text
README.md
FINAL_HANDOFF.md
HINDSIGHT_AUDIT_REPORT.md
backend/main.py
backend/hindsight_service.py
backend/decision_engine.py
backend/hindsight_probe.py
src/main.jsx
src/styles.css
backend/data/campaigns.json
```

Do not submit:

```text
node_modules/
.venv/
.venv312/
dist/
__pycache__/
```

## Five-Line Pitch

HireFlow AI is a memory-backed recruitment governance system.  
Recruiters submit a campaign, but CascadeFlow intercepts the launch before spend is committed.  
Hindsight recalls similar historical campaigns and returns evidence with citations.  
CascadeFlow removes platforms with spend and zero hires, then reallocates budget.  
The UI shows the decision, memory snippet, audit trail, and final budget allocation.

