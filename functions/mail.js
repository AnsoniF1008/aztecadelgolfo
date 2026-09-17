/**
 * Transactional email through Resend (https://resend.com).
 *
 * Set the key once:  firebase functions:secrets:set RESEND_API_KEY
 * Addresses and the site URL come from functions/.env (see functions/.env.example).
 *
 * With no key configured nothing is sent and the message is logged instead, so
 * the emulators and a fresh checkout work without any setup.
 */
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'

// The API key is a real secret, so it goes through Secret Manager.
export const RESEND_API_KEY = defineSecret('RESEND_API_KEY')

// The rest are plain settings. Firebase loads functions/.env into process.env for
// both the emulators and deploys; defineString would block startup asking for them.
export const MAIL_FROM = process.env.MAIL_FROM || 'Azteca del Golfo <noreply@aztecadelgolfo.com>'
export const BOARD_EMAIL = process.env.BOARD_EMAIL || 'board@aztecadelgolfo.com'
export const SITE_URL = process.env.SITE_URL || 'https://aztecadelgolfo.com'

/** Wraps the body in the club's colours so every email looks the same. */
export function layout(heading, bodyHtml) {
  return `<div style="margin:0;padding:24px;background:#f4ecdc;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-top:4px solid #c9a24a">
    <div style="padding:28px 32px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c9a24a">Azteca del Golfo Fishing Club</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#1f1c17">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#5a5346">${bodyHtml}</div>
    </div>
  </div>
</div>`
}

export function button(url, label) {
  return `<p style="margin:24px 0 0"><a href="${url}" style="display:inline-block;padding:11px 22px;background:#0a0a0a;color:#f4ecdc;text-decoration:none;font-size:14px">${label}</a></p>`
}

/** Escapes user-supplied text before it goes into an email body. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export async function sendMail({ to, subject, html, replyTo }) {
  let key = null
  try { key = RESEND_API_KEY.value() } catch { key = null }
  if (!to) { logger.warn(`Email skipped, no recipient: ${subject}`); return }
  if (!key) { logger.warn(`Email skipped, RESEND_API_KEY not set â€” would have sent "${subject}" to ${to}`); return }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    })
    if (!res.ok) return logger.error(`Resend replied ${res.status}: ${await res.text()}`)
    logger.info(`Email sent to ${to}: ${subject}`)
  } catch (e) { logger.error('sendMail', e) }
}
