import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function Home() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <>
      <h1 style={{ fontSize: 40, marginTop: 24 }}>Learn AI, a few minutes a day.</h1>
      <p className="mut" style={{ fontSize: 18, maxWidth: 560 }}>You already use AI at work. Build the skill behind it: one plain-language lesson, one practice question, five minutes a day.</p>
      <p><Link className="btn" href="/login">Start with Google</Link></p>
      <div className="grid" style={{ marginTop: 32 }}>
        <div className="card"><b>Read</b><p className="mut">A short lesson, in plain language. No video, no jargon.</p></div>
        <div className="card"><b>Check</b><p className="mut">One practice question, graded against a real answer key.</p></div>
        <div className="card"><b>Show up</b><p className="mut">A calendar of the days you actually practised. No fake scores.</p></div>
      </div>
    </>
  );
}
