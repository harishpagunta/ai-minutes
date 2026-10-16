# AI Minutes

Learn AI a few minutes a day. A short plain-language lesson, one server-graded quick check, and an honest calendar of the days you actually showed up.

Built from a product spec for mid-career, non-technical professionals who use AI at work but cannot yet judge its output.

## Run locally
```bash
cp .env.example .env.local   # fill in what you need
npm install
npm run dev                  # http://localhost:3000
```
Requires Node 20+. With no `DATABASE_URL`, an embedded Postgres (PGlite) stores data in `./data/pg` and is seeded with 3 courses / 9 lessons on first run.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Hosted Postgres (Neon, Supabase, Vercel Postgres). Empty = embedded local Postgres. |
| `PG_POOL_MAX` | Connection pool size (default 3; use 1 on serverless without a pooled URL). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in. Redirect URI: `{APP_URL}/api/auth/google/callback`. |
| `APP_URL` | Public base URL, used for OAuth redirects. |
| `ADMIN_EMAIL` | The account that can open `/admin`. |
| `ANTHROPIC_API_KEY` | Lesson lenses and the admin content pipeline. Everything else works without it. |
| `MIXPANEL_TOKEN` | Optional. Forwards the 14 anonymous events to Mixpanel. |
| `ALLOW_DEV_LOGIN` | `1` enables the email-only dev sign-in outside `next dev`. **Never set in production.** |

Without Google credentials, `next dev` shows an email-only dev sign-in.

## Deploy (Vercel)
1. Create a Postgres database (Neon via the Vercel Marketplace works) and set `DATABASE_URL`. Tables and seed content are created automatically on first request.
2. Set `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`, and optionally `ANTHROPIC_API_KEY` and `MIXPANEL_TOKEN`.
3. Add `{APP_URL}/api/auth/google/callback` as an authorised redirect URI in Google Cloud.
4. Leave `ALLOW_DEV_LOGIN` unset.

## Features
| Feature | Where |
|---|---|
| Google sign-in | `app/api/auth/google/*` |
| Goal onboarding (max 2, skippable, editable) | `/onboarding`, `/settings` |
| Quick checks graded server-side; the answer key never reaches the browser | `app/api/check`, `lib/content.ts` |
| Lesson lenses (analogy / example / deep dive) | `components/Lenses.tsx`, `lib/ai.ts` |
| Goal-matched ordering ("Matches your goals") | `lib/content.ts#courses` |
| Dashboard: stats, 12-week calendar, badges, continue banner | `/dashboard` |
| Learner analytics (overall, first-try, goal progress, weakest first) | `/analytics`, `lib/stats.ts` |
| Companion pet (roams, reacts, per-user off switch) | `components/Pet.tsx` |
| Admin console: pipeline, review, all-or-nothing publish, flags, learners, insights | `/admin` |
| Telemetry: 14 events, anonymous id, reset on sign-out | `lib/telemetry.ts` |
| Feature flags: goal_matching, lenses, analytics, pet | `lib/flags.ts` |
| Public shared lesson link with a sign-in path | `/lesson/[id]` when signed out |

Deliberately not built: payments, push notifications, certificates or grades, a native app, long-form video.

## Notes
- **Telemetry** is always written to the local `events` table (Admin reads it) and, if `MIXPANEL_TOKEN` is set, forwarded to Mixpanel with the anonymous id only: no names, no emails. Events: Sign In Started, Signed Up, Lesson Opened, Quick Check Answered, First Quick Check Answered, Lesson Completed, Courses Viewed, Course Opened, Practice Viewed, Analytics Viewed, Goals Updated, Onboarding Completed, Onboarding Skipped, Tour Finished. Mixpanel identity merges can take up to a day to show in reports.
- **Content pipeline** calls `claude-opus-5-5` with structured output, constrained to admin-supplied source text. Nothing is visible to learners until a human reviews and publishes it, and publishing is a single transaction.
- The seed lessons are placeholders. Review and replace them before real learners see them.
