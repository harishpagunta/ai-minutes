import { NextResponse } from "next/server";
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const redirect = (req: Request, path: string) => NextResponse.redirect(new URL(path, process.env.APP_URL || req.url), 303);
