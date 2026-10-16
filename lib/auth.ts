import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { get, run } from "./db";

export type User = { id: number; email: string; name: string; goals: string[]; onboarded: number; pet_on: number };

export const isAdminEmail = (e: string) =>
  !!process.env.ADMIN_EMAIL && e.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("sid")?.value;
  if (!token) return null;
  const r = await get<any>("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?", token);
  return r ? { ...r, goals: JSON.parse(r.goals) } : null;
}

export async function isAdmin() {
  const u = await currentUser();
  return !!u && isAdminEmail(u.email);
}

/** Creates/loads the user and starts a session. Rotates the anonymous analytics id on sign-in. */
export async function startSession(email: string, name: string) {
  email = email.trim().toLowerCase();
  let u = await get<{ id: number }>("SELECT id FROM users WHERE email=?", email);
  let created = false;
  if (!u) {
    const r = await run("INSERT INTO users(email,name) VALUES (?,?) ON CONFLICT(email) DO UPDATE SET email=excluded.email RETURNING id, (xmax = 0) AS fresh", email, name || email.split("@")[0]);
    u = { id: r[0].id };
    created = !!r[0].fresh;
  }
  const token = randomBytes(24).toString("hex");
  await run("INSERT INTO sessions(token,user_id) VALUES (?,?)", token, u.id);
  const jar = await cookies();
  jar.set("sid", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
  return { userId: u.id, created };
}

export async function endSession() {
  const jar = await cookies();
  const t = jar.get("sid")?.value;
  if (t) await run("DELETE FROM sessions WHERE token=?", t);
  jar.delete("sid");
  jar.delete("aid"); // anonymous analytics identity resets by design
}
