import json
import os
import re
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from hindsight_client import Hindsight
except ImportError:  # Demo can still run from local retained data.
    Hindsight = None


BANK_ID = os.environ.get("HINDSIGHT_BANK_ID", "hireflow-campaigns")
BASE_URL = os.environ.get("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
API_KEY = os.environ.get("HINDSIGHT_API_KEY", "")
CAMPAIGNS_FILE = Path(__file__).resolve().parent / "data" / "campaigns.json"


def load_campaigns() -> List[Dict[str, Any]]:
    with CAMPAIGNS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def build_memory_text(campaign: Dict[str, Any]) -> str:
    return (
        f"Campaign ID {campaign['campaign_id']}: Role '{campaign['role']}' was posted on "
        f"{campaign['platform']}. Budget was ${campaign['budget']}. It received "
        f"{campaign['applications']} applications, {campaign['interviews']} interviews, "
        f"and resulted in {campaign['hires']} hires. Full campaign JSON: "
        f"{json.dumps(campaign, sort_keys=True)}"
    )


def get_client() -> Optional[Any]:
    if Hindsight is None or not API_KEY:
        return None
    return Hindsight(base_url=BASE_URL, api_key=API_KEY)


def retain_campaign_memory() -> Dict[str, Any]:
    client = get_client()
    campaigns = load_campaigns()

    if client is None:
        return {
            "status": "local-only",
            "retained": 0,
            "message": "Set HINDSIGHT_API_KEY to retain campaign memory in Hindsight.",
        }

    try:
        client.create_bank(
            bank_id=BANK_ID,
            name="HireFlow AI Campaign Memory",
            mission="Store full historical recruitment campaign outcomes for runtime platform governance.",
            disposition={"skepticism": 0.4, "literalism": 0.85, "empathy": 0.2},
            retain_mission="Preserve role, platform, budget, applications, interviews, hires, and source campaign ids.",
        )
    except Exception:
        pass

    retained = 0
    for campaign in campaigns:
        client.retain(
            bank_id=BANK_ID,
            content=build_memory_text(campaign),
            document_id=f"campaign-{campaign['campaign_id']}",
            metadata={
                "role": str(campaign["role"]),
                "platform": str(campaign["platform"]),
                "campaign_id": str(campaign["campaign_id"]),
            },
            tags=["hireflow", "campaign-history", str(campaign["platform"])],
            update_mode="replace",
        )
        retained += 1

    return {"status": "retained", "retained": retained, "bank_id": BANK_ID}


def recall_campaign_memory(role: str, platforms: List[str], timeout_ms: int = 900) -> Dict[str, Any]:
    start = time.perf_counter()
    campaigns = load_campaigns()
    platform_campaigns: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    citations: List[Dict[str, Any]] = []
    recall_source = "local-json"

    client = get_client()
    if client is not None:
        try:
            recall_source = "hindsight"
            for platform in platforms:
                query = f"{role} hiring campaign on {platform}"
                print(f"[HINDSIGHT MEMORY] HINDSIGHT RECALL ACTIVE query='{query}' bank_id='{BANK_ID}'")
                response = client.recall(bank_id=BANK_ID, query=query)
                for memory in getattr(response, "results", []):
                    text = getattr(memory, "text", str(memory))
                    for campaign_id in re.findall(r"Campaign ID (\d+)", text):
                        match = next(
                            (item for item in campaigns if item["campaign_id"] == int(campaign_id)),
                            None,
                        )
                        if match and match["platform"] == platform:
                            platform_campaigns[platform].append(match)
                            citations.append(_citation(match, text, "Hindsight recall"))

                if (time.perf_counter() - start) * 1000 > timeout_ms:
                    break
        except Exception as error:
            recall_source = f"hindsight-fallback: {error.__class__.__name__}"

    if not any(platform_campaigns.values()):
        role_lower = role.lower()
        for campaign in campaigns:
            if campaign["platform"] in platforms and _role_matches(role_lower, campaign["role"].lower()):
                platform_campaigns[campaign["platform"]].append(campaign)
                citations.append(_citation(campaign, build_memory_text(campaign), "Local retained memory"))

    history = [_to_history_entry(campaign) for matches in platform_campaigns.values() for campaign in matches]
    citation = _select_override_citation(citations, platforms) or (citations[0] if citations else None)

    return {
        "source": recall_source,
        "latency_ms": round((time.perf_counter() - start) * 1000, 1),
        "history": history,
        "citation": citation,
        "citations": citations[:8],
    }


def _role_matches(requested_role: str, stored_role: str) -> bool:
    requested_tokens = set(re.findall(r"[a-z]+", requested_role))
    stored_tokens = set(re.findall(r"[a-z]+", stored_role))
    return requested_role in stored_role or stored_role in requested_role or bool(requested_tokens & stored_tokens)


def _to_history_entry(campaign: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "campaign_id": campaign["campaign_id"],
        "role": campaign["role"],
        "platform": campaign["platform"],
        "campaigns": 1,
        "total_spend": campaign["budget"],
        "total_applications": campaign["applications"],
        "total_interviews": campaign["interviews"],
        "total_hires": campaign["hires"],
    }


def _citation(campaign: Dict[str, Any], text: str, source: str) -> Dict[str, Any]:
    return {
        "campaign_id": campaign["campaign_id"],
        "platform": campaign["platform"],
        "role": campaign["role"],
        "source": source,
        "snippet": text,
    }


def _select_override_citation(citations: List[Dict[str, Any]], platforms: List[str]) -> Optional[Dict[str, Any]]:
    for platform in platforms:
        matches = [citation for citation in citations if citation["platform"] == platform]
        if any("0 hires" in citation["snippet"] for citation in matches):
            return next(citation for citation in matches if "0 hires" in citation["snippet"])
    return None
