import { all } from "./db";
export type FlagKey = "goal_matching" | "lenses" | "analytics" | "pet";
export const FLAG_KEYS: FlagKey[] = ["goal_matching", "lenses", "analytics", "pet"];
export async function flags(): Promise<Record<FlagKey, boolean>> {
  const rows = await all<{ key: FlagKey; enabled: number }>("SELECT key,enabled FROM flags");
  const out = { goal_matching: true, lenses: true, analytics: true, pet: true };
  for (const r of rows) out[r.key] = !!r.enabled;
  return out;
}
