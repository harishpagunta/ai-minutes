import { endSession } from "@/lib/auth";
import { redirect } from "@/lib/http";
export async function POST(req: Request) { await endSession(); return redirect(req, "/"); }
