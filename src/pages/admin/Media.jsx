import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../context/ToastContext'
import { Badge, Empty } from '../../components/MediaCard'
import { fmtDate, youtubeId } from '../../lib/utils'
const FILTERS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']]
export default function AdminMedia() {
  const [sp] = useSearchParams(); const status = sp.get('status') || 'pending'; const toast = useToast(); const [list, setList] = useState([])
  useEffect(() => {
    const parts = [collection(db, 'media')]; if (status !== 'all') parts.push(where('status', '==', status)); parts.push(orderBy('createdAt', 'desc'), limit(100))
    return onSnapshot(query(...parts), s => setList(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error)
  }, [status])
  const act = async (m, changes, msg) => { await updateDoc(doc(db, 'media', m.id), changes); msg && toast('ok', msg) }
  const remove = async m => { if (!confirm('Delete permanently?')) return; await deleteDoc(doc(db, 'media', m.id)); toast('ok', 'Deleted.') }
  return <>
    <h2>Gallery</h2>
    <div className="filters">{FILTERS.map(([k, l]) => <Link key={k} className={status === k ? 'on' : ''} to={`/admin/media?status=${k}`}>{l}</Link>)}</div>
    {!list.length && <Empty>Nothing in this list.</Empty>}
    <div className="table-wrap"><table className="table"><tbody>{list.map(m => <tr key={m.id}>
      <td style={{ width: 100 }}><Link to={`/gallery/${m.id}`}>{m.type === 'photo' ? <img className="mini" src={m.thumbUrl || m.url} alt="" /> : m.type === 'youtube' ? <img className="mini" src={`https://i.ytimg.com/vi/${youtubeId(m.videoUrl)}/default.jpg`} alt="" /> : <video className="mini" src={`${m.url}#t=0.5`} preload="metadata" muted />}</Link></td>
      <td><b>{m.title}</b>{m.featured && ' ⭐'}<br /><small>{m.name} · {m.type} · {fmtDate(m.createdAt)}{m.species && ` · ${m.species}`}</small>{m.description && <><br /><small style={{ color: 'var(--ink-2)' }}>{m.description.slice(0, 140)}</small></>}</td>
      <td><Badge s={m.status} /></td>
      <td><div className="actions-row">
        {m.status !== 'approved' && <button className="btn sm green" onClick={() => act(m, { status: 'approved' }, 'Approved.')}>Approve</button>}
        {m.status !== 'rejected' && <button className="btn sm gray" onClick={() => act(m, { status: 'rejected' }, 'Rejected.')}>Reject</button>}
        <button className="btn sm gray" onClick={() => act(m, { featured: !m.featured })}>{m.featured ? 'Unfeature' : 'Feature'}</button>
        <button className="btn sm red" onClick={() => remove(m)}>Delete</button>
      </div></td></tr>)}</tbody></table></div>
  </>
}
