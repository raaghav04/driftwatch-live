from datetime import UTC, datetime, timedelta

from app.schemas.drift import MetricPoint
from app.services.drift_engine import DriftEngine


def test_detects_simple_drift():
    now = datetime.now(UTC)
    baseline = {
        "temperature_variation": [
            MetricPoint(
                metric="temperature_variation",
                value=20.0 + (i % 3),
                unit="degC",
                source="test",
                observed_at=now - timedelta(hours=100 - i),
            )
            for i in range(100)
        ]
    }
    live = [
        MetricPoint(
            metric="temperature_variation",
            value=37.5,
            unit="degC",
            source="test",
            observed_at=now,
        )
    ]
    report = DriftEngine().build_report(baseline, live)
    assert report.by_metric[0].is_drift is True

