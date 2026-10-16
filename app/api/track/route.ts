import { currentUser } from "@/lib/auth";
import { EVENTS, track, type EventName } from "@/lib/telemetry";
import { json } from "@/lib/http";

export async function POST(req: Request) {
  const { name, props } = await req.json();
  if (!EVENTS.includes(name)) return json({ error: "Unknown event" }, 400);
  const u = await currentUser();
  await track(name as EventName, typeof props === "object" && props ? props : {}, u?.id);
  return json({ ok: true });
}
