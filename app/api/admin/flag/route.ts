import { isAdmin } from "@/lib/auth";
import { run } from "@/lib/db";
import { FLAG_KEYS } from "@/lib/flags";
import { redirect } from "@/lib/http";

export async function POST(req: Request) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const f = await req.formData();
  const key = String(f.get("key"));
  if (!(FLAG_KEYS as string[]).includes(key)) return new Response("Bad", { status: 400 });
  await run("INSERT INTO flags(key,enabled) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET enabled=excluded.enabled", key, f.get("enabled") === "1" ? 1 : 0);
  return redirect(req, "/admin");
}
