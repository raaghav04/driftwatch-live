from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path

import numpy as np
from sklearn.ensemble import IsolationForest

from app.schemas.drift import MetricPoint


@dataclass
class TrainingArtifacts:
    metrics: list[str]
    model_path: str


class BaselineTrainer:
    def __init__(self, model_dir: str = "data/processed"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)

    def build_matrix(self, points: list[MetricPoint]) -> tuple[np.ndarray, list[str]]:
        by_metric: dict[str, list[float]] = {}
        for p in points:
            by_metric.setdefault(p.metric, []).append(p.value)

        metrics = sorted(by_metric.keys())
        min_len = min((len(v) for v in by_metric.values()), default=0)
        if min_len == 0:
            return np.zeros((0, 0)), metrics

        matrix = np.column_stack([np.array(by_metric[m][-min_len:]) for m in metrics])
        return matrix, metrics

    def train(self, points: list[MetricPoint]) -> TrainingArtifacts | None:
        matrix, metrics = self.build_matrix(points)
        if matrix.size == 0 or matrix.shape[0] < 32:
            return None

        model = IsolationForest(n_estimators=300, contamination=0.05, random_state=42)
        model.fit(matrix)
        model_path = self.model_dir / "isolation_forest.npz"
        np.savez(model_path, estimators=np.array([e.tree_.max_depth for e in model.estimators_]), metrics=metrics)

        meta_path = self.model_dir / "baseline_meta.json"
        meta_path.write_text(json.dumps({"metrics": metrics}, indent=2), encoding="utf-8")
        return TrainingArtifacts(metrics=metrics, model_path=str(model_path))

