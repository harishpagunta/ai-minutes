"use client";
import { useState } from "react";

const LABELS = { analogy: "Analogy", example: "Real-world example", "deep-dive": "Deep dive" } as const;

export default function Lenses({ lessonId }: { lessonId: number }) {
  const [active, setActive] = useState<keyof typeof LABELS | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function open(k: keyof typeof LABELS) {
    setActive(k); setText(""); setErr(""); setBusy(true);
    const r = await fetch("/api/lens", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, lens: k }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok) setText(d.text); else setErr(d.error || "Unavailable right now.");
    setBusy(false);
  }
  return (
    <div style={{ margin: "12px 0" }}>
      <span className="mut">Explain it differently: </span>
      {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => (
        <button key={k} className={`btn ghost`} style={{ padding: "4px 10px", marginRight: 6, fontSize: 13, borderColor: active === k ? "var(--acc)" : undefined }} onClick={() => open(k)}>{LABELS[k]}</button>
      ))}
      {busy && <p className="mut">Writing…</p>}
      {err && <p className="err">{err}</p>}
      {text && <div className="card prose"><p>{text}</p></div>}
    </div>
  );
}
