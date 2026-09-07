import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
export default function Join() {
  const { user } = useAuth(); const nav = useNavigate(); const toast = useToast()
  const [f, setF] = useState({ name: '', email: '', phone: '', boat: '', bio: '', password: '', password2: '', web: '' }); const [err, setErr] = useState(null); const [sending, setSending] = useState(false)
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  if (user) return <Navigate to="/profile" replace />
  const send = async e => {
    e.preventDefault(); setErr(null)
    if (f.web) return
    if (f.name.trim().length < 3) return setErr('Please enter your full name.')
    if (f.password.length < 8) return setErr('Your password must be at least 8 characters.')
    if (f.password !== f.password2) return setErr("The passwords don't match.")
    setSending(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email.trim().toLowerCase(), f.password)
      await updateProfile(cred.user, { displayName: f.name.trim() })
      await setDoc(doc(db, 'users', cred.user.uid), { name: f.name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim() || null, boat: f.boat.trim() || null, bio: f.bio.trim() || null, photo: null, role: 'member', status: 'pending', createdAt: serverTimestamp() })
      toast('ok', "Application sent. The board will review it and we'll let you know when it's active.")
      nav('/profile')
    } catch (ex) {
      setErr(ex.code === 'auth/email-already-in-use' ? 'That email is already registered.' : ex.code === 'auth/invalid-email' ? 'Invalid email address.' : "We couldn't create the account."); setSending(false)
    }
  }
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Apply for membership</h2><p>Create your account. The board reviews every application; in the meantime you can browse the gallery and the calendar.</p></div></div>
    <form className="form" onSubmit={send}>{err && <p className="err">{err}</p>}
      <div className="field"><label htmlFor="n">Full name</label><input id="n" name="name" required value={f.name} onChange={set} /></div>
      <div className="row"><div className="field"><label htmlFor="em">Email</label><input id="em" type="email" name="email" required autoComplete="email" value={f.email} onChange={set} /></div><div className="field"><label htmlFor="tl">Phone</label><input id="tl" type="tel" name="phone" value={f.phone} onChange={set} /></div></div>
      <div className="row"><div className="field"><label htmlFor="p1">Password</label><input id="p1" type="password" name="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set} /></div><div className="field"><label htmlFor="p2">Repeat password</label><input id="p2" type="password" name="password2" required minLength={8} autoComplete="new-password" value={f.password2} onChange={set} /></div></div>
      <div className="field"><label htmlFor="bt">Boat (optional)</label><input id="bt" name="boat" value={f.boat} onChange={set} placeholder="e.g. 24' center console" /></div>
      <div className="field"><label htmlFor="bi">Tell us about yourself</label><textarea id="bi" name="bio" value={f.bio} onChange={set} placeholder="What you fish for, how long you've been at it, where you usually head out…" /></div>
      <input name="web" value={f.web} onChange={set} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: -9999 }} />
      <button className="btn" disabled={sending}>{sending ? 'Sending…' : 'Submit application'}</button>
    </form>
  </div></section>
}
