import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { flags } from "@/lib/flags";
import { goalProgress, learnerStats } from "@/lib/stats";
import Track from "@/components/Track";

const pct = (x: number | null) => (x === null ? "–" : `${Math.round(x * 100)}%`);

export default async function Analytics() {
  if (!(await flags()).analytics) notFound();
  const u = await currentUser();
  if (!u) redirect("/login");
  const s = await learnerStats(u.id);
  const gp = await goalProgress(u.id, u.goals);
  return (
    <>
      <h1>Your analytics</h1>
      <p className="mut">Plain arithmetic on your own attempts. Nothing estimated, nothing graded by a model.</p>
      <div className="stats">
        <div className="card stat"><b>{pct(s.accuracy)}</b><span className="mut">Overall accuracy</span></div>
        <div className="card stat"><b>{pct(s.firstTry)}</b><span className="mut">First-try accuracy</span></div>
      </div>
      <h2>Goal progress</h2>
      {gp.length === 0 && <p className="mut">No goals set. You can pick them in Settings.</p>}
      {gp.map((g) => (
        <div key={g.goal} className="card">
          <b>{g.goal}</b> <span className="mut">{g.done} of {g.total} lessons</span>
          <div className="bar"><i style={{ width: `${(g.done / Math.max(g.total, 1)) * 100}%` }} /></div>
        </div>
      ))}
      <h2>Weakest areas first</h2>
      {s.weakest.length === 0 && <p className="mut">Answer a few quick checks to see this.</p>}
      {s.weakest.map((w) => <div key={w.title} className="card">{w.title}: <b>{pct(w.accuracy)}</b> <span className="mut">over {w.attempts} attempts</span></div>)}
      <Track name="Analytics Viewed" />
    </>
  );
}
