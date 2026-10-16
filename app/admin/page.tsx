import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { aiEnabled, type CourseDraftT } from "@/lib/ai";
import { FLAG_KEYS, flags } from "@/lib/flags";

const n = async (sql: string, ...p: any[]) => (await get<{ n: number }>(sql, ...p))!.n;

export default async function Admin({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  if (!(await isAdmin())) notFound();
  const { err } = await searchParams;
  const f = await flags();
  const runs = await all<any>("SELECT * FROM runs ORDER BY id DESC LIMIT 20");
  const roster = await all<any>(`SELECT u.email,u.name,u.created_at::date::text AS joined,(SELECT COUNT(DISTINCT day)::int FROM attempts a WHERE a.user_id=u.id) days,(SELECT COUNT(*)::int FROM attempts a WHERE a.user_id=u.id) att FROM users u ORDER BY u.id DESC LIMIT 50`);

  // North Star: people with at least one quick check in the last 7 days.
  const wpl = await n("SELECT COUNT(DISTINCT user_id)::int n FROM attempts WHERE created_at >= now() - interval '7 days'");
  const signups = await n("SELECT COUNT(*)::int n FROM users");
  const activated = await n(`SELECT COUNT(*)::int n FROM users u WHERE EXISTS (SELECT 1 FROM attempts a WHERE a.user_id=u.id AND a.created_at <= u.created_at + interval '1 day')`);
  const d7 = await n(`SELECT COUNT(*)::int n FROM users u WHERE u.created_at <= now() - interval '7 days' AND EXISTS (SELECT 1 FROM attempts a WHERE a.user_id=u.id AND a.day >= to_char(u.created_at + interval '7 days','YYYY-MM-DD'))`);
  const d7base = await n("SELECT COUNT(*)::int n FROM users WHERE created_at <= now() - interval '7 days'");
  const d30 = await n(`SELECT COUNT(*)::int n FROM users u WHERE u.created_at <= now() - interval '30 days' AND EXISTS (SELECT 1 FROM attempts a WHERE a.user_id=u.id AND a.day >= to_char(u.created_at + interval '30 days','YYYY-MM-DD'))`);
  const d30base = await n("SELECT COUNT(*)::int n FROM users WHERE created_at <= now() - interval '30 days'");
  const funnel = await all<{ name: string; anon: number; total: number }>("SELECT name, COUNT(DISTINCT anon_id)::int anon, COUNT(*)::int total FROM events GROUP BY name ORDER BY total DESC");
  const rate = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "n/a");

  return (
    <>
      <h1>Admin console</h1>
      {err && <p className="err" role="alert">{err}</p>}

      <h2>Insights</h2>
      <div className="stats">
        <div className="card stat"><b>{wpl}</b><span className="mut">Weekly practicing learners (North Star)</span></div>
        <div className="card stat"><b>{signups}</b><span className="mut">Signups</span></div>
        <div className="card stat"><b>{rate(activated, signups)}</b><span className="mut">Activation (24h) · target &gt;50%</span></div>
        <div className="card stat"><b>{rate(d7, d7base)}</b><span className="mut">Day-7 return · target &gt;20%</span></div>
        <div className="card stat"><b>{rate(d30, d30base)}</b><span className="mut">Day-30 return · target &gt;10%</span></div>
      </div>
      <div className="card"><table><thead><tr><th>Event</th><th>Anonymous users</th><th>Count</th></tr></thead>
        <tbody>{funnel.map((e) => <tr key={e.name}><td>{e.name}</td><td>{e.anon}</td><td>{e.total}</td></tr>)}</tbody></table></div>

      <h2>Feature flags</h2>
      <div className="card">{FLAG_KEYS.map((k) => (
        <form key={k} action="/api/admin/flag" method="post" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0" }}>
          <span>{k.replace("_", " ")} <span className={f[k] ? "ok" : "mut"}>{f[k] ? "on" : "off"}</span></span>
          <input type="hidden" name="key" value={k} /><input type="hidden" name="enabled" value={f[k] ? "0" : "1"} />
          <button className="btn ghost" style={{ padding: "4px 12px" }}>{f[k] ? "Turn off" : "Turn on"}</button>
        </form>))}
      </div>

      <h2>Content pipeline</h2>
      <form className="card" action="/api/admin/generate" method="post">
        <p className="mut">Paste the source material. The draft uses only facts from it, and nothing is visible to learners until you review and publish.{!aiEnabled() && " (Set ANTHROPIC_API_KEY to enable.)"}</p>
        <p><input type="text" name="topic" placeholder="Topic, e.g. Using AI for meeting notes" required /></p>
        <p><textarea name="source" rows={7} placeholder="Source text (200+ characters)" required /></p>
        <button className="btn" disabled={!aiEnabled()}>Generate draft</button>
      </form>
      {runs.map((r) => {
        const d: CourseDraftT | null = r.draft ? JSON.parse(r.draft) : null;
        return (
          <div className="card" key={r.id}>
            <b>{r.topic}</b> <span className={`tag ${r.status === "draft" ? "hi" : ""}`}>{r.status}</span>
            {r.error && <p className="err">{r.error}</p>}
            {d && r.status === "draft" && (<>
              <h3>{d.title}</h3><p className="mut">{d.description}</p>
              {d.lessons.map((l, i) => (
                <details key={i}><summary>{i + 1}. {l.title}</summary>
                  <p style={{ whiteSpace: "pre-line" }}>{l.body}</p>
                  <p><b>{l.question}</b></p>
                  <ol type="A">{l.options.map((o, j) => <li key={j} className={j === l.answer_idx ? "ok" : ""}>{o}</li>)}</ol>
                  <p className="mut">{l.explanation}</p>
                </details>))}
              <form action="/api/admin/publish" method="post" style={{ marginTop: 10 }}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn">Publish all</button>{" "}
                <button className="btn ghost" name="discard" value="1">Discard</button>
              </form></>)}
          </div>);
      })}

      <h2>Learners</h2>
      <div className="card"><table><thead><tr><th>Email</th><th>Joined</th><th>Active days</th><th>Attempts</th></tr></thead>
        <tbody>{roster.map((u) => <tr key={u.email}><td>{u.email}</td><td>{u.joined}</td><td>{u.days}</td><td>{u.att}</td></tr>)}</tbody></table></div>
    </>
  );
}
