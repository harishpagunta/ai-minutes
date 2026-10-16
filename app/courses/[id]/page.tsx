import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { completedIds, courses, lessonsOf } from "@/lib/content";
import Track from "@/components/Track";

export default async function Course({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await currentUser();
  const c = (await courses(u)).find((x) => x.id === Number(id));
  if (!c) notFound();
  const done = u ? await completedIds(u.id) : new Set<number>();
  const ls = await lessonsOf(c.id);
  return (
    <>
      <p><Link href="/courses" className="mut">← All courses</Link></p>
      <h1>{c.title}</h1>
      <p className="mut">{c.description}</p>
      {ls.map((l, i) => (
        <Link key={l.id} href={`/lesson/${l.id}`} style={{ textDecoration: "none" }}>
          <div className="card" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{i + 1}. {l.title}</span>
            <span className={done.has(l.id) ? "ok" : "mut"}>{done.has(l.id) ? "Done ✓" : "5 min"}</span>
          </div>
        </Link>
      ))}
      <Track name="Course Opened" props={{ course: c.id }} />
    </>
  );
}
