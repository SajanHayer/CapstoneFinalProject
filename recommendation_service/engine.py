from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

import pandas as pd


@dataclass
class RecommendationResult:
    listing_id: int
    score: float
    behavior_score: float
    content_score: float
    popularity_score: float
    explanations: list[str]


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().lower()


def _normalize_location(value: Any) -> str:
    raw = _safe_text(value)
    if not raw:
        return ""
    parts = [part.strip() for part in raw.split(",") if part.strip()]
    if len(parts) >= 2:
        return ", ".join(parts[-2:])
    return raw


def _price_similarity(candidate_price: float, target_price: float) -> float:
    if candidate_price <= 0 or target_price <= 0:
        return 0.0
    gap = abs(candidate_price - target_price) / max(candidate_price, target_price)
    return max(0.0, 1.0 - min(gap, 1.0))


def _year_similarity(candidate_year: float, target_year: float) -> float:
    if candidate_year <= 0 or target_year <= 0:
        return 0.0
    gap = abs(candidate_year - target_year)
    return max(0.0, 1.0 - min(gap / 15.0, 1.0))


def _weighted_preferences(history_df: pd.DataFrame) -> dict[str, Any]:
    weights = pd.to_numeric(
        history_df["interaction_score"], errors="coerce"
    ).fillna(1.0).clip(lower=1.0)
    preferred_price = float(
        (history_df["price"].fillna(0.0) * weights).sum() / max(weights.sum(), 1.0)
    )
    preferred_year = float(
        (history_df["year"].fillna(0.0) * weights).sum() / max(weights.sum(), 1.0)
    )

    def top_counter(series_name: str) -> Counter[str]:
        counter: Counter[str] = Counter()
        for value, weight in zip(history_df[series_name], weights):
            normalized = _safe_text(value)
            if normalized:
                counter[normalized] += float(weight)
        return counter

    return {
        "preferred_price": preferred_price,
        "preferred_year": preferred_year,
        "type_counts": top_counter("type"),
        "location_counts": top_counter("location_bucket"),
        "make_counts": top_counter("make"),
        "condition_counts": top_counter("condition"),
    }


def _component_scores(candidate: pd.Series, preferences: dict[str, Any]) -> dict[str, float]:
    type_score = 1.0 if preferences["type_counts"].get(candidate["type"], 0.0) > 0 else 0.0
    location_score = (
        1.0 if preferences["location_counts"].get(candidate["location_bucket"], 0.0) > 0 else 0.0
    )
    make_score = 1.0 if preferences["make_counts"].get(candidate["make"], 0.0) > 0 else 0.0
    condition_score = (
        1.0 if preferences["condition_counts"].get(candidate["condition"], 0.0) > 0 else 0.0
    )
    price_score = _price_similarity(candidate["price"], preferences["preferred_price"])
    year_score = _year_similarity(candidate["year"], preferences["preferred_year"])

    content_score = (
        price_score * 0.35
        + type_score * 0.2
        + location_score * 0.2
        + make_score * 0.15
        + condition_score * 0.05
        + year_score * 0.05
    )

    behavior_score = type_score * 0.35 + location_score * 0.35 + make_score * 0.2 + condition_score * 0.1
    popularity_score = min(candidate["popularity"], 1.0)

    return {
        "content_score": round(content_score, 4),
        "behavior_score": round(behavior_score, 4),
        "popularity_score": round(popularity_score, 4),
        "price_score": round(price_score, 4),
        "type_score": round(type_score, 4),
        "location_score": round(location_score, 4),
        "make_score": round(make_score, 4),
    }


def _build_explanations(candidate: pd.Series, component_scores: dict[str, float]) -> list[str]:
    explanations: list[str] = []

    if component_scores["type_score"] >= 1:
        explanations.append(f"Matches your interest in {candidate['type']} listings")
    if component_scores["location_score"] >= 1:
        explanations.append(f"Near locations you have explored: {candidate['location_bucket_display']}")
    if component_scores["make_score"] >= 1:
        explanations.append(f"Same brand family as vehicles you viewed: {candidate['make_display']}")
    if component_scores["price_score"] >= 0.75:
        explanations.append("Priced close to the range you usually browse")

    if not explanations:
        explanations.append("Trending listing selected from marketplace activity")

    return explanations[:3]


