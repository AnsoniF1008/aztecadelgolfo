import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Empty, Loading } from '../components/MediaCard'
import { dayOf, monthOf, fmtTime, toDate } from '../lib/utils'

function Row({ ev, past }) {
  return <div className={`event ${past ? 'past' : ''}`}>
    <div className="date"><b>{dayOf(ev.startsAt)}</b><span>{monthOf(ev.startsAt)} {toDate(ev.startsAt).getFullYear()}</span></div>
    <div><span className={`type ${ev.type}`}>{ev.type}</span><h3 style={{ display: 'inline' }}>{ev.title}</h3>
      <div className="meta">{ev.location} · {fmtTime(ev.startsAt)}{ev.fee != null ? ` · $${ev.fee}` : ''} · {ev.registrationsCount || 0} signed up{ev.capacity ? ` of ${ev.capacity}` : ''}</div></div>
    <Link className={`btn sm ${past ? 'gray' : ''}`} to={`/events/${ev.slug}`}>{past ? 'View' : 'Details & sign-up'}</Link>
  </div>
}
export default function Events() {
  const [upcoming, setUpcoming] = useState(null); const [past, setPast] = useState([])
  useEffect(() => {
    const now = Timestamp.now()
    Promise.all([
      getDocs(query(collection(db, 'events'), where('published', '==', true), where('startsAt', '>=', now), orderBy('startsAt'))),
      getDocs(query(collection(db, 'events'), where('published', '==', true), where('startsAt', '<', now), orderBy('startsAt', 'desc'), limit(12))),
    ]).then(([a, b]) => { setUpcoming(a.docs.map(d => ({ id: d.id, ...d.data() }))); setPast(b.docs.map(d => ({ id: d.id, ...d.data() }))) }).catch(e => { console.error(e); setUpcoming([]) })
  }, [])
  if (!upcoming) return <Loading />
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Tournaments and trips</h2><p>The club calendar. Active members can sign up from any event page.</p></div></div>
    {upcoming.length ? <div className="event-list">{upcoming.map(ev => <Row key={ev.id} ev={ev} />)}</div> : <Empty>No events on the calendar. Check back soon.</Empty>}
    {past.length > 0 && <><h2 style={{ marginTop: 48 }}>Past events</h2><div className="event-list">{past.map(ev => <Row key={ev.id} ev={ev} past />)}</div></>}
  </div></section>
}
