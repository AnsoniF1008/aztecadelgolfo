import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { EMAIL_OK, fail } from '../lib/forms'
export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '', web: '' }); const [sent, setSent] = useState(false); const [err, setErr] = useState(null); const [sending, setSending] = useState(false)
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  const send = async e => {
    e.preventDefault(); setErr(null)
    if (f.web) return setSent(true)
    if (f.name.trim().length < 2) return setErr('Enter your name.')
    if (!EMAIL_OK.test(f.email.trim())) return setErr('Enter a valid email so we can reply.')
    if (f.message.trim().length < 10) return setErr('Write at least 10 characters so we know how to help.')
    if (f.message.trim().length > 5000) return setErr('That message is too long. Keep it under 5,000 characters.')
    setSending(true)
    try {
      await addDoc(collection(db, 'messages'), { name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), read: false, createdAt: serverTimestamp() })
      setSent(true)
    } catch (ex) { setErr(fail(ex, 'We could not send that. Try again.')); setSending(false) }
  }
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Contact</h2><p>Questions about membership, tournaments or the club. We reply by email.</p></div></div>
    {sent ? <div className="form"><p className="ok-msg"><strong>Message sent.</strong> We’ll get back to you soon.</p></div> :
      <form className="form" onSubmit={send}>
        {err && <p className="err" role="alert">{err}</p>}
        <div className="row"><div className="field"><label htmlFor="n">Name</label><input id="n" name="name" required minLength={2} maxLength={100} autoComplete="name" value={f.name} onChange={set} /></div><div className="field"><label htmlFor="e">Email</label><input id="e" type="email" name="email" required autoComplete="email" value={f.email} onChange={set} /></div></div>
        <div className="field"><label htmlFor="m">Message</label><textarea id="m" name="message" required minLength={10} maxLength={5000} value={f.message} onChange={set} /><small>{f.message.trim().length}/5000</small></div>
        <input name="web" value={f.web} onChange={set} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
        <button className="btn" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
      </form>}
  </div></section>
}
