import { currentUser } from "@/lib/auth";
import { run } from "@/lib/db";
import { redirect } from "@/lib/http";

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return redirect(req, "/login");
  const f = await req.formData();
  await run("UPDATE users SET pet_on=? WHERE id=?", f.get("pet") === "on" ? 1 : 0, u.id);
  return redirect(req, "/settings");
}
