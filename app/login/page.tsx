import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string; next?: string }> }) {
  if (await currentUser()) redirect("/dashboard");
  const { e, next } = await searchParams;
  const google = !!process.env.GOOGLE_CLIENT_ID;
  return (
    <div style={{ maxWidth: 420, margin: "32px auto" }}>
      <h1>Sign in</h1>
      {e && <p className="err" role="alert">Sign-in did not work. Please try again.</p>}
      {google ? (
        <a className="btn" href="/api/auth/google">Continue with Google</a>
      ) : (
        <form className="card" action="/api/dev-login" method="post">
          <p className="mut">Google sign-in is not configured (set GOOGLE_CLIENT_ID). Using the development sign-in.</p>
          <input type="hidden" name="next" value={next?.startsWith("/") ? next : "/dashboard"} />
          <p><input type="text" name="name" placeholder="Your name" aria-label="Name" /></p>
          <p><input type="email" name="email" placeholder="you@example.com" required aria-label="Email" /></p>
          <button className="btn">Continue</button>
        </form>
      )}
    </div>
  );
}
