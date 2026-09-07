import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Badge } from '../../components/MediaCard'
import { fmtDate } from '../../lib/utils'
export default function Dashboard() {
  const p = useOutletContext(); const [k, setK] = useState({}); const [latest, setLatest] = useState([])
  useEffect(() => {
    Promise.all([
      getCountFromServer(query(collection(db, 'users'), where('status', '==', 'active'))),
      getCountFromServer(query(collection(db, 'media'), where('status', '==', 'approved'))),
      getCountFromServer(query(collection(db, 'events'), where('startsAt', '>=', Timestamp.now()))),
      getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc'), limit(8))),
    ]).then(([a, b, c, d]) => { setK({ members: a.data().count, media: b.data().count, events: c.data().count }); setLatest(d.docs.map(x => ({ id: x.id, ...x.data() }))) }).catch(console.error)
  }, [])
  return <>
    <h2>Overview</h2>
    <div className="kpis">
      <Link className={`kpi ${p.media ? 'alert' : ''}`} to="/admin/media"><b>{p.media}</b><span>posts to review</span></Link>
      <Link className={`kpi ${p.catches ? 'alert' : ''}`} to="/admin/catches"><b>{p.catches}</b><span>catches to validate</span></Link>
      <Link className={`kpi ${p.users ? 'alert' : ''}`} to="/admin/members"><b>{p.users}</b><span>membership applications</span></Link>
      <Link className={`kpi ${p.messages ? 'alert' : ''}`} to="/admin/messages"><b>{p.messages}</b><span>unread messages</span></Link>
      <div className="kpi"><b>{k.members ?? '…'}</b><span>active members</span></div>
      <div className="kpi"><b>{k.media ?? '…'}</b><span>posts in the gallery</span></div>
      <div className="kpi"><b>{k.events ?? '…'}</b><span>upcoming events</span></div>
    </div>
    <div className="actions-row" style={{ marginBottom: 24 }}><Link className="btn sm" to="/admin/events/new">New event</Link><Link className="btn sm" to="/admin/news/new">New article</Link><Link className="btn sm gray" to="/upload">Upload to the gallery</Link></div>
    <h3>Latest posts</h3>
    <div className="table-wrap"><table className="table"><thead><tr><th>Title</th><th>Member</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>{latest.map(m => <tr key={m.id}><td><Link to={`/gallery/${m.id}`}>{m.title}</Link></td><td>{m.name}</td><td>{m.type}</td><td><Badge s={m.status} /></td><td>{fmtDate(m.createdAt)}</td></tr>)}</tbody></table></div>
  </>
}
