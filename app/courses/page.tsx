import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { courses } from "@/lib/content";
import Track from "@/components/Track";

export default async function Courses() {
  const u = await currentUser();
  const list = await courses(u);
  return (
    <>
      <h1>Courses</h1>
      <div className="grid">
        {list.map((c) => (
          <Link key={c.id} href={`/courses/${c.id}`} style={{ textDecoration: "none" }}>
            <div className="card">
              {c.matches && <span className="tag hi">Matches your goals</span>}
              <h3 style={{ margin: "6px 0" }}>{c.title}</h3>
              <p className="mut">{c.description}</p>
              <div className="bar"><i style={{ width: `${(c.done / Math.max(c.total, 1)) * 100}%` }} /></div>
              <small className="mut">{c.done} of {c.total} lessons</small>
            </div>
          </Link>
        ))}
      </div>
      <Track name="Courses Viewed" />
    </>
  );
}
