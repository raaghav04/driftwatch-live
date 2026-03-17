from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from statistics import mean
import csv
import io
import logging
import re

from app.schemas.drift import MetricPoint
from app.services.http_client import SharedHTTPClient

logger = logging.getLogger(__name__)


@dataclass
class GeoPoint:
    lat: float
    lon: float


class LiveDataProviders:
    def __init__(self, client: SharedHTTPClient):
        self.client = client

    @staticmethod
    def _to_float(value: object, default: float = float("nan")) -> float:
        if value is None:
            return default
        if isinstance(value, (int, float)):
            return float(value)
        s = str(value).strip()
        if not s:
            return default
        match = re.search(r"[-+]?\d*\.?\d+", s)
        if not match:
            return default
        try:
            return float(match.group(0))
        except ValueError:
            return default

    async def fetch_space_physics(self) -> list[MetricPoint]:
        points: list[MetricPoint] = []
        now = datetime.now(UTC)

        try:
            kp_data = await self.client.get_json("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json")
            kp_value = self._to_float(kp_data[-1].get("kp"), default=0.0)
            points.append(
                MetricPoint(
                    metric="geomagnetic_kp_index",
                    value=kp_value,
                    unit="index",
                    source="NOAA SWPC planetary_k_index_1m",
                    observed_at=now,
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Kp index unavailable: %s", exc)

        try:
            plasma = await self.client.get_json("https://services.swpc.noaa.gov/products/solar-wind/plasma-2-hour.json")
            # NOAA tabular payload: row 0 headers, last row latest values.
            last = plasma[-1]
            wind_speed = self._to_float(last[2] if len(last) > 2 else None)
            points.append(
                MetricPoint(
                    metric="solar_wind_speed",
                    value=wind_speed,
                    unit="km/s",
                    source="NOAA SWPC plasma-2-hour",
                    observed_at=now,
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Solar wind unavailable: %s", exc)

        try:
            xray = await self.client.get_json("https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json")
            xray_flux = self._to_float(xray[-1].get("flux"), default=0.0)
            points.append(
                MetricPoint(
                    metric="solar_radiation_intensity",
                    value=xray_flux,
                    unit="W/m^2",
                    source="NOAA SWPC GOES X-ray flux",
                    observed_at=now,
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Solar radiation unavailable: %s", exc)

        try:
            proton = await self.client.get_json(
                "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json"
            )
            p10 = [
                self._to_float(x.get("flux"))
                for x in proton
                if x.get("energy") == ">=10 MeV" and x.get("flux") is not None
            ]
            p10 = [x for x in p10 if x == x]
            if p10:
                points.append(
                    MetricPoint(
                        metric="cosmic_ray_flux_proxy",
                        value=p10[-1],
                        unit="pfu",
                        source="NOAA SWPC GOES integral protons >=10MeV",
                        observed_at=now,
                    )
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Cosmic ray proxy unavailable: %s", exc)

        return points

    async def fetch_environment(self, location: GeoPoint) -> list[MetricPoint]:
        points: list[MetricPoint] = []
        now = datetime.now(UTC)

        try:
            air = await self.client.get_json(
                "https://air-quality-api.open-meteo.com/v1/air-quality",
                params={
                    "latitude": location.lat,
                    "longitude": location.lon,
                    "current": "ozone,carbon_monoxide,nitrogen_dioxide",
                },
            )
            points.append(
                MetricPoint(
                    metric="ozone_concentration",
                    value=self._to_float(air.get("current", {}).get("ozone"), default=0.0),
                    unit="ug/m3",
                    source="Open-Meteo Air Quality API",
                    observed_at=now,
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Air quality unavailable: %s", exc)

        try:
            weather = await self.client.get_json(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": location.lat,
                    "longitude": location.lon,
                    "current": "temperature_2m,relative_humidity_2m,wind_speed_10m",
                },
            )
            points.append(
                MetricPoint(
                    metric="temperature_variation",
                    value=self._to_float(weather.get("current", {}).get("temperature_2m"), default=0.0),
                    unit="degC",
                    source="Open-Meteo Forecast API",
                    observed_at=now,
                )
            )
            points.append(
                MetricPoint(
                    metric="humidity",
                    value=self._to_float(weather.get("current", {}).get("relative_humidity_2m"), default=0.0),
                    unit="%",
                    source="Open-Meteo Forecast API",
                    observed_at=now,
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Weather unavailable: %s", exc)

        # NOAA Mauna Loa monthly CO2 trend CSV (latest available monthly value).
        try:
            co2_csv = await self.client.get_text("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv")
            reader = csv.reader(io.StringIO(co2_csv))
            co2_rows = [row for row in reader if row and not row[0].startswith("#")]
            last_valid = next((r for r in reversed(co2_rows) if len(r) > 4 and r[4] and float(r[4]) > 0), None)
            if last_valid:
                points.append(
                    MetricPoint(
                        metric="atmospheric_co2",
                        value=float(last_valid[4]),
                        unit="ppm",
                        source="NOAA GML Mauna Loa CO2 trend",
                        observed_at=now,
                    )
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("CO2 trend unavailable: %s", exc)

        return points

    async def fetch_biology(self, location: GeoPoint) -> list[MetricPoint]:
        points: list[MetricPoint] = []
        now = datetime.now(UTC)
        year = now.year

        # Plant activity proxy: latest MODIS NDVI near target location.
        try:
            modis = await self.client.get_json(
                "https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset",
                params={
                    "latitude": location.lat,
                    "longitude": location.lon,
                    "band": "250m_16_days_NDVI",
                    "startDate": f"A{year - 1}001",
                    "endDate": f"A{year - 1}365",
                },
            )
            data = modis.get("subset", [])
            if data:
                ndvi_values = [float(x["data"]) / 10000 for x in data if x.get("data") not in (None, "")]
                if ndvi_values:
                    points.append(
                        MetricPoint(
                            metric="plant_growth_index",
                            value=ndvi_values[-1],
                            unit="ndvi",
                            source="NASA/ORNL MOD13Q1 NDVI subset API",
                            observed_at=now,
                        )
                    )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Plant growth proxy unavailable: %s", exc)

        # Animal movement proxy: recent occurrence velocity proxy from GBIF counts in the last 7 days.
        week_ago = (now - timedelta(days=7)).date().isoformat()
        today = now.date().isoformat()
        try:
            gbif = await self.client.get_json(
                "https://api.gbif.org/v1/occurrence/search",
                params={
                    "hasCoordinate": "true",
                    "decimalLatitude": f"{location.lat - 1},{location.lat + 1}",
                    "decimalLongitude": f"{location.lon - 1},{location.lon + 1}",
                    "lastInterpreted": f"{week_ago},{today}",
                    "basisOfRecord": "HUMAN_OBSERVATION",
                    "limit": 0,
                },
            )
            count = self._to_float(gbif.get("count"), default=0.0)
            points.append(
                MetricPoint(
                    metric="animal_movement_pattern_proxy",
                    value=count,
                    unit="observations/week",
                    source="GBIF occurrence search API",
                    observed_at=now,
                )
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Animal movement proxy unavailable: %s", exc)

        # Human circadian proxy: grid load day-night ratio from open ENTSO-E style datasets is regional;
        # use weather-linked circadian stress index as a live physiological risk proxy.
        try:
            weather = await self.client.get_json(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": location.lat,
                    "longitude": location.lon,
                    "hourly": "temperature_2m",
                    "forecast_days": 1,
                },
            )
            hourly = weather.get("hourly", {}).get("temperature_2m", [])
            if hourly:
                day = hourly[8:20] if len(hourly) >= 20 else hourly
                night = hourly[0:6] + hourly[21:24] if len(hourly) >= 24 else hourly[:6]
                circadian_proxy = mean(day) - mean(night) if night else 0.0
                points.append(
                    MetricPoint(
                        metric="human_circadian_activity_proxy",
                        value=float(circadian_proxy),
                        unit="degC_delta",
                        source="Open-Meteo hourly temperature-derived proxy",
                        observed_at=now,
                    )
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Circadian proxy unavailable: %s", exc)

        # Microbial proxy: chlorophyll tendency in nearby waters from NOAA CoastWatch ERDDAP gridded feed.
        # Endpoint can be swapped to your local region-specific variable.
        try:
            chl = await self.client.get_json(
                "https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdMH1chlamday.json",
                params={
                    "chla[(last)][(0.0):1:(0.0)][(0.0):1:(0.0)]": "",
                },
            )
            # Parsing ERDDAP json payload can vary by dataset shape; keep robust fallback.
            table = chl.get("table", {}).get("rows", [])
            if table and table[-1]:
                points.append(
                    MetricPoint(
                        metric="microbial_activity_proxy",
                        value=float(table[-1][-1]),
                        unit="mg/m3",
                        source="NOAA ERDDAP chlorophyll-a",
                        observed_at=now,
                    )
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Microbial proxy unavailable: %s", exc)

        return points
