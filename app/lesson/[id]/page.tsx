import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { lesson, lessonsOf } from "@/lib/content";
import { flags } from "@/lib/flags";
import QuickCheck from "@/components/QuickCheck";
import Lenses from "@/components/Lenses";
import Track from "@/components/Track";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const l = await lesson(Number((await params).id));
  return l ? { title: `${l.title} · AI Minutes`, description: l.body.slice(0, 140) } : {};
}

export default async function Lesson({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const l = await lesson(id);
  if (!l) notFound();
  const u = await currentUser();
  const sibs = await lessonsOf(l.course_id);
  const lensesOn = (await flags()).lenses;
  const nxt = sibs[sibs.findIndex((s) => s.id === id) + 1];
  return (
    <>
      <p className="mut">{l.course_title} · lesson {l.position + 1}</p>
      <h1>{l.title}</h1>
      <div className="card prose">{l.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
      {u && lensesOn && <Lenses lessonId={l.id} />}
      {u ? (
        <QuickCheck lessonId={l.id} question={l.question} options={l.options} next={nxt ? { href: `/lesson/${nxt.id}`, label: "Next lesson →" } : null} />
      ) : (
        <div className="card">
          <b>Want to practise this?</b>
          <p className="mut">Sign in to answer the quick check and track the days you show up. It is free.</p>
          <Link className="btn" href={`/login?next=/lesson/${l.id}`}>Sign in with Google</Link>
        </div>
      )}
      <Track name="Lesson Opened" props={{ lesson: l.id }} />
    </>
  );
}
