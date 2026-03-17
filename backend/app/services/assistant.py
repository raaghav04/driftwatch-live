from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.assistant import AssistantCorrectionSummary
from app.schemas.drift import DriftReport


TOKEN_RE = re.compile(r"[a-z0-9_]+")

SCOPE_TERMS = {
    "astro", "biochemical", "drift", "metric", "metrics", "alert", "dashboard", "website", "project",
    "data", "source", "sources", "nasa", "noaa", "ozone", "co2", "solar", "wind", "cosmic", "kp",
    "correct", "accuracy", "refresh", "api", "command", "palette", "home", "logo", "map", "panel",
    "run", "execute", "start", "status", "signal", "frontend", "backend", "server", "chatbot", "guide",
}


@dataclass(slots=True)
class TopicRule:
    name: str
    keywords: set[str]
    answer: str


TOPIC_RULES = [
    TopicRule(
        name="project_overview",
        keywords={"project", "overview", "what", "purpose", "system"},
        answer=(
            "This project is an astro-biochemical drift intelligence platform. It ingests live space physics, "
            "environmental chemistry, and biological proxy signals, compares them with baseline behavior, detects drift, "
            "and provides a detect-and-correct workflow with accuracy before/after."
        ),
    ),
    TopicRule(
        name="architecture",
        keywords={"architecture", "backend", "frontend", "stack", "api", "fastapi", "react", "vite"},
        answer=(
            "Architecture: FastAPI backend (`/api/v1`) for data collection + drift logic, and React/Vite frontend for "
            "dashboard visualization, controls, diagnostics, correction panel, and Astro Guide assistant."
        ),
    ),
    TopicRule(
        name="data_sources",
        keywords={"source", "sources", "nasa", "noaa", "open-meteo", "gbif", "where", "from"},
        answer=(
            "Live providers include space-weather and environmental/biological endpoints (for example NOAA/SWPC, Open-Meteo, "
            "and related proxy feeds). The exact active sources are shown in each live metric card/source label."
        ),
    ),
    TopicRule(
        name="drift_logic",
        keywords={"drift", "z", "zscore", "psi", "detect", "diagnostics", "stable"},
        answer=(
            "Drift detection compares current values against baseline windows using statistical signals (including Z-score and "
            "PSI-like indicators). Each metric is marked Drift/Stable, and the report aggregates this into a global drift score "
            "and alert level."
        ),
    ),
    TopicRule(
        name="correction",
        keywords={"correct", "correction", "accuracy", "before", "after", "improved"},
        answer=(
            "Use the Live Drift Correction panel. It calculates per-metric drift %, corrected values, and accuracy before/after, "
            "plus aggregate totals (total drift %, average accuracy before/after, and improved metric count)."
        ),
    ),
    TopicRule(
        name="how_to_run",
        keywords={"run", "start", "execute", "launch", "restart", "devctl", "localhost"},
        answer=(
            "Run from project root: `powershell -ExecutionPolicy Bypass -File scripts/devctl.ps1 restart` and verify with "
            "`powershell -ExecutionPolicy Bypass -File scripts/devctl.ps1 status`, then open `http://localhost:5173`."
        ),
    ),
    TopicRule(
        name="troubleshooting",
        keywords={"cant", "can't", "reached", "refused", "error", "down", "not", "working"},
        answer=(
            "If the site is unreachable, confirm both services are up. Check `devctl status`, then restart with `devctl restart`. "
            "Open `http://localhost:5173` instead of LAN IP first, and hard-refresh (`Ctrl+F5`)."
        ),
    ),
    TopicRule(
        name="ui_navigation",
        keywords={"home", "logo", "chat", "guide", "map", "button", "where"},
        answer=(
            "UI navigation: top-left logo returns to Home, command dock controls refresh/correction, metrics grid shows live values, "
            "and Astro Guide (bottom-right bot button) answers project/website questions."
        ),
    ),
]


def _tokens(text: str) -> set[str]:
    return set(TOKEN_RE.findall(text.lower()))


def _scope_check(tokens: set[str]) -> bool:
    return bool(tokens & SCOPE_TERMS)


def _rank_topics(tokens: set[str]) -> list[tuple[str, float, str]]:
    ranked: list[tuple[str, float, str]] = []
    for rule in TOPIC_RULES:
        overlap = len(tokens & rule.keywords)
        if overlap <= 0:
            continue
        score = overlap / max(1, len(rule.keywords))
        ranked.append((rule.name, score, rule.answer))
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked


def _live_status(report: DriftReport) -> str:
    top = sorted(report.by_metric, key=lambda x: abs(x.z_score), reverse=True)[:3]
    top_text = ", ".join(f"{x.metric} (z={x.z_score:.2f}, psi={x.psi_like:.2f})" for x in top)
    return (
        f"Current live status: alert `{report.alert_level}`, global drift score `{report.drift_score:.4f}`, "
        f"signals `{len(report.live_points)}`. Regime `{report.insight.regime}`, forecast-15m `{report.insight.forecast_15m_score:.4f}`. "
        f"Highest drift-pressure metrics: {top_text}."
    )


def answer_question(
    question: str,
    report: DriftReport | None = None,
    correction: AssistantCorrectionSummary | None = None,
) -> tuple[str, bool, list[str], float]:
    tokens = _tokens(question)
    in_scope = _scope_check(tokens)
    if not in_scope:
        return (
            "I am scoped to this website and astro-biochemical drift project only. Ask about metrics, drift, correction, data sources, UI workflow, API, or run/troubleshooting.",
            False,
            [],
            0.05,
        )

    ranked = _rank_topics(tokens)
    matched = [name for name, _, _ in ranked[:3]]
    confidence = max((score for _, score, _ in ranked), default=0.2)

    parts: list[str] = []
    if report and any(k in tokens for k in {"current", "live", "status", "now", "alert", "drift"}):
        parts.append(_live_status(report))

    if correction and any(k in tokens for k in {"correction", "accuracy", "before", "after", "improved"}):
        if correction.total_drift_percent is not None:
            parts.append(
                "Latest correction summary: "
                f"total drift `{correction.total_drift_percent:.2f}%`, "
                f"accuracy `{(correction.average_accuracy_before_percent or 0):.2f}% -> {(correction.average_accuracy_after_percent or 0):.2f}%`, "
                f"improved `{correction.improved_metrics or 0}/{correction.total_metrics or 0}` metrics."
            )

    for _, _, ans in ranked[:2]:
        if ans not in parts:
            parts.append(ans)

    if not parts:
        parts.append(
            "This assistant can explain project purpose, architecture, live metrics/sources, drift diagnostics, correction accuracy, and run/troubleshooting workflow."
        )

    answer = " ".join(parts)
    return answer, True, matched, min(0.98, max(0.25, confidence))
