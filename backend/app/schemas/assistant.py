from __future__ import annotations

from pydantic import BaseModel, Field


class AssistantCorrectionSummary(BaseModel):
    total_drift_percent: float | None = None
    average_accuracy_before_percent: float | None = None
    average_accuracy_after_percent: float | None = None
    improved_metrics: int | None = None
    total_metrics: int | None = None


class AssistantQueryRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1200)
    lat: float = Field(default=37.7749, ge=-90, le=90)
    lon: float = Field(default=-122.4194, ge=-180, le=180)
    correction_summary: AssistantCorrectionSummary | None = None


class AssistantQueryResponse(BaseModel):
    answer: str
    in_scope: bool
    matched_topics: list[str]
    confidence: float
