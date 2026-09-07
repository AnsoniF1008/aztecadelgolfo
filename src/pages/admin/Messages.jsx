import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Empty } from '../../components/MediaCard'
import { fmtDate } from '../../lib/utils'
export default function AdminMessages() {
  const [list, setList] = useState([])
  useEffect(() => onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(200)), s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.read - b.read))), [])
  return <>
    <h2>Contact messages</h2>
    {!list.length && <Empty>No messages.</Empty>}
    {list.map(m => <div key={m.id} className="card" style={{ padding: 18, marginBottom: 14, opacity: m.read ? .7 : 1, borderLeft: m.read ? undefined : '4px solid var(--gold)' }}>
      <b>{m.name}</b> · <a href={`mailto:${m.email}`}>{m.email}</a> · <small>{fmtDate(m.createdAt)}</small>
      <p style={{ margin: '10px 0', whiteSpace: 'pre-line' }}>{m.message}</p>
      <div className="actions-row">
        <a className="btn sm" href={`mailto:${m.email}?subject=Re: your message to the club`}>Reply</a>
        {!m.read && <button className="btn sm gray" onClick={() => updateDoc(doc(db, 'messages', m.id), { read: true })}>Mark as read</button>}
        <button className="btn sm red" onClick={() => confirm('Delete this?') && deleteDoc(doc(db, 'messages', m.id))}>Delete</button>
      </div>
    </div>)}
  </>
}
