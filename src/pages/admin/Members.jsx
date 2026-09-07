import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Badge, Empty } from '../../components/MediaCard'
import { fmtDate } from '../../lib/utils'
const FILTERS = [['pending', 'Applications'], ['active', 'Active'], ['suspended', 'Suspended'], ['all', 'All']]
export default function AdminMembers() {
  const [sp] = useSearchParams(); const status = sp.get('status') || 'pending'; const toast = useToast(); const { user } = useAuth(); const [list, setList] = useState([])
  useEffect(() => {
    const parts = [collection(db, 'users')]; if (status !== 'all') parts.push(where('status', '==', status)); parts.push(orderBy('createdAt', 'desc'))
    return onSnapshot(query(...parts), s => setList(s.docs.map(d => ({ id: d.id, ...d.data() }))), console.error)
  }, [status])
  const act = async (s, changes, msg) => { await updateDoc(doc(db, 'users', s.id), changes); toast('ok', msg) }
  return <>
    <h2>Members</h2>
    <div className="filters">{FILTERS.map(([k, l]) => <Link key={k} className={status === k ? 'on' : ''} to={`/admin/members?status=${k}`}>{l}</Link>)}</div>
    {!list.length && <Empty>Nothing in this list.</Empty>}
    <div className="table-wrap"><table className="table"><thead><tr><th>Member</th><th>Contact</th><th>Applied</th><th>Status</th><th></th></tr></thead>
      <tbody>{list.map(s => <tr key={s.id}>
        <td><b>{s.name}</b> {s.role === 'admin' && <span className="badge admin">admin</span>}{s.boat && <><br /><small>{s.boat}</small></>}{s.bio && <><br /><small style={{ color: 'var(--ink-2)' }}>{s.bio.slice(0, 120)}</small></>}</td>
        <td><a href={`mailto:${s.email}`}>{s.email}</a><br /><small>{s.phone}</small></td>
        <td>{fmtDate(s.createdAt)}</td><td><Badge s={s.status} /></td>
        <td>{s.id === user.uid ? <small>You</small> : <div className="actions-row">
          {s.status !== 'active' && <button className="btn sm green" onClick={() => act(s, { status: 'active' }, 'Member activated.')}>Activate</button>}
          {s.status !== 'suspended' && <button className="btn sm gray" onClick={() => act(s, { status: 'suspended' }, 'Account suspended.')}>Suspend</button>}
          <button className="btn sm gray" onClick={() => act(s, { role: s.role === 'admin' ? 'member' : 'admin' }, 'Role updated.')}>{s.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
        </div>}</td></tr>)}</tbody></table></div>
    <p style={{ marginTop: 16 }}><small>To delete an account entirely, use the Firebase console (Authentication) and remove its document from <code>users</code>.</small></p>
  </>
}
