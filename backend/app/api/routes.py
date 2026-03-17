from __future__ import annotations

from datetime import UTC, datetime
import logging

from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.schemas.drift import CorrectionReport, DriftReport
from app.services.assistant import answer_question
from app.services.drift_engine import DriftConfig, DriftEngine
from app.services.feature_store import FeatureStore
from app.services.http_client import SharedHTTPClient
from app.services.providers import GeoPoint, LiveDataProviders
from app.services.trainer import BaselineTrainer

router = APIRouter(prefix="/api/v1", tags=["drift"])
logger = logging.getLogger(__name__)
store = FeatureStore(settings.data_dir)
drift_engine = DriftEngine(DriftConfig(z_threshold=settings.zscore_alert_threshold))
trainer = BaselineTrainer()


async def _collect_live(lat: float, lon: float):
    client = SharedHTTPClient()
    providers = LiveDataProviders(client)
    try:
        point = GeoPoint(lat=lat, lon=lon)
        try:
            space = await providers.fetch_space_physics()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Space provider failed: %s", exc)
            space = []
        try:
            env = await providers.fetch_environment(point)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Environment provider failed: %s", exc)
            env = []
        try:
            bio = await providers.fetch_biology(point)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Biology provider failed: %s", exc)
            bio = []
        all_points = space + env + bio
        return all_points
    finally:
        await client.close()


@router.get("/live/snapshot")
async def live_snapshot(
    lat: float = Query(default=37.7749, ge=-90, le=90),
    lon: float = Query(default=-122.4194, ge=-180, le=180),
):
    points = await _collect_live(lat, lon)
    store.append_points(points)
    return {"generated_at": datetime.now(UTC), "count": len(points), "points": points}


@router.get("/drift/report", response_model=DriftReport)
async def drift_report(
    lat: float = Query(default=37.7749, ge=-90, le=90),
    lon: float = Query(default=-122.4194, ge=-180, le=180),
):
    live = await _collect_live(lat, lon)
    store.append_points(live)
    baseline_points = store.load_points(settings.baseline_window_hours)
    grouped = store.group_by_metric(baseline_points)
    report = drift_engine.build_report(grouped, live)
    return report


@router.post("/drift/detect-correct", response_model=CorrectionReport)
async def detect_correct_drift(
    lat: float = Query(default=37.7749, ge=-90, le=90),
    lon: float = Query(default=-122.4194, ge=-180, le=180),
):
    live = await _collect_live(lat, lon)
    store.append_points(live)
    baseline_points = store.load_points(settings.baseline_window_hours)
    grouped = store.group_by_metric(baseline_points)
    report = drift_engine.detect_and_correct(grouped, live)
    return report


@router.post("/models/train")
async def train_models(hours: int = Query(default=24 * 90, ge=24, le=24 * 365)):
    history = store.load_points(hours)
    artifacts = trainer.train(history)
    if not artifacts:
        raise HTTPException(status_code=400, detail="Not enough historical points to train baseline model.")
    return {"trained_at": datetime.now(UTC), "metrics": artifacts.metrics, "model_path": artifacts.model_path}


@router.post("/assistant/query", response_model=AssistantQueryResponse)
async def assistant_query(payload: AssistantQueryRequest):
    report: DriftReport | None = None
    needs_live = any(
        token in payload.question.lower()
        for token in ["live", "current", "status", "alert", "drift", "now"]
    )
    if needs_live:
        live = await _collect_live(payload.lat, payload.lon)
        store.append_points(live)
        baseline_points = store.load_points(settings.baseline_window_hours)
        grouped = store.group_by_metric(baseline_points)
        report = drift_engine.build_report(grouped, live)

    answer, in_scope, matched, confidence = answer_question(
        payload.question,
        report=report,
        correction=payload.correction_summary,
    )
    return AssistantQueryResponse(
        answer=answer,
        in_scope=in_scope,
        matched_topics=matched,
        confidence=confidence,
    )
