
# Baby Log — Plan

A mobile-first PWA-styled web app to quickly log baby activities, review them by day, spot trends, and manage activity definitions. Single user, cloud-backed via Lovable Cloud.

## Connectors / integrations
- **Lovable Cloud** (required) — database + auth + storage. Powers cloud sync across your devices with a single sign-in.
- No third-party connectors needed. (No Stripe, no external APIs.) If you later want push reminders or share access with a partner, we can add those.

## Data model (Lovable Cloud tables)
- `activities` — `id, user_id, name, icon, color, kind ('instant'|'timed'), fields (jsonb: [{key,label,type,options?,required?}]), visible (bool), sort_order, created_at`
- `logs` — `id, user_id, activity_id, started_at, ended_at (nullable for instant + running timers), values (jsonb), created_at`
- RLS: owner-only on both tables (`user_id = auth.uid()`).
- Seeded per new user (via server fn on first login): Feeding (bottle), Nursing, Sleep, Diaper, Pumping, Tummy time, Medicine, Growth — each with sensible default fields, icons, and colors.

## Screens & behavior

### Auth
- Email/password + Google sign-in on `/auth`. Everything else lives under `_authenticated`.

### Home (`/`)
Two big hero actions on top: **Log** and **View day**. Below them, the currently-running timer (if any) shows as a pinned card with elapsed time + Stop.

- **Log** panel: grid of activity tiles (icon + label, activity color).
  - Tap tile:
    - Instant activity → bottom-sheet form of the activity's fields → Save writes a log at `now`.
    - Timed activity → bottom sheet with the fields + two buttons: **Start now** (starts timer immediately, form stays editable while running) and **Save & start** (fills fields then starts). Stop from the pinned running-timer card writes `ended_at`.
  - Long-press tile → opens **Activity settings** sheet: rename, change icon/color, toggle kind (instant ↔ timed), add/remove/reorder fields, visibility toggle, delete.
- **View day** widget: today's hybrid mini-timeline (vertical, chronological, colored chips with icon + time + summary). Each row is tappable → detail sheet with all recorded field values, edit, delete. Button **View all days** → `/calendar`.

### Calendar (`/calendar`)
- Multi-day view, swipeable/scrollable between days.
- 24h time-grid: instant events as dots at their timestamp, timed events as colored blocks spanning duration.
- Filter chips to hide/show activity types for this view only.
- Tap any entry → same detail sheet as Home.

### Insights (`/insights`)
- Guided chart builder (no chatbot): pick **activity → metric → timeframe → chart type**. Metrics are inferred from each activity's fields plus built-ins (count/day, total duration/day, avg duration, time between events).
- **Suggested charts** shown at top (e.g. "Sleep hours per day, last 14d", "Feedings per day", "Avg time between diapers"). Tap to add.
- Saved charts list with drag-to-reorder and delete. Rendered with Recharts.

### Activities (`/activities`)
- List of all activities with icon, name, kind badge, field summary.
- Per-row: visibility toggle (hides from Home/Calendar/Insights without deleting data), edit, delete.
- **Add activity** button → same editor sheet (name, icon picker from Lucide, color, kind, fields builder).

### Navigation
- Hamburger menu (shadcn Sheet on mobile) with: Home, Calendar, Insights, Activities, Sign out.
- Persistent top bar with app title + hamburger.

## Design direction
- Mobile-first, thumb-reachable. Warm, calm palette (soft cream background, muted accent colors per activity — blue/green/amber/pink/purple). Rounded 2xl tiles, generous tap targets (min 56px), subtle motion on tile press and timer tick. Dark mode supported.

## Tech notes
- TanStack Start routes under `src/routes/_authenticated/`.
- Server functions in `src/lib/*.functions.ts` for all CRUD, with `requireSupabaseAuth`.
- TanStack Query for caching; loader primes `ensureQueryData`, components use `useSuspenseQuery`.
- Running timer state = any `logs` row where `kind='timed'` and `ended_at IS NULL` for the user (single active timer enforced in UI).
- Recharts for insights. `date-fns` for date math. Lucide for icons.

## Out of scope (ask if you want any of these)
- Sharing with a partner / multi-caregiver
- Push notifications & reminders
- Export (CSV/PDF)
- AI chatbot for trends (you chose the guided picker)
- Photo attachments on logs
