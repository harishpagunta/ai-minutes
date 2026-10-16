import { currentUser } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { json } from "@/lib/http";
import { today } from "@/lib/stats";
import { track } from "@/lib/telemetry";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return json({ error: "Sign in to answer" }, 401);
  const { lessonId: rawId, choice } = await req.json();
  const lessonId = Number(rawId);
  const l = await get<{ answer_idx: number; explanation: string; options: string; course_id: number }>("SELECT * FROM lessons WHERE id=?", Number.isInteger(lessonId) ? lessonId : -1);
  if (!l || !Number.isInteger(choice) || choice < 0 || choice >= JSON.parse(l.options).length) return json({ error: "Bad request" }, 400);

  const correct = choice === l.answer_idx;
  const prior = (await get<{ n: number }>("SELECT COUNT(*)::int n FROM attempts WHERE user_id=? AND lesson_id=?", user.id, lessonId))!.n;
  const alreadyDone = !!(await get("SELECT 1 x FROM attempts WHERE user_id=? AND lesson_id=? AND correct=1", user.id, lessonId));
  const everBefore = (await get<{ n: number }>("SELECT COUNT(*)::int n FROM attempts WHERE user_id=?", user.id))!.n;
  await run("INSERT INTO attempts(user_id,lesson_id,attempt_no,correct,day) VALUES (?,?,?,?,?)", user.id, lessonId, prior + 1, correct ? 1 : 0, today());

  if (everBefore === 0) await track("First Quick Check Answered", { lesson: lessonId }, user.id);
  await track("Quick Check Answered", { lesson: lessonId, correct, attempt: prior + 1 }, user.id);
  if (correct && !alreadyDone) await track("Lesson Completed", { lesson: lessonId }, user.id);

  // Wrong answers: no penalty, the learner sees the correct idea and can retry.
  return json({ correct, explanation: l.explanation, firstTry: prior === 0 });
}
