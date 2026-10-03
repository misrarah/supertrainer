# Decisions

One line per decision not covered by PLAN.md, with the reason.

- 2026-10-03 — Auth uses Supabase PKCE flow: tokens in the URL fragment would clash with HashRouter.
- 2026-10-03 — Deleted accounts: author/owner/logger columns become null and the UI shows "Deleted account", so clients' history survives.
- 2026-10-03 — Custom exercises get an `is_builtin` flag: `owner_id` null can no longer mean "built-in" once deleted owners are set to null.
- 2026-10-03 — E2E tests sign in with email/password against local Supabase only: Google OAuth can't be automated.
- 2026-10-03 — Lighthouse PWA score dropped from M9 acceptance: removed in Lighthouse v12.
- 2026-10-03 — An individual's own plan has `client_id` = their own id, so the one-active-plan index and RLS work the same for everyone.
- 2026-10-03 — `session_sets.client_id` added (checked by trigger) so RLS doesn't need a join.
- 2026-10-03 — Ending a relationship hands plans to the client by default; the trainer can untick this to keep them private. Clients always keep their own logged sessions (their data).
- 2026-10-03 — Trainer directory is browse-only; joining still needs an invite, to keep the pilot small.
- 2026-10-03 — Timestamps stored in UTC, shown in device local time; "today" is the device's local date.
- 2026-10-03 — Libraries use latest compatible versions rather than pinning React 18.
- 2026-10-03 — npm is the package manager; Supabase CLI is a dev dependency (`npx supabase`) because Homebrew isn't installed.
