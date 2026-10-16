import { isAdmin } from "@/lib/auth";
import { get, run, tx } from "@/lib/db";
import { CourseDraft } from "@/lib/ai";
import { redirect } from "@/lib/http";

export async function POST(req: Request) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const f = await req.formData();
  const id = Number(f.get("id"));
  const r = Number.isInteger(id) ? await get<{ draft: string; status: string }>("SELECT draft,status FROM runs WHERE id=?", id) : undefined;
  if (!r || r.status !== "draft") return redirect(req, "/admin?err=Nothing+to+publish");
  if (f.get("discard") === "1") { await run("UPDATE runs SET status='discarded' WHERE id=?", id); return redirect(req, "/admin"); }
  try {
    const d = CourseDraft.parse(JSON.parse(r.draft));
    // All-or-nothing: the course and every lesson land in one transaction.
    await tx(async (q) => {
      const pos = (await q("SELECT COUNT(*)::int n FROM courses"))[0].n as number;
      const cid = (await q("INSERT INTO courses(title,description,goals,position) VALUES (?,?,?,?) RETURNING id", [d.title, d.description, JSON.stringify(d.goals), pos]))[0].id;
      for (const [i, l] of d.lessons.entries())
        await q("INSERT INTO lessons(course_id,position,title,body,question,options,answer_idx,explanation) VALUES (?,?,?,?,?,?,?,?)",
          [cid, i, l.title, l.body, l.question, JSON.stringify(l.options), l.answer_idx, l.explanation]);
      await q("UPDATE runs SET status='published' WHERE id=?", [id]);
    });
  } catch { return redirect(req, "/admin?err=Publish+failed.+Nothing+was+published"); }
  return redirect(req, "/admin");
}
