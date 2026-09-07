# Azteca del Golfo Fishing Club — React + Vite + Firebase

React 18 frontend (Vite). Firebase backend: Authentication (email/password), Firestore, Storage and Cloud Functions on Node 20. Everything runs locally with the Firebase emulators.

## Modules
- **Gallery**: photos (resized in the browser → 1800 px + a 600 px thumbnail), videos (MP4/MOV/WEBM up to 250 MB, with a progress bar) and YouTube links. Members upload, the board approves; anything an admin uploads is published straight away.
- **Catches / leaderboard**: weight, length, location, bait, photo, tournament. Annual leaderboard by weight, podium, filter by species, most active members. Validated by an admin.
- **Tournaments and trips**: calendar, capacity, entry fee, sign-up (subcollection), live participant list, tournament results.
- **News**, **members** (directory and public profile), **the club**, **contact** (messages into Firestore).
- **Membership**: application → `pending` → the board activates it. Roles `member` / `admin` (the role is mirrored into a *custom claim* that the rules read).
- **Admin panel** `/admin`: gallery and catch moderation, event and news CRUD, members, messages. Live counters.

## Structure
```
src/
  lib/firebase.js      ← init + emulator wiring (VITE_USE_EMULATORS)
  lib/utils.js         ← dates, slugs, image resizing, Storage uploads
  context/             ← AuthContext (user + profile + admin claim), ToastContext
  components/          ← Layout, Guard (protected routes), MediaCard
  pages/               ← public and member pages
  pages/admin/         ← the panel
functions/index.js     ← Cloud Functions (Node 20)
scripts/seed.js        ← initial admin + sample data (emulators)
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
```

## Data model (Firestore)
| Collection | Key fields |
|---|---|
| `users/{uid}` | name, email, phone, boat, bio, photo, role, status, createdAt |
| `media/{id}` | uid, name, type (photo/video/youtube), url, path, thumbUrl, thumbPath, videoUrl, title, description, species, location, caughtOn, status, featured, views, createdAt |
| `catches/{id}` | uid, name, species, weightLb, lengthIn, location, bait, date (YYYY-MM-DD), year, photoUrl, photoPath, notes, eventId, status, createdAt |
| `events/{id}` | title, slug, type, description, startsAt, endsAt, location, fee, capacity, imageUrl, published, registrationsCount |
| `events/{id}/registrations/{uid}` | uid, name, createdAt |
| `news/{id}` | title, slug, summary, body, imageUrl, published, createdAt |
| `messages/{id}` | name, email, message, read, createdAt |

Enum values: `status` is `pending` / `approved` / `rejected` for content and `pending` / `active` / `suspended` for members; `role` is `member` / `admin`; media `type` is `photo` / `video` / `youtube`; event `type` is `tournament` / `trip` / `meeting` / `social`.

Storage: `media/{uid}/…`, `catches/{uid}/…`, `profiles/{uid}/…`, `events/…`, `news/…`.

## Cloud Functions (Node)
- `syncAdminClaim` — when `users/{uid}.role` changes, sets the `admin` claim in Auth and stamps `claimsUpdatedAt` so the client refreshes its token.
- `countRegistrations` — keeps `events.registrationsCount` in sync.
- `cleanupMediaFiles` / `cleanupCatchPhoto` — delete Storage files when the document is deleted.
- `notifyNewApplication` — hook for alerting the board about new applications (log only; wire up SendGrid/Resend or the *Trigger Email* extension).
- `claimFirstAdmin` (callable) — makes the caller an admin **only if none exists yet**. Link shown on `/profile`.

## Running locally
Requirements: Node 20, Java 11+ (for the emulators), `npm i -g firebase-tools`.

```bash
npm install
cd functions && npm install && cd ..
cp .env.example .env            # demo values work with the emulators
npm run emulators               # Auth 9099, Firestore 8080, Storage 9199, Functions 5001, UI at http://127.0.0.1:4000
npm run seed                    # in another terminal: admin + sample data
npm run dev                     # http://localhost:5173
```
Seed accounts: `admin@aztecadelgolfo.com / Azteca2026!`, `carlos@test.com / test1234` (active), `luis@test.com / test1234` (pending).

Install the `functions` dependencies **before** starting the emulators. If `functions/node_modules` is missing when they boot, the Functions emulator silently loads nothing and the triggers never fire.

`npm run emulators` exports data to `./emulator-data` on exit and re-imports it on start, so you don't lose what you upload between sessions. The `--import` flag needs that directory to exist; on a clean checkout run `npm run emulators:fresh` once.

## Going to production (when the time comes)
1. Create the project in Firebase, enable Auth (email/password), Firestore, Storage and Blaze (Functions).
2. `firebase use --add` and put the real credentials in `.env` with `VITE_USE_EMULATORS=false`.
3. `firebase deploy --only firestore:rules,firestore:indexes,storage,functions`
4. Register on the site, go to `/profile` and claim the first admin.
5. `npm run deploy` (build + Hosting).

## Notes
- Rules: members can only create content as `pending` and cannot touch `status`/`featured`; only admins write events/news; public queries always filter on `status == 'approved'` / `published == true` so they satisfy the rules.
- Photos are processed on the client (canvas), so no `sharp` in Functions.
- For long videos, an unlisted YouTube upload plus a link is still the cheapest option, and the gallery already supports it.
