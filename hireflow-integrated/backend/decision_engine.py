from typing import Dict, List, Any
from datetime import datetime

class CascadeFlowEngine:
    """
    CascadeFlow Decision Engine - The Autonomous Budget Gatekeeper
    Person 2's Module: Intercepts poor platform selections and reallocates capital
    """

    def __init__(self, job_title: str, total_budget: float, selected_platforms: List[str], hindsight_data: Dict):
        self.job_title = job_title
        self.total_budget = total_budget
        self.selected_platforms = selected_platforms
        self.hindsight_data = hindsight_data
        self.audit_log = []
        self.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.platform_stats = {}
        self.hindsight_citation = hindsight_data.get("citation")
        self.hindsight_source = hindsight_data.get("source", "unknown")
        self.hindsight_latency_ms = hindsight_data.get("latency_ms", 0)

    def _log(self, message: str, level: str = "INFO"):
        """Add entry to audit log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        self.audit_log.append({
            "timestamp": timestamp,
            "level": level,
            "message": message
        })

    def execute(self) -> Dict[str, Any]:
        """Main execution pipeline"""

        self._log("=" * 70, "SYSTEM")
        self._log("CASCADEFLOW RUNTIME: DISTRIBUTION INTERCEPTED", "SYSTEM")
        self._log(f"Campaign: {self.job_title}", "SYSTEM")
        self._log(f"Initial Budget: ${self.total_budget:.2f}", "SYSTEM")
        self._log(f"Platforms Selected by Human: {', '.join(self.selected_platforms)}", "SYSTEM")
        self._log(
            f"Hindsight recall: {self.hindsight_source} ({self.hindsight_latency_ms}ms)",
            "MEMORY",
        )
        if self.hindsight_citation:
            self._log(
                f"Citation: {self.hindsight_citation['platform']} campaign "
                f"#{self.hindsight_citation['campaign_id']} triggered governance review",
                "MEMORY",
            )
        self._log("=" * 70, "SYSTEM")

        keep_platforms, remove_platforms = self._analyze_platforms()
        budget_allocations = self._reallocate_budget(keep_platforms)
        model_routes = self._route_models(keep_platforms)
        result = self._generate_result(keep_platforms, remove_platforms, budget_allocations, model_routes)

        return result

    def _analyze_platforms(self):
        """Step 1: Analyze platforms against historical data"""
        self._log("", "INFO")
        self._log("PHASE 1: HISTORICAL PERFORMANCE ANALYSIS", "PHASE")

        keep = []
        remove = []

        self.platform_stats = self._build_platform_stats()

        for platform in self.selected_platforms:
            stats = self.platform_stats.get(platform, self._empty_stats(platform))

            if not stats["has_data"]:
                self._log(f"{platform}: NO HISTORICAL DATA PROVIDED", "DECISION")
                self._log("   VERDICT: KEEPING platform; no synthetic rating applied", "DECISION")
                keep.append(platform)
                continue

            self._log(f"{platform}: {stats['campaigns']} campaigns, ${stats['total_spend']:.2f} spent, {stats['total_hires']} hires", "DATA")
            self._log(f"   Conversion Rate: {stats['conversion_rate']:.2f}%", "DATA")
            self._log(f"   Hire Efficiency: {stats['hire_efficiency']:.4f} hires per dollar", "DATA")

            if stats["total_spend"] > 0 and stats["total_hires"] == 0:
                budget_per_platform = self.total_budget / len(self.selected_platforms)

                self._log(f"   VERDICT: REMOVING from distribution", "DECISION")
                self._log(f"   Budget Impact: ${budget_per_platform:.2f} saved", "BUDGET")

                remove.append({
                    "platform": platform,
                    "reason": f"Provided history shows ${stats['total_spend']:.2f} spent with 0 hires",
                    "budget_saved": round(budget_per_platform, 2)
                })
            else:
                self._log("   VERDICT: KEEPING platform", "DECISION")
                keep.append(platform)

        return keep, remove

    def _build_platform_stats(self) -> Dict[str, Dict[str, Any]]:
        history = self.hindsight_data.get("history", [])
        stats_by_platform = {}

        for entry in history:
            platform = str(entry.get("platform", "")).strip()
            if not platform:
                continue

            stats = stats_by_platform.setdefault(platform, self._empty_stats(platform))
            stats["has_data"] = True
            stats["campaigns"] += float(entry.get("campaigns") or 1)
            stats["total_spend"] += float(entry.get("total_spend") or 0)
            stats["total_applications"] += float(entry.get("total_applications") or 0)
            stats["total_interviews"] += float(entry.get("total_interviews") or 0)
            stats["total_hires"] += float(entry.get("total_hires") or 0)

        for stats in stats_by_platform.values():
            stats["conversion_rate"] = (
                (stats["total_hires"] / stats["total_applications"]) * 100
                if stats["total_applications"] > 0 else 0
            )
            stats["hire_efficiency"] = (
                stats["total_hires"] / stats["total_spend"]
                if stats["total_spend"] > 0 else 0
            )

        return stats_by_platform

    def _empty_stats(self, platform: str) -> Dict[str, Any]:
        return {
            "platform": platform,
            "has_data": False,
            "campaigns": 0,
            "total_spend": 0,
            "total_applications": 0,
            "total_interviews": 0,
            "total_hires": 0,
            "conversion_rate": 0,
            "hire_efficiency": 0,
        }

    def _reallocate_budget(self, keep_platforms: List[str]):
        """Step 2: Intelligently reallocate budget"""
        self._log("", "INFO")
        self._log("PHASE 2: BUDGET REALLOCATION", "PHASE")
        self._log(f"   Redistributing ${self.total_budget:.2f} across {len(keep_platforms)} platforms", "BUDGET")

        weights = {}
        scored_platforms = [
            platform for platform in keep_platforms
            if self.platform_stats.get(platform, {}).get("hire_efficiency", 0) > 0
        ]
        average_score = (
            sum(self.platform_stats[platform]["hire_efficiency"] for platform in scored_platforms) / len(scored_platforms)
            if scored_platforms else 1
        )

        for platform in keep_platforms:
            stats = self.platform_stats.get(platform, self._empty_stats(platform))
            weights[platform] = stats["hire_efficiency"] if stats["hire_efficiency"] > 0 else average_score

        total_weight = sum(weights.values())
        if total_weight == 0:
            self._log("   No eligible platforms remain after historical filtering", "BUDGET")
            return []

        allocations = []

        for platform in keep_platforms:
            amount = (weights[platform] / total_weight) * self.total_budget
            percentage = (weights[platform] / total_weight) * 100

            self._log(f"   {platform}: ${amount:.2f} ({percentage:.1f}%) [Weight: {weights[platform]:.4f}]", "BUDGET")

            allocations.append({
                "platform": platform,
                "amount": round(amount, 2),
                "percentage": round(percentage, 1),
                "weight": weights[platform]
            })

        return allocations

    def _route_models(self, keep_platforms: List[str]):
        """Step 3: Record downstream generation routing"""
        self._log("", "INFO")
        self._log("PHASE 3: MODEL ROUTING", "PHASE")

        routes = []

        for platform in keep_platforms:
            self._log(f"   {platform}: uses configured generation provider", "ROUTE")

            routes.append({
                "platform": platform,
                "model": "Configured externally",
                "cost": "Provider dependent",
                "tone": "Generated from campaign context"
            })

        return routes

    def _generate_result(self, keep_platforms, remove_platforms, budget_allocations, model_routes):
        """Step 4: Generate final result"""
        self._log("", "INFO")
        self._log("=" * 70, "SYSTEM")
        self._log("CASCADEFLOW DISTRIBUTION COMPLETE", "SYSTEM")

        total_saved = sum(p["budget_saved"] for p in remove_platforms)
        removed_names = [p["platform"] for p in remove_platforms]
        removed_text = ", ".join(removed_names) if removed_names else "no selected platforms"

        self._log(f"   Platforms Selected: {', '.join(keep_platforms)}", "RESULT")
        self._log(f"   Platforms Removed: {removed_text}", "RESULT")
        self._log(f"   Budget Saved: ${total_saved:.2f}", "RESULT")
        self._log(f"   Final Spend: ${self.total_budget:.2f}", "RESULT")
        self._log("=" * 70, "SYSTEM")

        return {
            "campaign_name": self.job_title,
            "timestamp": self.timestamp,
            "total_budget": self.total_budget,
            "budget_saved": round(total_saved, 2),
            "final_spend": self.total_budget,
            "platforms_selected": keep_platforms,
            "platforms_removed": remove_platforms,
            "budget_allocation": budget_allocations,
            "model_routing": model_routes,
            "audit_log": self.audit_log,
            "override": {
                "triggered": len(remove_platforms) > 0,
                "removed_platforms": removed_names,
                "citation": self.hindsight_citation,
            },
            "decision_summary": (
                f"The user asked to post to {len(self.selected_platforms)} platforms. "
                f"CascadeFlow posted to {len(keep_platforms)} based only on supplied historical data. "
                f"Removed platforms: {removed_text}. "
                f"${total_saved:.2f} was reallocated across retained platforms."
            )
        }
