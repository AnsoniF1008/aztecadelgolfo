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
functions/mail.js      ← email helper (Resend) + shared email layout
scripts/seed.js        ← initial admin + sample data (emulators)
scripts/icons.js       ← builds public/ icons and og-image.png from assets/
assets/logo-1024.png   ← logo master; never shipped, it is 1.28 MB on its own
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
```

## Data model (Firestore)
| Collection | Key fields |
|---|---|
| `users/{uid}` | name, boat, bio, photo, role, status, createdAt — **public** |
| `users/{uid}/private/contact` | email, phone — readable only by that member and the board |
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
- `notifyNewApplication` — emails the board when someone applies, with reply-to set to the applicant.
- `notifyMembershipApproved` — emails the member when the board flips them to `active`.
- `notifyContactMessage` — emails the board when the contact form is used, with reply-to set to the sender.
- `claimFirstAdmin` (callable) — makes the caller an admin **only if none exists yet**. Link shown on `/profile`.

### Email
Sent through [Resend](https://resend.com) from `functions/mail.js`. Two pieces of setup:

```bash
cp functions/.env.example functions/.env    # MAIL_FROM, BOARD_EMAIL, SITE_URL
firebase functions:secrets:set RESEND_API_KEY
```

Without the key nothing is sent: each function logs `Email skipped… would have sent "<subject>" to <address>` and carries on, so the emulators and a fresh checkout work with no setup. `functions/.env` must exist even locally — the settings are read from `process.env`, and the sender domain has to be verified in Resend before real mail will go out.

## Icons and link previews
`assets/logo-1024.png` is the master. Everything in `public/` is generated from it:

```bash
npm run icons
```

That writes the three sizes the pages actually load (`logo-104.webp` for the header, `logo-192.webp` for the footer, `logo-768.webp` for the hero), the favicons, the iOS icon, the two PNGs the web manifest needs, and `og-image.png` (1200×630, emblem on club black) for WhatsApp/Facebook/iMessage/X previews. Loading the home page pulls about 130 KB of logo instead of the 1.28 MB master.

The public site URL is `https://aztecadelgolfo.com` in `index.html`, `public/robots.txt`, `public/sitemap.xml` and `SITE_URL` in `functions/.env`. The Firebase fallback `https://aztecadelgolfofishingclu-bc814.web.app` still works until DNS is pointed at Hosting.

Crawlers don't run JavaScript, so the Open Graph tags describe the club as a whole. Per-page previews (a specific catch or event) would need prerendering.

## Running locally
Requirements: Node 20, Java 11+ (for the emulators), `npm i -g firebase-tools`.

```bash
npm install
cd functions && npm install && cd ..
cp .env.example .env                        # project credentials, shared by every mode
cp functions/.env.example functions/.env    # email addresses for the triggers
npm run emulators               # Auth 9099, Firestore 8080, Storage 9199, Functions 5001, UI at http://127.0.0.1:4000
npm run seed                    # in another terminal: admin + sample data
npm run dev                     # http://localhost:5173
```

On a slow machine the Functions emulator can give up before it finishes reading the code (`Cannot determine backend specification. Timeout after 10000`). Raise the window: `FUNCTIONS_DISCOVERY_TIMEOUT=120 npm run emulators`.
Seed accounts: `admin@aztecadelgolfo.com / Azteca2026!`, `carlos@test.com / test1234` (active), `luis@test.com / test1234` (pending).

Install the `functions` dependencies **before** starting the emulators. If `functions/node_modules` is missing when they boot, the Functions emulator silently loads nothing and the triggers never fire.

`npm run emulators` exports data to `./emulator-data` on exit and re-imports it on start, so you don't lose what you upload between sessions. The `--import` flag needs that directory to exist; on a clean checkout run `npm run emulators:fresh` once.

`.env` holds the credentials and nothing else. Whether the app talks to the emulators is decided by `.env.development` (`true`) and `.env.production` (`false`), both committed — so `npm run dev` can't reach the real database by accident and `npm run build` always targets it.

## Production

Project `aztecadelgolfofishingclu-bc814`, live at **https://aztecadelgolfo.com** (Firebase fallback: https://aztecadelgolfofishingclu-bc814.web.app).
Firestore is in `us-central1` (single region, permanent — changing it would mean a new project).

Custom domain: in [Hosting](https://console.firebase.google.com/project/aztecadelgolfofishingclu-bc814/hosting) add `aztecadelgolfo.com` and `www.aztecadelgolfo.com`, then put the TXT + A records Firebase shows into the domain’s DNS (Route 53 / registrar). Also add both hostnames under Authentication → Settings → Authorized domains, or sign-in on the custom domain will fail.

Deployed and working: Firestore rules, the composite indexes, and Hosting.

Still to do, all of it gated on the **Blaze** plan:

| Blocked | Why it matters |
|---|---|
| `firebase deploy --only functions` | No admin roles (`syncAdminClaim`), no emails, no `registrationsCount`, no Storage cleanup on delete |
| `firebase deploy --only storage` | New projects need Blaze before the default bucket exists, so photo and video uploads fail |

And one thing that needs no billing, just a click in the console: **enable Email/Password** under Authentication > Sign-in method. Until then nobody can register or sign in.

Order once Blaze is on:

```bash
firebase deploy --only storage,functions
npm run deploy                    # build + Hosting
```

Then register on the site, go to `/profile` and claim the first admin (the link only works while no admin exists).

## What the rules enforce
- Members create content as `pending` only, and cannot touch `status` or `featured`. Self-updates on a profile are limited to `name`, `boat`, `bio` and `photo`, so nobody can activate themselves, hand themselves `admin`, or rewrite `createdAt`.
- Only `active` profiles are publicly readable, so applicants aren't exposed while the board reviews them. Email and phone sit in `users/{uid}/private/contact`; the admin panel reads them with one collection group query.
- Sign-ups check that the event is published, still in the future, and has room (`registrationsCount < capacity`, where a null capacity means unlimited). The count is maintained by `countRegistrations`, so a burst of simultaneous sign-ups can still slip one past a full event — for a club calendar that's an acceptable trade.
- The sign-up list is members-only; visitors see just the number, read off the event document.
- A view counts one at a time (`views == views + 1` and nothing else in the same write), and owners can't bump their own posts through the ownership clause.
- Contact messages must carry exactly the five expected fields, arrive unread, use a server timestamp, and pass length and email-shape checks. That stops malformed and oversized junk but not a determined script: real rate limiting needs [App Check](https://firebase.google.com/docs/app-check), which is the next thing to turn on if the form gets abused.
- Public queries always filter on `status == 'approved'` / `published == true` so they satisfy the rules.

## Notes
- Photos are processed on the client (canvas), so no `sharp` in Functions.
- For long videos, an unlisted YouTube upload plus a link is still the cheapest option, and the gallery already supports it.