def generate_recommendations(payload: dict[str, Any]) -> dict[str, Any]:
    history = payload.get("history", [])
    candidates = payload.get("candidates", [])
    limit = int(payload.get("limit", 6))

    history_df = pd.DataFrame(history)
    candidates_df = pd.DataFrame(candidates)

    if candidates_df.empty:
        return {"recommendations": []}

    for frame in [history_df, candidates_df]:
        if frame.empty:
            continue
        interaction_series = (
            frame["interaction_score"]
            if "interaction_score" in frame.columns
            else pd.Series([1.0] * len(frame), index=frame.index)
        )
        frame["price"] = pd.to_numeric(frame.get("price"), errors="coerce").fillna(0.0)
        frame["year"] = pd.to_numeric(frame.get("year"), errors="coerce").fillna(0.0)
        frame["interaction_score"] = pd.to_numeric(
            interaction_series, errors="coerce"
        ).fillna(1.0)
        frame["views_count"] = pd.to_numeric(frame.get("views_count"), errors="coerce").fillna(0.0)
        frame["bid_count"] = pd.to_numeric(frame.get("bid_count"), errors="coerce").fillna(0.0)
        frame["location_bucket"] = frame.get("location", "").map(_normalize_location)
        frame["type"] = frame.get("type", "").map(_safe_text)
        frame["make"] = frame.get("make", "").map(_safe_text)
        frame["condition"] = frame.get("condition", "").map(_safe_text)

    interacted_ids = set(history_df.get("listing_id", pd.Series(dtype=int)).tolist())
    candidates_df = candidates_df[~candidates_df["listing_id"].isin(interacted_ids)].copy()

    if candidates_df.empty:
        return {"recommendations": []}

    candidates_df["popularity"] = (
        (candidates_df["views_count"].clip(lower=0.0) / max(candidates_df["views_count"].max(), 1.0)) * 0.5
        + (candidates_df["bid_count"].clip(lower=0.0) / max(candidates_df["bid_count"].max(), 1.0)) * 0.5
    )
    candidates_df["location_bucket_display"] = candidates_df.get("location", "").fillna("")
    candidates_df["make_display"] = candidates_df.get("make", "").fillna("")

    if history_df.empty:
        ranked = candidates_df.sort_values(by=["popularity", "views_count"], ascending=False).head(limit)
        recommendations = [
            RecommendationResult(
                listing_id=int(row["listing_id"]),
                score=round(0.6 + float(row["popularity"]) * 0.4, 4),
                behavior_score=0.0,
                content_score=0.0,
                popularity_score=round(float(row["popularity"]), 4),
                explanations=["Popular with marketplace activity while your profile is still warming up"],
            )
            for _, row in ranked.iterrows()
        ]
    else:
        preferences = _weighted_preferences(history_df)
        recommendations = []

        for _, candidate in candidates_df.iterrows():
            component_scores = _component_scores(candidate, preferences)
            final_score = (
                component_scores["behavior_score"] * 0.4
                + component_scores["content_score"] * 0.45
                + component_scores["popularity_score"] * 0.15
            )

            recommendations.append(
                RecommendationResult(
                    listing_id=int(candidate["listing_id"]),
                    score=round(final_score, 4),
                    behavior_score=component_scores["behavior_score"],
                    content_score=component_scores["content_score"],
                    popularity_score=component_scores["popularity_score"],
                    explanations=_build_explanations(candidate, component_scores),
                )
            )

        recommendations.sort(key=lambda item: item.score, reverse=True)
        recommendations = recommendations[:limit]

    return {
        "recommendations": [
            {
                "listing_id": item.listing_id,
                "score": item.score,
                "behavior_score": item.behavior_score,
                "content_score": item.content_score,
                "popularity_score": item.popularity_score,
                "explanations": item.explanations,
            }
            for item in recommendations
        ]
    }
