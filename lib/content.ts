import { all, get } from "./db";
import type { User } from "./auth";
import { flags } from "./flags";

export type Course = { id: number; title: string; description: string; goals: string[]; position: number; total: number; done: number; matches: boolean };
export type Lesson = { id: number; course_id: number; position: number; title: string; body: string; question: string; options: string[] };

export async function courses(user: User | null): Promise<Course[]> {
  const rows = await all<any>(`SELECT c.*, (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id=c.id) total FROM courses c ORDER BY position`);
  const done = new Map<number, number>();
  if (user)
    for (const r of await all<{ course_id: number; n: number }>(
      `SELECT l.course_id, COUNT(DISTINCT l.id)::int n FROM attempts a JOIN lessons l ON l.id=a.lesson_id WHERE a.user_id=? AND a.correct=1 GROUP BY l.course_id`, user.id))
      done.set(r.course_id, r.n);
  const useGoals = (await flags()).goal_matching && !!user && user.goals.length > 0;
  const list: Course[] = rows.map((r) => {
    const g: string[] = JSON.parse(r.goals);
    return { ...r, goals: g, done: done.get(r.id) ?? 0, matches: useGoals && g.some((x) => user!.goals.includes(x)) };
  });
  // Simple set matching: matching courses first, otherwise normal catalog order.
  return useGoals ? [...list].sort((a, b) => Number(b.matches) - Number(a.matches) || a.position - b.position) : list;
}

export const lessonsOf = (courseId: number) =>
  all<{ id: number; title: string; position: number }>("SELECT id,title,position FROM lessons WHERE course_id=? ORDER BY position", courseId);

export async function lesson(id: number): Promise<(Lesson & { course_title: string }) | null> {
  if (!Number.isInteger(id)) return null;
  const r = await get<any>("SELECT l.*, c.title course_title FROM lessons l JOIN courses c ON c.id=l.course_id WHERE l.id=?", id);
  if (!r) return null;
  const { answer_idx, explanation, ...safe } = r; // the answer key never leaves the server
  return { ...safe, options: JSON.parse(r.options) };
}

export async function completedIds(userId: number): Promise<Set<number>> {
  return new Set((await all<{ lesson_id: number }>("SELECT DISTINCT lesson_id FROM attempts WHERE user_id=? AND correct=1", userId)).map((r) => r.lesson_id));
}

/** Never empty: next unfinished lesson (goal-matching course first), else the first catalog lesson. */
export async function continueLesson(user: User) {
  const done = await completedIds(user.id);
  const cs = await courses(user);
  for (const c of cs)
    for (const l of await lessonsOf(c.id)) if (!done.has(l.id)) return { ...l, course: c.title, started: c.done > 0 };
  const c = cs[0];
  const l = c && (await lessonsOf(c.id))[0];
  return l ? { ...l, course: c.title, started: true } : null;
}
