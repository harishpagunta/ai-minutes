import { isAdmin } from "@/lib/auth";
import { run } from "@/lib/db";
import { aiEnabled, draftCourse } from "@/lib/ai";
import { redirect } from "@/lib/http";

export async function POST(req: Request) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const f = await req.formData();
  const topic = String(f.get("topic") || "").trim();
  const source = String(f.get("source") || "").trim();
  if (!topic || source.length < 200) return redirect(req, "/admin?err=Provide+a+topic+and+at+least+200+characters+of+source+text");
  if (!aiEnabled()) return redirect(req, "/admin?err=Set+ANTHROPIC_API_KEY+to+run+the+pipeline");
  const id = (await run("INSERT INTO runs(topic,source,status) VALUES (?,?, 'running') RETURNING id", topic, source))[0].id as number;
  try {
    const draft = await draftCourse(topic, source);
    await run("UPDATE runs SET status='draft', draft=? WHERE id=?", JSON.stringify(draft), id);
  } catch (e) {
    await run("UPDATE runs SET status='failed', error=? WHERE id=?", e instanceof Error ? e.message : "failed", id);
  }
  return redirect(req, "/admin");
}
