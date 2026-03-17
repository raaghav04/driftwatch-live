import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const api = axios.create({
  baseURL,
  timeout: 30000
});

export async function fetchDrift(lat, lon) {
  const { data } = await api.get("/drift/report", { params: { lat, lon } });
  return data;
}

export async function fetchSnapshot(lat, lon) {
  const { data } = await api.get("/live/snapshot", { params: { lat, lon } });
  return data;
}

export async function detectAndCorrectDrift(lat, lon) {
  const { data } = await api.post("/drift/detect-correct", null, { params: { lat, lon } });
  return data;
}

export async function askAssistant(question, lat, lon, correctionSummary = null) {
  const { data } = await api.post("/assistant/query", {
    question,
    lat,
    lon,
    correction_summary: correctionSummary
  });
  return data;
}
