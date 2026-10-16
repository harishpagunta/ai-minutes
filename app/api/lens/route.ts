import { currentUser } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { flags } from "@/lib/flags";
import { aiEnabled, lens, LENSES, type Lens } from "@/lib/ai";
import { json } from "@/lib/http";

export async function POST(req: Request) {
  if (!(await flags()).lenses) return json({ error: "Not found" }, 404);
  if (!(await currentUser())) return json({ error: "Sign in" }, 401);
  const { lessonId: rawId, lens: kind } = await req.json();
  const lessonId = Number(rawId);
  if (!Number.isInteger(lessonId)) return json({ error: "Bad lesson" }, 400);
  if (!LENSES.includes(kind)) return json({ error: "Bad lens" }, 400);
  const cached = await get<{ text: string }>("SELECT text FROM lens_cache WHERE lesson_id=? AND lens=?", lessonId, kind);
  if (cached) return json({ text: cached.text });
  if (!aiEnabled()) return json({ error: "Lenses need ANTHROPIC_API_KEY on the server." }, 503);
  const l = await get<{ title: string; body: string }>("SELECT title,body FROM lessons WHERE id=?", lessonId);
  if (!l) return json({ error: "Not found" }, 404);
  try {
    const text = await lens(l.title, l.body, kind as Lens);
    await run("INSERT INTO lens_cache(lesson_id,lens,text) VALUES (?,?,?) ON CONFLICT(lesson_id,lens) DO UPDATE SET text=excluded.text", lessonId, kind, text);
    return json({ text });
  } catch (e) {
    return json({ error: "Could not generate this view right now." }, 502);
  }
}
