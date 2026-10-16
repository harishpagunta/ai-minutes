import { cookies } from "next/headers";
import { startSession } from "@/lib/auth";
import { redirect } from "@/lib/http";
import { track } from "@/lib/telemetry";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const state = jar.get("oauth_state")?.value;
  jar.delete("oauth_state");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== url.searchParams.get("state")) return redirect(req, "/login?e=1");
  const base = process.env.APP_URL || url.origin;
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${base}/api/auth/google/callback`, grant_type: "authorization_code",
    }),
  }).then((r) => r.json());
  if (!tok.access_token) return redirect(req, "/login?e=1");
  const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tok.access_token}` } }).then((r) => r.json());
  if (!info.email || info.email_verified === false) return redirect(req, "/login?e=1");
  const { userId, created } = await startSession(info.email, info.name || "");
  if (created) await track("Signed Up", {}, userId);
  return redirect(req, "/dashboard");
}
