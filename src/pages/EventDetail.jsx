import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Loading } from '../components/MediaCard'
import { fmtDate, fmtTime, toDate, lb, inch } from '../lib/utils'

export default function EventDetail() {
  const { slug } = useParams(); const { user, profile, isAdmin, isActive } = useAuth(); const toast = useToast()
  const [ev, setEv] = useState(undefined); const [signups, setSignups] = useState([]); const [results, setResults] = useState([])
  useEffect(() => {
    getDocs(query(collection(db, 'events'), where('slug', '==', slug), where('published', '==', true), limit(1))).then(s => setEv(s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() })).catch(() => setEv(null))
  }, [slug])
  useEffect(() => {
    if (!ev) return
    const unsub = onSnapshot(collection(db, 'events', ev.id, 'registrations'), s => setSignups(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    if (ev.type === 'tournament') getDocs(query(collection(db, 'catches'), where('eventId', '==', ev.id), where('status', '==', 'approved'), orderBy('weightLb', 'desc'), limit(20))).then(s => setResults(s.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => {})
    return unsub
  }, [ev?.id])

  if (ev === undefined) return <Loading />
  if (ev === null) return <section className="sec"><div className="wrap"><h1>Event not found.</h1><Link to="/events">See all events</Link></div></section>
  const past = toDate(ev.startsAt) < new Date(); const signedUp = user && signups.some(i => i.id === user.uid); const full = ev.capacity && signups.length >= ev.capacity
  const signUp = async () => { await setDoc(doc(db, 'events', ev.id, 'registrations', user.uid), { uid: user.uid, name: profile.name, createdAt: serverTimestamp() }); toast('ok', "You're in. See you on the water.") }
  const cancel = async () => { await deleteDoc(doc(db, 'events', ev.id, 'registrations', user.uid)); toast('ok', 'Sign-up cancelled.') }

  return <section className="sec"><div className="wrap">
    <p><Link to="/events">← All events</Link></p>
    <div className="detail">
      <div>
        {ev.imageUrl && <img src={ev.imageUrl} alt="" style={{ borderRadius: 6, marginBottom: 20 }} />}
        <span className={`type ${ev.type}`}>{ev.type}</span>
        <h1 style={{ fontSize: '2.4rem' }}>{ev.title}</h1>
        <div className="prose" style={{ whiteSpace: 'pre-line' }}>{ev.description}</div>
        {results.length > 0 && <><h2 style={{ marginTop: 40 }}>Results</h2><div className="table-wrap"><table className="table"><thead><tr><th></th><th>Angler</th><th>Species</th><th>Weight</th><th>Length</th></tr></thead>
          <tbody>{results.map((c, i) => <tr key={c.id}><td className="pos">{i + 1}</td><td>{c.name}</td><td>{c.species}</td><td><b>{lb(c.weightLb)}</b></td><td>{inch(c.lengthIn)}</td></tr>)}</tbody></table></div></>}
      </div>
      <aside className="facts">
        <dl>
          <dt>When</dt><dd>{fmtDate(ev.startsAt, true)}, {fmtTime(ev.startsAt)}{ev.endsAt && <><br />until {fmtDate(ev.endsAt)} {fmtTime(ev.endsAt)}</>}</dd>
          {ev.location && <><dt>Where</dt><dd>{ev.location}</dd></>}
          {ev.fee != null && <><dt>Entry fee</dt><dd>${Number(ev.fee).toFixed(2)}</dd></>}
          <dt>Signed up</dt><dd>{signups.length}{ev.capacity ? ` / ${ev.capacity}` : ''}</dd>
        </dl>
        <div style={{ marginTop: 18 }}>
          {past ? <p className="badge">Event finished</p>
            : !user ? <Link className="btn" to="/login">Sign in to register</Link>
            : !isActive ? <p className="badge pending">Your membership is still pending</p>
            : signedUp ? <><p><span className="badge approved">You're signed up</span></p><button className="btn sm gray" onClick={cancel}>Cancel sign-up</button></>
            : full ? <p className="badge rejected">Event is full</p>
            : <button className="btn" onClick={signUp}>Sign me up</button>}
        </div>
        {signups.length > 0 && <><h3 style={{ marginTop: 24 }}>Who's coming</h3><ul style={{ paddingLeft: '1.2em', margin: 0 }}>{signups.map(i => <li key={i.id}><Link to={`/members/${i.id}`}>{i.name}</Link></li>)}</ul></>}
        {isAdmin && <p style={{ marginTop: 18 }}><Link to={`/admin/events/${ev.id}`}>Edit event</Link></p>}
      </aside>
    </div>
  </div></section>
}
