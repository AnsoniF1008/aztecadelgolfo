import { useState } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
export default function Login() {
  const { user } = useAuth(); const nav = useNavigate(); const loc = useLocation(); const toast = useToast()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(null)
  if (user) return <Navigate to={loc.state?.next || '/profile'} replace />
  const signIn = async e => {
    e.preventDefault(); setErr(null)
    try { await signInWithEmailAndPassword(auth, email.trim(), pw); nav(loc.state?.next || '/profile', { replace: true }) }
    catch { setErr('Wrong email or password.') }
  }
  const forgot = async () => { if (!email) return setErr('Enter your email so we can send you the link.'); await sendPasswordResetEmail(auth, email.trim()); toast('ok', 'We sent you a link to reset your password.') }
  return <section className="sec"><div className="wrap">
    <form className="form" onSubmit={signIn} style={{ margin: '0 auto' }}>
      <h2>Sign in</h2>{err && <p className="err">{err}</p>}
      <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" required autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></div>
      <div className="actions-row"><button className="btn">Sign in</button><button type="button" className="btn gray" onClick={forgot}>Forgot my password</button></div>
      <p style={{ marginTop: 18 }}>Not a member yet? <Link to="/join">Apply for membership</Link>.</p>
    </form>
  </div></section>
}
