import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import GoalForm from "@/components/GoalForm";

export default async function Onboarding() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.onboarded) redirect("/dashboard");
  return (
    <div style={{ maxWidth: 480, margin: "24px auto" }}>
      <h1>What do you want to get better at?</h1>
      <p className="mut">One optional question. It only decides which courses appear first.</p>
      <GoalForm initial={[]} next="/dashboard" allowSkip />
    </div>
  );
}
