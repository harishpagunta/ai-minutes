import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { redirect } from "@/lib/http";
import { track } from "@/lib/telemetry";

export async function GET(req: Request) {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return redirect(req, "/login");
  await track("Sign In Started");
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  const base = process.env.APP_URL || new URL(req.url).origin;
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: id, redirect_uri: `${base}/api/auth/google/callback`, response_type: "code",
    scope: "openid email profile", state, prompt: "select_account",
  }).toString();
  return Response.redirect(u.toString(), 303);
}
