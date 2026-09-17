import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { parseAuthAction } from '../lib/authAction'
import { MIN_PASSWORD, fail } from '../lib/forms'
import { useToast } from '../context/ToastContext'

export default function AuthAction() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const fromUrl = typeof window !== 'undefined' ? parseAuthAction(window.location.href) : { mode: '', oobCode: '' }
  const mode = sp.get('mode') || fromUrl.mode || 'resetPassword'
  const code = sp.get('oobCode') || fromUrl.oobCode
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState(null)
  const [checking, setChecking] = useState(Boolean(code))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode !== 'resetPassword' || !code) { setChecking(false); return }
    verifyPasswordResetCode(auth, code)
      .then(e => { setEmail(e); setChecking(false) })
      .catch(e => { setErr(fail(e, 'The link did not work. Request a new one from the sign-in page.')); setChecking(false) })
  }, [mode, code])

  const save = async e => {
    e.preventDefault(); setErr(null)
    if (pw.length < MIN_PASSWORD) return setErr(`Use at least ${MIN_PASSWORD} characters.`)
    if (pw !== pw2) return setErr('The two passwords do not match.')
    setSaving(true)
    try {
      await confirmPasswordReset(auth, code, pw)
      toast('ok', 'Password saved. You can sign in now.')
      nav('/login', { replace: true })
    } catch (ex) { setErr(fail(ex, 'The link did not work. Request a new one from the sign-in page.')); setSaving(false) }
  }

  const ready = !checking && !err && mode === 'resetPassword' && code && email
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Choose a new password</h2><p>This page only works with a fresh link from your email.</p></div></div>
    <form className="form" onSubmit={save}>
      {checking && <p>Checking the link…</p>}
      {err && <p className="err" role="alert">{err}</p>}
      {ready && <>
        <p>For <strong>{email}</strong>.</p>
        <div className="field"><label htmlFor="npw">New password</label><input id="npw" type="password" required autoComplete="new-password" minLength={MIN_PASSWORD} value={pw} onChange={e => setPw(e.target.value)} /><small>At least {MIN_PASSWORD} characters.</small></div>
        <div className="field"><label htmlFor="npw2">Repeat password</label><input id="npw2" type="password" required autoComplete="new-password" minLength={MIN_PASSWORD} value={pw2} onChange={e => setPw2(e.target.value)} /></div>
        <div className="actions-row"><button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save password'}</button></div>
      </>}
      {!ready && !checking && !err && <p className="err" role="alert">This link is missing what we need to reset a password.</p>}
      {!ready && !checking && <p className="form-foot"><Link to="/login">Back to sign in</Link></p>}
    </form>
  </div></section>
}
