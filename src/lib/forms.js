export const MIN_PASSWORD = 8
export const EMAIL_OK = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)$/

export function explainAuth(code) {
  if (code === 'auth/invalid-email') return 'That email address is not valid.'
  if (code === 'auth/email-already-in-use') return 'That email is already registered. Sign in, or reset your password.'
  if (code === 'auth/weak-password') return `Use at least ${MIN_PASSWORD} characters.`
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a minute and try again.'
  if (code === 'auth/network-request-failed') return 'No connection. Check your network and try again.'
  if (code === 'auth/user-disabled') return 'This account is suspended. Contact the board.'
  if (code === 'auth/requires-recent-login' || code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials' || code === 'auth/user-not-found') {
    return 'Wrong email or password.'
  }
  if (code === 'auth/expired-action-code') return 'This link has expired. Request a new one from the sign-in page.'
  if (code === 'auth/invalid-action-code') return 'This link was already used or is not valid. Request a new one from the sign-in page.'
  if (code === 'permission-denied') return 'You do not have permission to do that yet.'
  if (code === 'unavailable') return 'The club service is busy. Try again in a moment.'
  return null
}

export function fail(err, fallback = 'Something went wrong. Try again.') {
  return explainAuth(err?.code) || err?.message || fallback
}

export const STATUS_LABEL = {
  pending: 'Pending review',
  approved: 'Approved',
  active: 'Active',
  rejected: 'Rejected',
  suspended: 'Suspended',
  admin: 'Admin',
}
