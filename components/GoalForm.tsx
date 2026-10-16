"use client";
import { useState } from "react";
import { GOALS } from "@/lib/seed";

export default function GoalForm({ initial, next, allowSkip }: { initial: string[]; next: string; allowSkip: boolean }) {
  const [sel, setSel] = useState<string[]>(initial);
  const toggle = (g: string) => setSel((s) => (s.includes(g) ? s.filter((x) => x !== g) : s.length < 2 ? [...s, g] : s));
  return (
    <form action="/api/goals" method="post">
      <input type="hidden" name="next" value={next} />
      {GOALS.map((g) => (
        <label key={g} className="chk">
          <input type="checkbox" name="goal" value={g} checked={sel.includes(g)} onChange={() => toggle(g)} /> {g}
        </label>
      ))}
      <p className="mut">Pick up to two.</p>
      <button className="btn">Save</button>{" "}
      {allowSkip && <button className="btn ghost" name="skip" value="1" formNoValidate>Skip for now</button>}
    </form>
  );
}
