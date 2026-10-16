import { all, get } from "./db";

/** Everything here is plain arithmetic on the learner's own attempts. */
export async function learnerStats(userId: number) {
  const a = (await get<{ n: number; c: number }>("SELECT COUNT(*)::int n, COALESCE(SUM(correct),0)::int c FROM attempts WHERE user_id=?", userId))!;
  const first = (await get<{ n: number; c: number }>("SELECT COUNT(*)::int n, COALESCE(SUM(correct),0)::int c FROM attempts WHERE user_id=? AND attempt_no=1", userId))!;
  const lessonsDone = (await get<{ n: number }>("SELECT COUNT(DISTINCT lesson_id)::int n FROM attempts WHERE user_id=? AND correct=1", userId))!.n;
  const days = (await all<{ day: string }>("SELECT DISTINCT day FROM attempts WHERE user_id=? ORDER BY day", userId)).map((r) => r.day);
  const perCourse = (await all<{ title: string; n: number; c: number }>(
    `SELECT c.title, COUNT(*)::int n, SUM(a.correct)::int c FROM attempts a JOIN lessons l ON l.id=a.lesson_id JOIN courses c ON c.id=l.course_id
     WHERE a.user_id=? GROUP BY c.id, c.title`, userId))
    .map((r) => ({ title: r.title, attempts: r.n, accuracy: r.c / r.n }))
    .sort((x, y) => x.accuracy - y.accuracy); // weakest first
  return {
    attempts: a.n, lessonsDone, sessions: days.length, days: new Set(days),
    accuracy: a.n ? a.c / a.n : null,
    firstTry: first.n ? first.c / first.n : null,
    weakest: perCourse,
  };
}
export type LearnerStats = Awaited<ReturnType<typeof learnerStats>>;

export async function goalProgress(userId: number, goals: string[]) {
  const cs = await all<{ id: number; goals: string }>("SELECT id,goals FROM courses");
  const out = [];
  for (const g of goals) {
    let total = 0, done = 0;
    for (const c of cs.filter((c) => (JSON.parse(c.goals) as string[]).includes(g))) {
      total += (await get<{ n: number }>("SELECT COUNT(*)::int n FROM lessons WHERE course_id=?", c.id))!.n;
      done += (await get<{ n: number }>("SELECT COUNT(DISTINCT l.id)::int n FROM attempts a JOIN lessons l ON l.id=a.lesson_id WHERE a.user_id=? AND a.correct=1 AND l.course_id=?", userId, c.id))!.n;
    }
    out.push({ goal: g, total, done });
  }
  return out;
}

export const BADGES = [
  { id: "first", label: "First check", test: (s: LearnerStats) => s.attempts >= 1 },
  { id: "three", label: "3 active days", test: (s: LearnerStats) => s.sessions >= 3 },
  { id: "five", label: "5 lessons done", test: (s: LearnerStats) => s.lessonsDone >= 5 },
  { id: "all", label: "Full catalog", test: (s: LearnerStats) => s.lessonsDone >= 9 },
];

export const today = () => new Date().toISOString().slice(0, 10);

/** Last 12 weeks, Monday-first columns. */
export function calendar(days: Set<string>) {
  const end = new Date(); end.setUTCHours(0, 0, 0, 0);
  const dow = (end.getUTCDay() + 6) % 7;
  const start = new Date(end); start.setUTCDate(end.getUTCDate() - dow - 11 * 7);
  const weeks: { day: string; on: boolean; future: boolean }[][] = [];
  for (let w = 0; w < 12; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const t = new Date(start); t.setUTCDate(start.getUTCDate() + w * 7 + d);
      const s = t.toISOString().slice(0, 10);
      col.push({ day: s, on: days.has(s), future: t > end });
    }
    weeks.push(col);
  }
  return weeks;
}
