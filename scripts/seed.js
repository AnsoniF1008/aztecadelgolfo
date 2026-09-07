/**
 * Creates the initial admin plus sample data in the EMULATORS.
 * Usage: npm run emulators  (in another terminal)  →  npm run seed
 */
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'azteca-del-golfo' })
const auth = getAuth(), db = getFirestore()

async function user(email, password, name, role, status, extra = {}) {
  let u; try { u = await auth.getUserByEmail(email) } catch { u = await auth.createUser({ email, password, displayName: name }) }
  await auth.setCustomUserClaims(u.uid, { admin: role === 'admin' })
  await db.doc(`users/${u.uid}`).set({ name, role, status, photo: null, boat: null, bio: null, createdAt: Timestamp.now(), ...extra }, { merge: true })
  await db.doc(`users/${u.uid}/private/contact`).set({ email, phone: null }, { merge: true })
  console.log(`${role.padEnd(6)} ${email} / ${password}`)
  return u.uid
}

await user('admin@aztecadelgolfo.com', 'Azteca2026!', 'Administrator', 'admin', 'active')
const carlos = await user('carlos@test.com', 'test1234', 'Carlos Medina', 'member', 'active', { boat: '24ft Bay Boat' })
await user('luis@test.com', 'test1234', 'Luis Perez', 'member', 'pending')

const ev1 = db.collection('events').doc()
await ev1.set({ title: 'Fall Tournament 2026', slug: 'fall-tournament-2026', type: 'tournament', description: 'Club tournament. Categories: Red snapper, Kingfish and Mahi. Weigh-in at 3 pm.', startsAt: Timestamp.fromDate(new Date('2026-10-17T06:00:00-05:00')), endsAt: null, location: 'Freeport Marina', fee: 75, capacity: 30, imageUrl: null, published: true, registrationsCount: 0, createdAt: Timestamp.now() })
await db.collection('events').doc().set({ title: 'Offshore Trip', slug: 'offshore-trip', type: 'trip', description: 'Group run 40 miles out.', startsAt: Timestamp.fromDate(new Date('2026-09-20T05:30:00-05:00')), endsAt: null, location: 'Galveston Yacht Basin', fee: null, capacity: null, imageUrl: null, published: true, registrationsCount: 0, createdAt: Timestamp.now() })

await db.collection('media').doc().set({ uid: carlos, name: 'Carlos Medina', type: 'youtube', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', url: null, path: null, thumbUrl: null, thumbPath: null, title: 'Kingfish off Galveston', description: 'Calm morning, flat seas.', species: 'Kingfish', location: 'Galveston', caughtOn: '2026-08-15', status: 'approved', featured: true, views: 0, createdAt: Timestamp.now() })

for (const [species, weight, length, location, date] of [['Red snapper', 22.4, 31, 'Freeport', '2026-08-10'], ['Kingfish', 34.1, 48, 'Galveston', '2026-07-02']]) {
  await db.collection('catches').doc().set({ uid: carlos, name: 'Carlos Medina', species, weightLb: weight, lengthIn: length, location, bait: 'Ribbonfish', date, year: 2026, photoUrl: null, photoPath: null, notes: null, eventId: null, status: 'approved', createdAt: Timestamp.now() })
}
await db.collection('news').doc().set({ title: 'The 2026 season is underway', slug: 'the-2026-season-is-underway', summary: 'Calendar, tournaments and new memberships.', body: 'The 2026 season is underway. Check the calendar and sign up for the tournaments.', imageUrl: null, published: true, createdAt: Timestamp.now() })
console.log('Seed complete.')
