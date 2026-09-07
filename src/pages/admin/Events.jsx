import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { fmtDate, fmtTime } from '../../lib/utils'
export default function AdminEvents() {
  const [list, setList] = useState([])
  useEffect(() => onSnapshot(query(collection(db, 'events'), orderBy('startsAt', 'desc')), s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })))), [])
  return <>
    <h2>Events</h2>
    <p><Link className="btn sm" to="/admin/events/new">New event</Link></p>
    <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Title</th><th>Type</th><th>Location</th><th>Signed up</th><th>Status</th><th></th></tr></thead>
      <tbody>{list.map(ev => <tr key={ev.id}><td>{fmtDate(ev.startsAt)} {fmtTime(ev.startsAt)}</td><td><Link to={`/events/${ev.slug}`}>{ev.title}</Link></td><td><span className={`type ${ev.type}`}>{ev.type}</span></td><td>{ev.location}</td><td>{ev.registrationsCount || 0}{ev.capacity ? `/${ev.capacity}` : ''}</td><td>{ev.published ? <span className="badge approved">published</span> : <span className="badge">draft</span>}</td><td><Link className="btn sm gray" to={`/admin/events/${ev.id}`}>Edit</Link></td></tr>)}</tbody></table></div>
  </>
}
