import { useState } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { parseAuthAction, resetPath } from '../lib/authAction'
import { fail } from '../lib/forms'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
export default function Login() {
  const { user } = useAuth(); const nav = useNavigate(); const loc = useLocation(); const toast = useToast()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(null)
  const [broken, setBroken] = useState(''); const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={loc.state?.next || '/profile'} replace />
  const signIn = async e => {
    e.preventDefault(); setErr(null); setBusy(true)
    try { await signInWithEmailAndPassword(auth, email.trim(), pw); nav(loc.state?.next || '/profile', { replace: true }) }
    catch (ex) { setErr(fail(ex, 'Wrong email or password.')); setBusy(false) }
  }
  const forgot = async () => {
    if (!email.trim()) return setErr('Enter your email so we can send you the reset link.')
    setErr(null); setBusy(true)
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      })
      toast('ok', 'If that email is on file, we sent a reset link. If the page in the email errors, paste the link below.')
    } catch (ex) { setErr(fail(ex, 'We could not send the reset email. Try again in a moment.')) }
    setBusy(false)
  }
  const openPasted = e => {
    e.preventDefault()
    const parsed = parseAuthAction(broken)
    if (!parsed.oobCode) return setErr('Paste the full link from the email.')
    nav(resetPath(parsed))
  }
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Sign in</h2><p>Members use this page to post, log catches and register for trips.</p></div></div>
    <form className="form" onSubmit={signIn}>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" required autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></div>
      <div className="actions-row"><button className="btn" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}</button><button type="button" className="btn gray" disabled={busy} onClick={forgot}>Forgot my password</button></div>
      <details className="help">
        <summary>The reset email link showed an error</summary>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="broken">Paste the link from the email</label>
          <input id="broken" type="url" inputMode="url" placeholder="https://…" value={broken} onChange={e => setBroken(e.target.value)} />
          <small>The club will open the password form from that link.</small>
        </div>
        <button type="button" className="btn gray" onClick={openPasted}>Open reset form</button>
      </details>
      <p className="form-foot">Not a member yet? <Link to="/join">Apply for membership</Link>.</p>
    </form>
  </div></section>
}
