import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '', web: '' }); const [sent, setSent] = useState(false); const [err, setErr] = useState(null)
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  const send = async e => {
    e.preventDefault(); setErr(null)
    if (f.web) return setSent(true)
    if (f.name.trim().length < 2 || !/.+@.+\..+/.test(f.email) || f.message.trim().length < 10) return setErr('Please fill in your name, a valid email and a message.')
    try { await addDoc(collection(db, 'messages'), { name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), read: false, createdAt: serverTimestamp() }); setSent(true) }
    catch { setErr("We couldn't send that. Please try again.") }
  }
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Contact</h2><p>Questions about membership, tournaments or the club. We reply by email.</p></div></div>
    {sent ? <div className="form"><p><b>Message sent.</b> We'll get back to you soon.</p></div> :
      <form className="form" onSubmit={send}>{err && <p className="err">{err}</p>}
        <div className="row"><div className="field"><label htmlFor="n">Name</label><input id="n" name="name" required value={f.name} onChange={set} /></div><div className="field"><label htmlFor="e">Email</label><input id="e" type="email" name="email" required value={f.email} onChange={set} /></div></div>
        <div className="field"><label htmlFor="m">Message</label><textarea id="m" name="message" required value={f.message} onChange={set} /></div>
        <input name="web" value={f.web} onChange={set} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: -9999 }} />
        <button className="btn">Send message</button></form>}
  </div></section>
}
