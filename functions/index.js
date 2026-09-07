/**
 * Cloud Functions (Node 20) â€” Azteca del Golfo Fishing Club
 * - syncAdminClaim: when users/{uid}.role changes, sync the `admin` custom claim
 *   (Firestore/Storage rules are based on that claim).
 * - cleanupMediaFiles / cleanupCatchPhoto: delete Storage files when the doc is deleted.
 * - countRegistrations: keeps events/{id}.registrationsCount up to date.
 * - notifyNewApplication: emails the board when someone applies.
 * - notifyMembershipApproved: emails the member when the board activates them.
 * - notifyContactMessage: emails the board when the contact form is used.
 * - claimFirstAdmin: bootstrap only.
 */
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { onDocumentWritten, onDocumentDeleted, onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { sendMail, layout, button, esc, RESEND_API_KEY, BOARD_EMAIL, SITE_URL } from './mail.js'

initializeApp()
const db = getFirestore()

export const syncAdminClaim = onDocumentWritten('users/{uid}', async (event) => {
  const after = event.data?.after?.data()
  const before = event.data?.before?.data()
  const uid = event.params.uid
  const isAdmin = !!after && after.role === 'admin' && after.status === 'active'
  const wasAdmin = !!before && before.role === 'admin' && before.status === 'active'
  if (isAdmin === wasAdmin && before) return
  try {
    await getAuth().setCustomUserClaims(uid, { admin: isAdmin })
    // Flag so the client refreshes its token
    await db.doc(`users/${uid}`).set({ claimsUpdatedAt: FieldValue.serverTimestamp() }, { merge: true })
    logger.info(`Claim admin=${isAdmin} for ${uid}`)
  } catch (e) { logger.error('setCustomUserClaims', e) }
})

async function deletePaths(paths) {
  const bucket = getStorage().bucket()
  await Promise.all(paths.filter(Boolean).map(p => bucket.file(p).delete().catch(() => {})))
}
export const cleanupMediaFiles = onDocumentDeleted('media/{id}', async (event) => {
  const d = event.data?.data(); if (!d) return
  await deletePaths([d.path, d.thumbPath])
})
export const cleanupCatchPhoto = onDocumentDeleted('catches/{id}', async (event) => {
  const d = event.data?.data(); if (!d) return
  await deletePaths([d.photoPath])
})

export const countRegistrations = onDocumentWritten('events/{eventId}/registrations/{uid}', async (event) => {
  const ref = db.doc(`events/${event.params.eventId}`)
  const delta = (event.data?.after?.exists ? 1 : 0) - (event.data?.before?.exists ? 1 : 0)
  if (delta !== 0) await ref.set({ registrationsCount: FieldValue.increment(delta) }, { merge: true })
})

/** Contact details are kept out of the public profile, so look them up. */
async function contactFor(uid) {
  const snap = await db.doc(`users/${uid}/private/contact`).get().catch(() => null)
  const c = snap?.data() || {}
  if (c.email) return c
  const u = await getAuth().getUser(uid).catch(() => null)
  return { ...c, email: u?.email || null }
}

export const notifyNewApplication = onDocumentCreated(
  { document: 'users/{uid}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const d = event.data?.data(); if (!d) return
    const { email, phone } = await contactFor(event.params.uid)
    await sendMail({
      to: BOARD_EMAIL,
      replyTo: email || undefined,
      subject: `New membership application: ${d.name}`,
      html: layout('New membership application', `
        <p><b>${esc(d.name)}</b> applied to join the club.</p>
        <p>Email: ${esc(email) || 'â€”'}<br />Phone: ${esc(phone) || 'â€”'}<br />Boat: ${esc(d.boat) || 'â€”'}</p>
        ${d.bio ? `<p style="padding:12px 16px;background:#f4ecdc">${esc(d.bio)}</p>` : ''}
        ${button(`${SITE_URL}/admin/members?status=pending`, 'Review the application')}`),
    })
  })

export const notifyMembershipApproved = onDocumentUpdated(
  { document: 'users/{uid}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data?.before?.data(), after = event.data?.after?.data()
    if (!before || !after) return
    if (before.status === 'active' || after.status !== 'active') return
    const { email } = await contactFor(event.params.uid)
    await sendMail({
      to: email,
      subject: "You're in â€” welcome to Azteca del Golfo",
      html: layout(`Welcome aboard, ${esc(after.name?.split(' ')[0] || 'angler')}`, `
        <p>The board reviewed your application and your membership is active. You can
        now post photos and videos, log your catches and sign up for tournaments and trips.</p>
        ${button(`${SITE_URL}/profile`, 'Go to your profile')}
        <p style="margin-top:24px;font-size:13px;color:#5a5346">See you on the water.</p>`),
    })
  })

export const notifyContactMessage = onDocumentCreated(
  { document: 'messages/{id}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const d = event.data?.data(); if (!d) return
    await sendMail({
      to: BOARD_EMAIL,
      replyTo: d.email,
      subject: `Contact form: ${d.name}`,
      html: layout('New message from the website', `
        <p><b>${esc(d.name)}</b> &lt;${esc(d.email)}&gt;</p>
        <p style="padding:12px 16px;background:#f4ecdc;white-space:pre-line">${esc(d.message)}</p>
        ${button(`${SITE_URL}/admin/messages`, 'Open the inbox')}`),
    })
  })

/** Bootstrap only: makes the caller an admin if no admin exists yet. */
export const claimFirstAdmin = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Please sign in.')
  const admins = await db.collection('users').where('role', '==', 'admin').limit(1).get()
  if (!admins.empty) throw new HttpsError('failed-precondition', 'An administrator already exists.')
  await db.doc(`users/${req.auth.uid}`).set({ role: 'admin', status: 'active' }, { merge: true })
  return { ok: true }
})
