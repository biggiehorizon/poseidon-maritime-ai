# Poseidon

Poseidon is a maritime AI forecasting agent built for the DigitalOcean Gradient AI Hackathon. It combines real-time marine and wind weather data from Open-Meteo with an LLM persona — an opinionated old-salt navigator — powered by DigitalOcean's Gradient inference platform. Give Poseidon your vessel profile, your origin, and your destination, and it will read the weather along your route and tell you exactly what conditions you're heading into, in the language of the sea.

---

## Architecture

```
Frontend (React + TypeScript + Leaflet)
  └── Vessel profile form, interactive route map (OpenSeaMap tiles), chat interface

Backend (FastAPI + Python)
  ├── /api/vessel    — register vessel profile (type, length, draft, propulsion)
  ├── /api/chat      — route query endpoint
  │     ├── Samples 5 waypoints along the great-circle route
  │     ├── Fetches marine weather (waves, swell) from Open-Meteo Marine API
  │     ├── Fetches wind data from Open-Meteo Forecast API
  │     └── Sends weather summary + vessel context to Gradient LLM
  └── /health        — liveness check

LLM: DigitalOcean Gradient (llama3-8b-instruct via OpenAI-compatible endpoint)
Weather: Open-Meteo (no API key required — free and open)
```

---

## Prerequisites

- Python 3.11+
- Node 18+
- DigitalOcean Gradient API key ([get one here](https://cloud.digitalocean.com/))

---

## Setup

### 1. Clone and navigate

```bash
git clone <repo-url>
cd hackathon/poseidon
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GRADIENT_API_KEY to your DigitalOcean API key
uvicorn main:app --port 8000
```

Backend will be available at `http://localhost:8000`.

### 3. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`.

---

## Running Tests

### Backend

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Expected: 20 passed.

### Frontend

```bash
cd frontend
npx vitest run
```

Expected: 12 passed (5 test files).

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GRADIENT_API_KEY` | Yes | — | DigitalOcean API key used to authenticate with the Gradient inference endpoint |
| `GRADIENT_ENDPOINT_URL` | No | `https://inference.do-ai.run/v1/chat/completions` | Gradient inference endpoint URL |
| `GRADIENT_MODEL` | No | `llama3-8b-instruct` | Model name to use for LLM inference |

---

## DigitalOcean Gradient

Poseidon uses DigitalOcean's [Gradient](https://www.digitalocean.com/products/gradient) platform for LLM inference. Gradient exposes an OpenAI-compatible `/v1/chat/completions` endpoint, which means Poseidon can target any Gradient-hosted model by changing a single environment variable — no SDK swap required.

The Poseidon persona prompt instructs the model to respond in character as a seasoned maritime navigator: using knots, compass bearings, the Beaufort scale, and concise nautical prose. The weather context injected into every chat request (5 waypoints of wave height, wave period, swell, and wind) gives the model grounded, route-specific data to reason from rather than general sailing advice.

---

## Hackathon Context

This project is a submission to the **DigitalOcean Gradient AI Hackathon** (deadline March 18, 2026), targeting the **Best AI Agent Persona** prize category. Poseidon demonstrates a purpose-built agent persona that uses domain-specific data (marine weather) to make an LLM's output genuinely useful — not just stylistically distinct, but substantively better than asking a general-purpose chatbot about your sailing route.
