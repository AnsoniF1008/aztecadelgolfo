import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { MIN_PASSWORD, EMAIL_OK, fail } from '../lib/forms'
export default function Join() {
  const { user } = useAuth(); const nav = useNavigate(); const toast = useToast()
  const [f, setF] = useState({ name: '', email: '', phone: '', boat: '', bio: '', password: '', password2: '', web: '' }); const [err, setErr] = useState(null); const [sending, setSending] = useState(false)
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  if (user) return <Navigate to="/profile" replace />
  const send = async e => {
    e.preventDefault(); setErr(null)
    if (f.web) return
    if (f.name.trim().length < 3) return setErr('Enter your full name (at least 3 letters).')
    if (!EMAIL_OK.test(f.email.trim())) return setErr('Enter a valid email address.')
    if (f.password.length < MIN_PASSWORD) return setErr(`Your password must be at least ${MIN_PASSWORD} characters.`)
    if (f.password !== f.password2) return setErr('The two passwords do not match.')
    setSending(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email.trim().toLowerCase(), f.password)
      await updateProfile(cred.user, { displayName: f.name.trim() })
      const batch = writeBatch(db)
      batch.set(doc(db, 'users', cred.user.uid), { name: f.name.trim(), boat: f.boat.trim() || null, bio: f.bio.trim() || null, photo: null, role: 'member', status: 'pending', createdAt: serverTimestamp() })
      batch.set(doc(db, 'users', cred.user.uid, 'private', 'contact'), { email: f.email.trim().toLowerCase(), phone: f.phone.trim() || null })
      await batch.commit()
      toast('ok', 'Application sent. You can browse the club while the board reviews it.')
      nav('/profile')
    } catch (ex) {
      setErr(fail(ex, 'We could not create the account. Try again.')); setSending(false)
    }
  }
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Apply for membership</h2><p>Create your account. The board reviews every application; in the meantime you can browse the gallery and the calendar.</p></div></div>
    <form className="form" onSubmit={send}>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="field"><label htmlFor="n">Full name</label><input id="n" name="name" required minLength={3} maxLength={80} autoComplete="name" value={f.name} onChange={set} /></div>
      <div className="row"><div className="field"><label htmlFor="em">Email</label><input id="em" type="email" name="email" required autoComplete="email" value={f.email} onChange={set} /></div><div className="field"><label htmlFor="tl">Phone <span className="opt">(optional)</span></label><input id="tl" type="tel" name="phone" autoComplete="tel" value={f.phone} onChange={set} /></div></div>
      <div className="row"><div className="field"><label htmlFor="p1">Password</label><input id="p1" type="password" name="password" required minLength={MIN_PASSWORD} autoComplete="new-password" value={f.password} onChange={set} /><small>At least {MIN_PASSWORD} characters.</small></div><div className="field"><label htmlFor="p2">Repeat password</label><input id="p2" type="password" name="password2" required minLength={MIN_PASSWORD} autoComplete="new-password" value={f.password2} onChange={set} /></div></div>
      <div className="field"><label htmlFor="bt">Boat <span className="opt">(optional)</span></label><input id="bt" name="boat" maxLength={80} value={f.boat} onChange={set} placeholder="e.g. 24' center console" /></div>
      <div className="field"><label htmlFor="bi">Tell us about yourself <span className="opt">(optional)</span></label><textarea id="bi" name="bio" maxLength={2000} value={f.bio} onChange={set} placeholder="What you fish for, how long you've been at it, where you usually head out…" /></div>
      <input name="web" value={f.web} onChange={set} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <button className="btn" disabled={sending}>{sending ? 'Sending application…' : 'Submit application'}</button>
    </form>
  </div></section>
}
