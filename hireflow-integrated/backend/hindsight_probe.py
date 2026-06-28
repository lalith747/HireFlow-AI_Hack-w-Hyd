import os
import time

from hindsight_client import Hindsight


TEST_FACT = "Test fact: Grok API verified on 2026-06-28"
TEST_QUERY = "Grok API verified"
TEST_BANK_ID = os.environ.get("HINDSIGHT_TEST_BANK_ID", "hireflow-hindsight-runtime-proof")
TEST_DOCUMENT_ID = "proof-grok-api-verified-2026-06-28"


def _read_result_content(result):
    return (
        getattr(result, "content", None)
        or getattr(result, "text", None)
        or (result.get("content") if isinstance(result, dict) else None)
        or (result.get("text") if isinstance(result, dict) else None)
        or str(result)
    )


def _read_result_score(result):
    return (
        getattr(result, "score", None)
        or getattr(result, "similarity", None)
        or (result.get("score") if isinstance(result, dict) else None)
        or (result.get("similarity") if isinstance(result, dict) else None)
    )


def run_probe():
    base_url = os.environ.get("HINDSIGHT_BASE_URL", "http://localhost:8888")
    api_key = os.environ.get("HINDSIGHT_API_KEY")
    client = Hindsight(base_url=base_url, api_key=api_key)

    print(f"[HINDSIGHT MEMORY] probe_base_url={base_url} bank_id={TEST_BANK_ID}")

    try:
        client.create_bank(
            bank_id=TEST_BANK_ID,
            name="HireFlow Hindsight Runtime Proof",
            mission="Store and recall runtime proof facts for the HireFlow AI demo.",
            disposition={"skepticism": 0.2, "literalism": 0.9, "empathy": 0.2},
        )
        print("[HINDSIGHT MEMORY] create_bank=ok")
    except Exception as error:
        print(f"[HINDSIGHT MEMORY] create_bank=skipped_or_existing error={error.__class__.__name__}: {error}")

    retain_start = time.perf_counter()
    retain_response = client.retain(
        bank_id=TEST_BANK_ID,
        content=TEST_FACT,
        document_id=TEST_DOCUMENT_ID,
        metadata={"source": "hireflow-runtime-proof", "date": "2026-06-28"},
        tags=["runtime-proof", "grok"],
        update_mode="replace",
    )
    retain_ms = (time.perf_counter() - retain_start) * 1000
    print(f"[HINDSIGHT MEMORY] retain=ok latency_ms={retain_ms:.1f} response={retain_response}")

    recall_start = time.perf_counter()
    recall_response = client.recall(
        bank_id=TEST_BANK_ID,
        query=TEST_QUERY,
        tags=["runtime-proof"],
        include_source_facts=True,
    )
    recall_ms = (time.perf_counter() - recall_start) * 1000
    results = getattr(recall_response, "results", []) or []

    if not results:
        raise RuntimeError("Recall returned no results")

    top = results[0]
    content = _read_result_content(top)
    score = _read_result_score(top)
    print(f"[HINDSIGHT MEMORY] recall=ok latency_ms={recall_ms:.1f} score={score} content={content}")

    if TEST_FACT not in content:
        raise RuntimeError(f"Recall did not return exact test fact. content={content}")
    if score is not None and float(score) < 0.7:
        raise RuntimeError(f"Recall score below threshold: {score}")
    if recall_ms > 600:
        raise RuntimeError(f"Recall latency above threshold: {recall_ms:.1f}ms")

    reflect_response = client.reflect(
        bank_id=TEST_BANK_ID,
        query="Summarize what was verified about the Grok API.",
        tags=["runtime-proof"],
        include_facts=True,
    )
    print(f"[HINDSIGHT MEMORY] reflect=ok response={reflect_response}")
    return True


if __name__ == "__main__":
    run_probe()
