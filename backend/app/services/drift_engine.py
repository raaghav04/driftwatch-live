from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from math import log
from statistics import mean, pstdev

from river.drift import ADWIN

from app.schemas.drift import (
    CorrectionReport,
    CorrectedMetric,
    DomainContribution,
    DriftInsight,
    DriftReport,
    DriftSignal,
    MetricPoint,
)


@dataclass
class DriftConfig:
    z_threshold: float = 2.5
    min_history: int = 24


class DriftEngine:
    def __init__(self, config: DriftConfig | None = None):
        self.config = config or DriftConfig()
        self._adwin = ADWIN()

    def _zscore(self, value: float, history: list[float]) -> float:
        mu = mean(history)
        sigma = pstdev(history) if len(history) > 1 else 0.0
        if sigma == 0:
            return 0.0
        return (value - mu) / sigma

    @staticmethod
    def _psi_like(value: float, history: list[float]) -> float:
        if not history:
            return 0.0
        hmin = min(history)
        hmax = max(history)
        if hmax == hmin:
            return 0.0
        norm = (value - hmin) / (hmax - hmin)
        return abs(norm - 0.5) * 2.0

    @staticmethod
    def _domain(metric: str) -> str:
        m = metric.lower()
        if any(k in m for k in ["solar", "geomagnetic", "cosmic", "wind"]):
            return "space"
        if any(k in m for k in ["ozone", "co2", "humidity", "temperature"]):
            return "chem"
        return "bio"

    @staticmethod
    def _trend(value: float, history: list[float]) -> str:
        if len(history) < 2:
            return "stable"
        tail = history[-6:] if len(history) >= 6 else history
        ref = mean(tail)
        delta = value - ref
        mag = abs(ref) * 0.02 + 1e-9
        if delta > mag:
            return "rising"
        if delta < -mag:
            return "falling"
        return "stable"

    @staticmethod
    def _severity(abs_z: float, psi: float, adwin_flag: bool) -> str:
        if abs_z >= 4.0 or (adwin_flag and psi > 0.7):
            return "extreme"
        if abs_z >= 3.0 or psi > 0.75:
            return "high"
        if abs_z >= 2.0 or psi > 0.55:
            return "elevated"
        return "normal"

    @staticmethod
    def _accuracy_percent(value: float, mu: float, sigma: float) -> float:
        denom = max(3.0 * sigma, abs(mu) * 0.05, 1e-9)
        err = abs(value - mu)
        return max(0.0, min(100.0, (1.0 - err / denom) * 100.0))

    def build_report(self, baseline: dict[str, list[MetricPoint]], live_points: list[MetricPoint]) -> DriftReport:
        signals: list[DriftSignal] = []
        drift_flags = 0
        max_abs_z = 0.0
        velocity_parts: list[float] = []
        acceleration_parts: list[float] = []
        domain_energy = {"space": 0.0, "chem": 0.0, "bio": 0.0}
        domain_drift = {"space": 0, "chem": 0, "bio": 0}

        for p in live_points:
            hist_points = baseline.get(p.metric, [])
            hist_vals = [x.value for x in hist_points]
            domain = self._domain(p.metric)
            if len(hist_vals) < self.config.min_history:
                signal = DriftSignal(
                    metric=p.metric,
                    domain=domain,
                    z_score=0.0,
                    psi_like=0.0,
                    adwin_score=0.0,
                    severity="normal",
                    trend="stable",
                    is_drift=False,
                )
                signals.append(signal)
                continue

            z = self._zscore(p.value, hist_vals)
            psi = self._psi_like(p.value, hist_vals)
            self._adwin.update(abs(z))
            adwin_flag = self._adwin.drift_detected
            adwin_score = min(1.0, abs(z) / 5.0 + (0.25 if adwin_flag else 0.0))
            is_drift = abs(z) >= self.config.z_threshold or adwin_flag
            if is_drift:
                drift_flags += 1
                domain_drift[domain] += 1
            max_abs_z = max(max_abs_z, abs(z))
            domain_energy[domain] += abs(z)

            sigma = pstdev(hist_vals) if len(hist_vals) > 1 else 0.0
            if sigma > 0 and len(hist_vals) >= 3:
                v = abs(p.value - hist_vals[-1]) / sigma
                a = abs((p.value - hist_vals[-1]) - (hist_vals[-1] - hist_vals[-2])) / sigma
                velocity_parts.append(min(v, 5.0))
                acceleration_parts.append(min(a, 5.0))

            signals.append(
                DriftSignal(
                    metric=p.metric,
                    domain=domain,
                    z_score=float(z),
                    psi_like=float(psi),
                    adwin_score=float(adwin_score),
                    severity=self._severity(abs(z), psi, adwin_flag),
                    trend=self._trend(p.value, hist_vals),
                    is_drift=is_drift,
                )
            )

        score = (drift_flags / max(len(live_points), 1)) * 0.7 + min(max_abs_z / 5.0, 1.0) * 0.3
        if score >= 0.7:
            level = "critical"
        elif score >= 0.4:
            level = "high"
        elif score >= 0.2:
            level = "moderate"
        else:
            level = "low"

        total_energy = sum(domain_energy.values()) or 1e-9
        contrib: list[DomainContribution] = []
        for name in ["space", "chem", "bio"]:
            shares = domain_energy[name] / total_energy
            rows = [s for s in signals if s.domain == name]
            avg_abs = mean([abs(s.z_score) for s in rows]) if rows else 0.0
            contrib.append(
                DomainContribution(
                    domain=name,
                    share=float(round(shares, 4)),
                    avg_abs_z=float(round(avg_abs, 4)),
                    drift_count=domain_drift[name],
                )
            )

        probs = [max(c.share, 1e-12) for c in contrib]
        entropy = -sum(p * log(p) for p in probs) / log(3)
        velocity = min(1.0, (mean(velocity_parts) / 3.0) if velocity_parts else 0.0)
        acceleration = min(1.0, (mean(acceleration_parts) / 3.0) if acceleration_parts else 0.0)
        forecast = min(1.0, score + velocity * 0.12 + acceleration * 0.08 + entropy * 0.05)

        if forecast >= 0.75 and acceleration >= 0.4:
            regime = "shock-front"
        elif forecast >= 0.6 and velocity >= 0.35:
            regime = "systemic-shift"
        elif entropy >= 0.8 and forecast >= 0.35:
            regime = "oscillatory-multi-domain"
        elif forecast < 0.2:
            regime = "stable-laminar"
        else:
            regime = "transitional"

        hot = [
            s.metric
            for s in sorted(signals, key=lambda x: (x.adwin_score + abs(x.z_score) * 0.15), reverse=True)[:4]
        ]

        return DriftReport(
            generated_at=datetime.now(UTC),
            drift_score=float(round(score, 4)),
            alert_level=level,
            drifted_metrics=drift_flags,
            by_metric=signals,
            live_points=live_points,
            insight=DriftInsight(
                regime=regime,
                forecast_15m_score=float(round(forecast, 4)),
                velocity=float(round(velocity, 4)),
                acceleration=float(round(acceleration, 4)),
                entropy=float(round(entropy, 4)),
                domain_contribution=contrib,
                hottest_metrics=hot,
            ),
        )

    def detect_and_correct(
        self, baseline: dict[str, list[MetricPoint]], live_points: list[MetricPoint]
    ) -> CorrectionReport:
        rows: list[CorrectedMetric] = []
        drift_percents: list[float] = []
        before_acc_values: list[float] = []
        after_acc_values: list[float] = []
        improved = 0

        for p in live_points:
            hist_points = baseline.get(p.metric, [])
            hist_vals = [x.value for x in hist_points]
            if len(hist_vals) < self.config.min_history:
                row = CorrectedMetric(
                    metric=p.metric,
                    before_value=p.value,
                    corrected_value=p.value,
                    unit=p.unit,
                    drift_percent=0.0,
                    accuracy_before_percent=0.0,
                    accuracy_after_percent=0.0,
                    corrected=False,
                )
                rows.append(row)
                continue

            mu = mean(hist_vals)
            sigma = pstdev(hist_vals) if len(hist_vals) > 1 else 0.0
            z = self._zscore(p.value, hist_vals)
            drift_percent = min(100.0, (abs(z) / max(self.config.z_threshold, 1e-9)) * 100.0)

            corrected_value = p.value
            corrected = False
            if sigma > 0 and abs(z) >= self.config.z_threshold:
                lo = mu - 2.0 * sigma
                hi = mu + 2.0 * sigma
                clipped = max(lo, min(hi, p.value))
                corrected_value = (0.7 * clipped) + (0.3 * mu)
                corrected = True

            before_acc = self._accuracy_percent(p.value, mu, sigma)
            after_acc = self._accuracy_percent(corrected_value, mu, sigma)
            if after_acc > before_acc:
                improved += 1

            drift_percents.append(drift_percent)
            before_acc_values.append(before_acc)
            after_acc_values.append(after_acc)

            rows.append(
                CorrectedMetric(
                    metric=p.metric,
                    before_value=float(p.value),
                    corrected_value=float(corrected_value),
                    unit=p.unit,
                    drift_percent=float(round(drift_percent, 3)),
                    accuracy_before_percent=float(round(before_acc, 3)),
                    accuracy_after_percent=float(round(after_acc, 3)),
                    corrected=corrected,
                )
            )

        total = len(rows)
        return CorrectionReport(
            generated_at=datetime.now(UTC),
            total_drift_percent=float(round(mean(drift_percents), 3)) if drift_percents else 0.0,
            average_accuracy_before_percent=float(round(mean(before_acc_values), 3)) if before_acc_values else 0.0,
            average_accuracy_after_percent=float(round(mean(after_acc_values), 3)) if after_acc_values else 0.0,
            improved_metrics=improved,
            total_metrics=total,
            metrics=rows,
        )
