from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List
import uvicorn

try:
    from .decision_engine import CascadeFlowEngine
    from .hindsight_service import BANK_ID, load_campaigns, recall_campaign_memory, retain_campaign_memory
except ImportError:
    from decision_engine import CascadeFlowEngine
    from hindsight_service import BANK_ID, load_campaigns, recall_campaign_memory, retain_campaign_memory


app = FastAPI(title="HireFlow AI Integrated Runtime")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CampaignRequest(BaseModel):
    job_title: str = Field(..., min_length=1)
    budget: float = Field(..., gt=0)
    platforms: List[str] = Field(..., min_length=1)

    @field_validator("job_title")
    @classmethod
    def job_title_must_not_be_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Job title is required")
        return stripped

    @field_validator("platforms")
    @classmethod
    def platforms_must_not_be_blank(cls, value: List[str]) -> List[str]:
        platforms = [platform.strip() for platform in value if platform.strip()]
        if not platforms:
            raise ValueError("At least one platform is required")
        return platforms


@app.get("/")
async def root():
    return {
        "service": "HireFlow AI Integrated Runtime",
        "flow": "UI -> CascadeFlow intercept -> Hindsight recall -> CascadeFlow gate -> UI audit",
    }


@app.post("/api/setup-memory")
async def setup_memory():
    return retain_campaign_memory()


@app.get("/api/memory")
async def memory_profile():
    campaigns = load_campaigns()
    platforms = sorted({campaign["platform"] for campaign in campaigns})
    roles = sorted({campaign["role"] for campaign in campaigns})
    zero_hire_campaigns = [
        campaign for campaign in campaigns
        if campaign["hires"] == 0
    ]

    return {
        "bank_id": BANK_ID,
        "campaign_count": len(campaigns),
        "platforms": platforms,
        "roles": roles[:10],
        "zero_hire_count": len(zero_hire_campaigns),
        "campaigns": campaigns,
        "sample_campaigns": campaigns[:8],
        "risk_examples": zero_hire_campaigns[:6],
    }


@app.post("/api/launch")
async def launch_campaign(request: CampaignRequest):
    try:
        print("[CascadeFlow] Runtime intercept received", request.model_dump())
        memory = recall_campaign_memory(request.job_title, request.platforms)
        print(
            f"[Hindsight] recall source={memory['source']} "
            f"history={len(memory['history'])} latency={memory['latency_ms']}ms"
        )

        engine = CascadeFlowEngine(
            job_title=request.job_title,
            total_budget=request.budget,
            selected_platforms=request.platforms,
            hindsight_data={
                "history": memory["history"],
                "citation": memory["citation"],
                "source": memory["source"],
                "latency_ms": memory["latency_ms"],
            },
        )

        result = engine.execute()
        result["hindsight"] = {
            "bank_id": BANK_ID,
            "source": memory["source"],
            "latency_ms": memory["latency_ms"],
            "citation": memory["citation"],
            "citations": memory["citations"],
            "history_count": len(memory["history"]),
        }
        result["cascadeflow"] = {
            "intercepted": True,
            "overrode_user_action": len(result["platforms_removed"]) > 0,
            "decision": "override" if result["platforms_removed"] else "allow",
            "runtime_path": [
                "UI submitted campaign payload",
                "CascadeFlow intercepted launch request",
                "Hindsight recall supplied campaign history",
                "CascadeFlow evaluated governance gate",
                "UI rendered decision, citation, and audit trail",
            ],
        }
        result["request_payload"] = request.model_dump()

        return result

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/api/health")
async def health_check():
    return {"status": "operational", "engine": "CascadeFlow", "memory_bank": BANK_ID}


if __name__ == "__main__":
    print("Starting HireFlow AI integrated runtime...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
