/**
 * Cloud Functions (Node 20) — Azteca del Golfo Fishing Club
 * - syncAdminClaim: when users/{uid}.role changes, sync the `admin` custom claim
 *   (Firestore/Storage rules are based on that claim).
 * - cleanupMediaFiles / cleanupCatchPhoto: delete Storage files when the doc is deleted.
 * - countRegistrations: keeps events/{id}.registrationsCount up to date.
 * - notifyNewApplication: logs new membership applications (hook point for email).
 */
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { onDocumentWritten, onDocumentDeleted, onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'

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

export const notifyNewApplication = onDocumentCreated('users/{uid}', (event) => {
  const d = event.data?.data()
  logger.info(`New membership application: ${d?.name} <${d?.email}>`)
  // TODO: email the board (SendGrid / Resend / the "Trigger Email" extension)
})

/** Bootstrap only: makes the caller an admin if no admin exists yet. */
export const claimFirstAdmin = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Please sign in.')
  const admins = await db.collection('users').where('role', '==', 'admin').limit(1).get()
  if (!admins.empty) throw new HttpsError('failed-precondition', 'An administrator already exists.')
  await db.doc(`users/${req.auth.uid}`).set({ role: 'admin', status: 'active' }, { merge: true })
  return { ok: true }
})
