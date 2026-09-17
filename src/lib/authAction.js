/** Pull mode + oobCode from a Firebase action URL, a hash, or a pasted code. */
export function parseAuthAction(raw = '') {
  const text = String(raw).trim()
  if (!text) return { mode: '', oobCode: '' }
  try {
    const u = new URL(text)
    const q = new URLSearchParams(u.search)
    const hash = u.hash.replace(/^#/, '').replace(/^\?/, '')
    const h = new URLSearchParams(hash)
    const mode = q.get('mode') || h.get('mode') || ''
    const oobCode = q.get('oobCode') || h.get('oobCode') || ''
    return { mode, oobCode }
  } catch {
    if (/^[A-Za-z0-9_-]{20,}$/.test(text)) return { mode: 'resetPassword', oobCode: text }
    return { mode: '', oobCode: '' }
  }
}

export function resetPath({ mode, oobCode }) {
  const m = mode || 'resetPassword'
  return `/auth/action?mode=${encodeURIComponent(m)}&oobCode=${encodeURIComponent(oobCode)}`
}
