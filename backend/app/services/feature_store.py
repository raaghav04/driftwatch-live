from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta
import json
from pathlib import Path

from app.schemas.drift import MetricPoint


class FeatureStore:
    def __init__(self, data_dir: str):
        base = Path(data_dir)
        self.live_path = base / "raw" / "live_points.jsonl"
        self.live_path.parent.mkdir(parents=True, exist_ok=True)
        self.live_path.touch(exist_ok=True)

    def append_points(self, points: list[MetricPoint]) -> None:
        with self.live_path.open("a", encoding="utf-8") as f:
            for p in points:
                d = p.model_dump()
                d["observed_at"] = p.observed_at.isoformat()
                f.write(json.dumps(d) + "\n")

    def load_points(self, hours: int) -> list[MetricPoint]:
        min_time = datetime.now(UTC) - timedelta(hours=hours)
        rows: list[MetricPoint] = []
        with self.live_path.open("r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                observed_at = datetime.fromisoformat(d["observed_at"])
                if observed_at >= min_time:
                    rows.append(
                        MetricPoint(
                            metric=d["metric"],
                            value=float(d["value"]),
                            unit=d["unit"],
                            source=d["source"],
                            observed_at=observed_at,
                        )
                    )
        return rows

    @staticmethod
    def group_by_metric(points: list[MetricPoint]) -> dict[str, list[MetricPoint]]:
        grouped: dict[str, list[MetricPoint]] = defaultdict(list)
        for p in points:
            grouped[p.metric].append(p)
        return grouped
