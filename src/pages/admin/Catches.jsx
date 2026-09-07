import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../context/ToastContext'
import { Badge, Empty } from '../../components/MediaCard'
import { fmtDate, lb, inch } from '../../lib/utils'
const FILTERS = [['pending', 'Pending'], ['approved', 'Validated'], ['rejected', 'Rejected'], ['all', 'All']]
export default function AdminCatches() {
  const [sp] = useSearchParams(); const status = sp.get('status') || 'pending'; const toast = useToast(); const [list, setList] = useState([])
  useEffect(() => {
    const parts = [collection(db, 'catches')]; if (status !== 'all') parts.push(where('status', '==', status)); parts.push(orderBy('createdAt', 'desc'), limit(200))
    return onSnapshot(query(...parts), s => setList(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error)
  }, [status])
  const set = async (c, s, msg) => { await updateDoc(doc(db, 'catches', c.id), { status: s }); toast('ok', msg) }
  const remove = async c => { if (!confirm('Delete this?')) return; await deleteDoc(doc(db, 'catches', c.id)); toast('ok', 'Deleted.') }
  return <>
    <h2>Catches</h2>
    <div className="filters">{FILTERS.map(([k, l]) => <Link key={k} className={status === k ? 'on' : ''} to={`/admin/catches?status=${k}`}>{l}</Link>)}</div>
    {!list.length && <Empty>Nothing in this list.</Empty>}
    <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Member</th><th>Species</th><th>Weight</th><th>Length</th><th>Location</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>{list.map(c => <tr key={c.id}><td>{c.photoUrl && <a href={c.photoUrl} target="_blank" rel="noreferrer"><img className="mini" src={c.photoUrl} alt="" /></a>}</td><td>{c.name}</td><td>{c.species}</td><td><b>{lb(c.weightLb)}</b></td><td>{inch(c.lengthIn)}</td><td>{c.location}</td><td>{fmtDate(c.date)}</td><td><Badge s={c.status} /></td>
        <td><div className="actions-row">
          {c.status !== 'approved' && <button className="btn sm green" onClick={() => set(c, 'approved', 'Validated.')}>Validate</button>}
          {c.status !== 'rejected' && <button className="btn sm gray" onClick={() => set(c, 'rejected', 'Rejected.')}>Reject</button>}
          <button className="btn sm red" onClick={() => remove(c)}>Delete</button></div></td></tr>)}</tbody></table></div>
  </>
}
