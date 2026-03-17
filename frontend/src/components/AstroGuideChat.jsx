import { useState } from "react";

import { askAssistant } from "../services/api";

const QUICK_QUESTIONS = [
  "What does this project do?",
  "What is the current drift status?",
  "Which live metrics and sources are active?",
  "How do I run Detect & Correct Drift?",
  "How do I start the website if it is not reachable?"
];

export default function AstroGuideChat({ correctionReport, lat, lon, onSound }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Astra Guide online. I answer only website/project questions about your astro-biochemical drift system."
    }
  ]);

  const ask = async (text) => {
    const q = text.trim();
    if (!q) return;
    onSound?.("send");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    try {
      const correctionSummary = correctionReport
        ? {
            total_drift_percent: correctionReport.total_drift_percent,
            average_accuracy_before_percent: correctionReport.average_accuracy_before_percent,
            average_accuracy_after_percent: correctionReport.average_accuracy_after_percent,
            improved_metrics: correctionReport.improved_metrics,
            total_metrics: correctionReport.total_metrics
          }
        : null;
      const res = await askAssistant(q, lat, lon, correctionSummary);
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Assistant service is temporarily unavailable. Ensure backend is running and try again."
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <section className={`astro-guide-chat ${open ? "open" : ""}`}>
      <button
        type="button"
        className="astro-chat-toggle"
        onClick={() => {
          setOpen((x) => !x);
          onSound?.(open ? "toggle" : "warp");
        }}
        aria-label={open ? "Close Astra Guide" : "Open Astra Guide"}
        title={open ? "Close Astra Guide" : "Open Astra Guide"}
      >
        <span className="astro-bot">
          <span className="bot-orbit" />
          <span className="bot-antenna" />
          <span className="bot-head">
            <span className="bot-visor">
              <span className="bot-eye" />
              <span className="bot-eye" />
            </span>
            <span className="bot-mouth" />
          </span>
        </span>
      </button>

      {open && (
        <div className="astro-chat-panel">
          <header>
            <strong>Astra Guide</strong>
            <span>Project-only assistant</span>
          </header>
          <div className="astro-chat-messages">
            {messages.map((m, i) => (
              <article key={`${m.role}-${i}`} className={`msg ${m.role}`}>
                {m.text}
              </article>
            ))}
            {typing && <article className="msg assistant">Analyzing your project context...</article>}
          </div>
          <div className="astro-chat-quick">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} type="button" onClick={() => ask(q)}>{q}</button>
            ))}
          </div>
          <form
            className="astro-chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about website, metrics, drift, correction..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </section>
  );
}
