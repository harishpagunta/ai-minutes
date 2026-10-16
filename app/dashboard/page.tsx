import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { continueLesson } from "@/lib/content";
import { BADGES, calendar, learnerStats } from "@/lib/stats";
import { flags } from "@/lib/flags";
import Track from "@/components/Track";

export default async function Dashboard() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (!u.onboarded && (await flags()).goal_matching) redirect("/onboarding");
  const s = await learnerStats(u.id);
  const next = await continueLesson(u);
  const weeks = calendar(s.days);
  return (
    <>
      <h1>Hi {u.name.split(" ")[0]}</h1>
      {next && (
        <div className="card">
          <span className="mut">{next.started ? "Pick up where you left off" : "Start here"} · {next.course}</span>
          <h3 style={{ margin: "4px 0 10px" }}>{next.title}</h3>
          <Link className="btn" href={`/lesson/${next.id}`}>{next.started ? "Continue" : "Start"}</Link>
        </div>
      )}
      <div className="stats">
        <div className="card stat"><b>{s.lessonsDone}</b><span className="mut">Lessons completed</span></div>
        <div className="card stat"><b>{s.attempts}</b><span className="mut">Practice sessions</span></div>
        <div className="card stat"><b>{s.sessions}</b><span className="mut">Active days</span></div>
      </div>
      <h2>Your activity</h2>
      <div className="card">
        <div className="cal" role="img" aria-label={`${s.sessions} active days in the last 12 weeks`}>
          {weeks.map((w, i) => <div key={i}>{w.map((d) => <b key={d.day} className={`${d.on ? "on" : ""} ${d.future ? "f" : ""}`} title={d.day} />)}</div>)}
        </div>
        <small className="mut">Each lit square is a day you really practised.</small>
      </div>
      <h2>Badges</h2>
      <div>{BADGES.map((b) => <span key={b.id} className={`tag ${b.test(s) ? "hi" : ""}`}>{b.test(s) ? "★ " : ""}{b.label}</span>)}</div>
      <Track name="Practice Viewed" />
    </>
  );
}
