import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { flags } from "@/lib/flags";
import GoalForm from "@/components/GoalForm";

export default async function Settings() {
  const u = await currentUser();
  if (!u) redirect("/login");
  const f = await flags();
  return (
    <>
      <h1>Settings</h1>
      <p className="mut">{u.email}</p>
      {f.goal_matching && (<><h2>Learning goals</h2><GoalForm initial={u.goals} next="/settings" allowSkip={false} /></>)}
      {f.pet && (
        <>
          <h2>Companion pet</h2>
          <form action="/api/pet" method="post">
            <label className="chk"><input type="checkbox" name="pet" defaultChecked={!!u.pet_on} /> Show my pet</label>
            <button className="btn">Save</button>
          </form>
        </>
      )}
      <h2>Privacy</h2>
      <p className="mut">We keep your sign-in email and your own practice history. Usage analytics use an anonymous ID with no names or emails and no session recording. There are no push notifications.</p>
    </>
  );
}
