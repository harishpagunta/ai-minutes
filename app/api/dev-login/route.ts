import { startSession } from "@/lib/auth";
import { track } from "@/lib/telemetry";
import { redirect } from "@/lib/http";

// Dev-only stand-in for Google sign-in when GOOGLE_CLIENT_ID is not configured.
export async function POST(req: Request) {
  if (process.env.GOOGLE_CLIENT_ID || !(process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_LOGIN === "1")) return new Response("Not found", { status: 404 });
  const f = await req.formData();
  await track("Sign In Started");
  const email = String(f.get("email") || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return redirect(req, "/login?e=1");
  const { userId, created } = await startSession(email, String(f.get("name") || ""));
  if (created) await track("Signed Up", {}, userId);
  return redirect(req, f.get("next")?.toString().startsWith("/") ? String(f.get("next")) : "/dashboard");
}
