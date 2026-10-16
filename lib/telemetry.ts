import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import Mixpanel from "mixpanel";
import { run } from "./db";

/** The 14 events. Anonymous id only: no names, no emails. */
export const EVENTS = [
  "Sign In Started", "Signed Up", "Lesson Opened", "Quick Check Answered", "First Quick Check Answered", "Lesson Completed",
  "Courses Viewed", "Course Opened", "Practice Viewed", "Analytics Viewed", "Goals Updated",
  "Onboarding Completed", "Onboarding Skipped", "Tour Finished",
] as const;
export type EventName = (typeof EVENTS)[number];

export async function anonId(create = true): Promise<string | null> {
  const jar = await cookies();
  let id = jar.get("aid")?.value;
  if (!id && create) {
    id = randomBytes(12).toString("hex");
    try { jar.set("aid", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 }); } catch { /* read-only context (server component) */ }
  }
  return id ?? null;
}

let mp: Mixpanel.Mixpanel | null | undefined;
function mixpanel() {
  if (mp === undefined) mp = process.env.MIXPANEL_TOKEN ? Mixpanel.init(process.env.MIXPANEL_TOKEN, { protocol: "https" }) : null;
  return mp;
}

/** Forward to Mixpanel with the anonymous id only (no names, no emails). Never throws; bounded wait so serverless doesn't drop it. */
function forward(name: string, id: string, props: Record<string, string | number | boolean>) {
  const m = mixpanel();
  if (!m) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 1500);
    try {
      m.track(name, { distinct_id: id, ...props }, () => { clearTimeout(t); resolve(); });
    } catch { clearTimeout(t); resolve(); }
  });
}

export async function track(name: EventName, props: Record<string, string | number | boolean> = {}, userId?: number) {
  const id = await anonId();
  if (!id) return;
  await run("INSERT INTO events(name,anon_id,user_id,props) VALUES (?,?,?,?)", name, id, userId ?? null, JSON.stringify(props));
  await forward(name, id, props);
}
