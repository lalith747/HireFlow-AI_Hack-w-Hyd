"""
main.py
-------
FastAPI application for the HireFlow CascadeFlow backend.

Provides:
- POST /api/launch              — Campaign execution endpoint
- GET  /api/cascadeflow/verify  — Runtime proof that CascadeFlow is live
- GET  /api/cascadeflow/status  — Harness status
- GET  /api/health              — Basic health check
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from decision_engine import CascadeFlowEngine
from cascadeflow_runtime import init_cascadeflow, verify_cascadeflow, get_harness_status

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("main")

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class CampaignRequest(BaseModel):
    user_input: str = Field(..., min_length=10, description="Campaign brief / requirements")
    total_budget: float = Field(..., gt=0, description="Total campaign budget in USD")
    campaign_name: str = Field(default="", description="Optional campaign name")
    budget_cap: Optional[float] = Field(
        default=None,
        gt=0,
        description="Max LLM spend for this request (overrides default)",
    )
    labels: Optional[dict[str, str]] = Field(
        default=None,
        description="Optional metadata for session tracing",
    )


class CampaignResponse(BaseModel):
    campaign_name: str
    run_id: str
    timestamp: str
    total_budget: float
    complexity_score: int
    model_used: str
    platforms_selected: list[dict]
    budget_saved: float
    cascadeflow_session_summary: Optional[dict] = None
    metadata: dict


class VerifyResponse(BaseModel):
    overall_pass: bool
    details: dict


class StatusResponse(BaseModel):
    harness: dict
    groq_models: dict


class HealthResponse(BaseModel):
    status: str
    version: str


# ---------------------------------------------------------------------------
# App lifespan — initialize CascadeFlow once at startup
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan: initialise CascadeFlow harness on startup,
    clean up on shutdown.
    """
    logger.info("=== HireFlow CascadeFlow Backend Starting ===")

    init_cascadeflow(
        mode=os.getenv("CASCADEFLOW_MODE", "observe"),
        budget=float(os.getenv("CASCADEFLOW_DEFAULT_BUDGET", "1.00")),
        compliance=os.getenv("CASCADEFLOW_COMPLIANCE"),
        enable_audit=os.getenv("CASCADEFLOW_ENABLE_AUDIT", "true").lower() == "true",
        enable_cost_tracking=os.getenv("CASCADEFLOW_ENABLE_COST_TRACKING", "true").lower() == "true",
        enable_semantic_routing=os.getenv("CASCADEFLOW_ENABLE_SEMANTIC_ROUTING", "true").lower() == "true",
    )

    # Create the engine singleton
    app.state.engine = CascadeFlowEngine()

    logger.info("=== HireFlow CascadeFlow Backend Ready ===")
    yield
    logger.info("=== HireFlow CascadeFlow Backend Shutting Down ===")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HireFlow CascadeFlow Backend",
    version="2.0.0",
    description="Campaign decision engine with CascadeFlow runtime governance",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/health", response_model=HealthResponse)
async def health():
    """Basic health check."""
    return HealthResponse(status="ok", version="2.0.0")


@app.get("/api/cascadeflow/status", response_model=StatusResponse)
async def cascadeflow_status():
    """Return current CascadeFlow harness status and Groq model configuration."""
    return StatusResponse(
        harness=get_harness_status(),
        groq_models={
            "MODEL_SIMPLE": os.getenv("GROQ_MODEL_SIMPLE", "llama-3.1-8b-instant"),
            "MODEL_COMPLEX": os.getenv("GROQ_MODEL_COMPLEX", "llama-3.3-70b-versatile"),
        },
    )


@app.get("/api/cascadeflow/verify", response_model=VerifyResponse)
async def cascadeflow_verify():
    """
    Runtime proof that CascadeFlow is installed, initialized, and intercepting.

    This endpoint runs a minimal session to confirm the harness is live.
    """
    result = await verify_cascadeflow()
    return VerifyResponse(
        overall_pass=result["overall_pass"],
        details=result,
    )


@app.post("/api/launch", response_model=CampaignResponse)
async def launch_campaign(request: CampaignRequest):
    """
    Execute the campaign decision pipeline.

    Every LLM call inside this endpoint is governed by the CascadeFlow harness.
    """
    engine: CascadeFlowEngine = app.state.engine

    try:
        result = await engine.execute(
            user_input=request.user_input,
            total_budget=request.total_budget,
            campaign_name=request.campaign_name,
            budget_cap=request.budget_cap,
            labels=request.labels,
        )
        return CampaignResponse(**result)

    except Exception as exc:
        logger.exception("Campaign execution failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
