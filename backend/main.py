import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import gradient_client
from weather import build_route_forecast
from poseidon import build_system_prompt, format_weather_summary

load_dotenv()

app = FastAPI(title="Poseidon")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

vessels: dict[str, dict] = {}


class VesselProfile(BaseModel):
    name: str
    type: str
    length_ft: int
    draft_ft: float
    propulsion: str  # "sail" | "motor" | "both"


class ChatRequest(BaseModel):
    vessel_id: str
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    departure_iso: str
    message: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/vessel")
def save_vessel(profile: VesselProfile):
    vessel_id = str(uuid.uuid4())[:8]
    vessels[vessel_id] = profile.model_dump()
    return {"vessel_id": vessel_id}


@app.get("/api/vessel/{vessel_id}")
def get_vessel(vessel_id: str):
    if vessel_id not in vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return vessels[vessel_id]


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if req.vessel_id not in vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")

    vessel = vessels[req.vessel_id]
    forecast = await build_route_forecast(
        req.origin_lat, req.origin_lon,
        req.dest_lat, req.dest_lon,
        req.departure_iso,
    )
    weather_summary = format_weather_summary(forecast)
    system_prompt = build_system_prompt(
        vessel["type"], vessel["length_ft"], vessel["draft_ft"], vessel["propulsion"]
    )
    user_message = f"{req.message}\n\nWeather data along your route:\n{weather_summary}"
    response = await gradient_client.chat(system_prompt, user_message)
    return {"response": response, "forecast": forecast}
