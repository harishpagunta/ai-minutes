import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { currentUser, isAdminEmail } from "@/lib/auth";
import { flags } from "@/lib/flags";
import { all } from "@/lib/db";
import Pet from "@/components/Pet";

export const metadata: Metadata = { title: "AI Minutes: learn AI a few minutes a day", description: "Five minutes a day. Read a short lesson, answer one quick check, build real AI capability." };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function Root({ children }: { children: React.ReactNode }) {
  const u = await currentUser();
  const f = await flags();
  let mood: "idle" | "happy" = "idle";
  if (u && f.pet && u.pet_on) {
    const t = new Date().toISOString().slice(0, 10);
    mood = (await all("SELECT 1 FROM attempts WHERE user_id=? AND day=? LIMIT 1", u.id, t)).length ? "happy" : "idle";
  }
  return (
    <html lang="en">
      <body>
        <nav><div className="wrap">
          <Link className="brand" href={u ? "/dashboard" : "/"}>AI Minutes</Link>
          {u ? <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/courses">Courses</Link>
            {f.analytics && <Link href="/analytics">Analytics</Link>}
            <Link href="/settings">Settings</Link>
            {isAdminEmail(u.email) && <Link href="/admin">Admin</Link>}
            <form action="/api/signout" method="post"><button className="btn ghost" style={{ padding: "6px 12px" }}>Sign out</button></form>
          </> : <Link className="btn" href="/login">Sign in</Link>}
        </div></nav>
        <main><div className="wrap">{children}</div></main>
        {u && f.pet && u.pet_on && <Pet mood={mood} />}
      </body>
    </html>
  );
}
