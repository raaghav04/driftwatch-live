from datetime import datetime
from pydantic import BaseModel


class MetricPoint(BaseModel):
    metric: str
    value: float
    unit: str
    source: str
    observed_at: datetime


class DriftSignal(BaseModel):
    metric: str
    domain: str
    z_score: float
    psi_like: float
    adwin_score: float
    severity: str
    trend: str
    is_drift: bool


class DomainContribution(BaseModel):
    domain: str
    share: float
    avg_abs_z: float
    drift_count: int


class DriftInsight(BaseModel):
    regime: str
    forecast_15m_score: float
    velocity: float
    acceleration: float
    entropy: float
    domain_contribution: list[DomainContribution]
    hottest_metrics: list[str]


class DriftReport(BaseModel):
    generated_at: datetime
    drift_score: float
    alert_level: str
    drifted_metrics: int
    by_metric: list[DriftSignal]
    live_points: list[MetricPoint]
    insight: DriftInsight


class CorrectedMetric(BaseModel):
    metric: str
    before_value: float
    corrected_value: float
    unit: str
    drift_percent: float
    accuracy_before_percent: float
    accuracy_after_percent: float
    corrected: bool


class CorrectionReport(BaseModel):
    generated_at: datetime
    total_drift_percent: float
    average_accuracy_before_percent: float
    average_accuracy_after_percent: float
    improved_metrics: int
    total_metrics: int
    metrics: list[CorrectedMetric]
