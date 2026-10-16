"use client";
import { useState } from "react";
import Link from "next/link";

export default function QuickCheck({ lessonId, question, options, next }: { lessonId: number; question: string; options: string[]; next: { href: string; label: string } | null }) {
  const [sel, setSel] = useState<number | null>(null);
  const [res, setRes] = useState<{ correct: boolean; explanation: string; firstTry: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(i: number) {
    if (busy || res?.correct) return;
    setSel(i); setBusy(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, choice: i }) });
      if (!r.ok) throw new Error();
      setRes(await r.json());
    } catch { setErr("Could not check that. Try again."); }
    setBusy(false);
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Quick check</h2>
      <p>{question}</p>
      {options.map((o, i) => (
        <button key={i} className={`opt ${sel === i ? (res ? (res.correct ? "right" : "wrong") : "sel") : ""}`} onClick={() => submit(i)} disabled={busy}>{o}</button>
      ))}
      {err && <p className="err" role="alert">{err}</p>}
      {res && (
        <div role="status">
          <p className={res.correct ? "ok" : "bad"}><b>{res.correct ? (res.firstTry ? "Correct, first try." : "Correct.") : "Not quite. No penalty, try again."}</b></p>
          <p>{res.explanation}</p>
          {res.correct && (next ? <Link className="btn" href={next.href}>{next.label}</Link> : <Link className="btn" href="/dashboard">Back to dashboard</Link>)}
        </div>
      )}
    </div>
  );
}
