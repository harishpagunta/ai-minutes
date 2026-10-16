import { currentUser } from "@/lib/auth";
import { run } from "@/lib/db";
import { GOALS } from "@/lib/seed";
import { track } from "@/lib/telemetry";
import { redirect } from "@/lib/http";

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return redirect(req, "/login");
  const f = await req.formData();
  const skip = f.get("skip") === "1";
  const goals = f.getAll("goal").map(String).filter((g) => (GOALS as readonly string[]).includes(g)).slice(0, 2);
  await run("UPDATE users SET goals=?, onboarded=1 WHERE id=?", JSON.stringify(skip ? [] : goals), u.id);
  await track(skip ? "Onboarding Skipped" : u.onboarded ? "Goals Updated" : "Onboarding Completed", { goals: goals.length }, u.id);
  return redirect(req, f.get("next")?.toString() || "/dashboard");
}
