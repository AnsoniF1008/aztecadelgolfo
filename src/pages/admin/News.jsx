import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { fmtDate } from '../../lib/utils'
export default function AdminNews() {
  const [list, setList] = useState([])
  useEffect(() => onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc')), s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })))), [])
  return <>
    <h2>News</h2>
    <p><Link className="btn sm" to="/admin/news/new">New article</Link></p>
    <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Title</th><th>Status</th><th></th></tr></thead>
      <tbody>{list.map(n => <tr key={n.id}><td>{fmtDate(n.createdAt)}</td><td><Link to={`/news/${n.slug}`}>{n.title}</Link></td><td>{n.published ? <span className="badge approved">published</span> : <span className="badge">draft</span>}</td><td><Link className="btn sm gray" to={`/admin/news/${n.id}`}>Edit</Link></td></tr>)}</tbody></table></div>
  </>
}
