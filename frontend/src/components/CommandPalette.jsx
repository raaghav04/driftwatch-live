import { useEffect, useMemo, useState } from "react";

export default function CommandPalette({ open, onClose, commands }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(term));
  }, [commands, q]);

  if (!open) return null;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command..."
        />
        <div className="palette-list">
          {filtered.map((cmd) => (
            <button key={cmd.label} onClick={() => { cmd.run(); onClose(); }}>
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

