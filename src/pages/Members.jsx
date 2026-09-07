import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Loading } from '../components/MediaCard'
export const Avatar = ({ s }) => s.photo ? <img src={s.photo} alt="" /> : <div className="av">{(s.name || '?')[0].toUpperCase()}</div>
export default function Members() {
  const [list, setList] = useState(null)
  useEffect(() => { getDocs(query(collection(db, 'users'), where('status', '==', 'active'), orderBy('name'))).then(s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.role === 'admin') - (a.role === 'admin')))).catch(() => setList([])) }, [])
  if (!list) return <Loading />
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Club members</h2><p>{list.length} active members.</p></div><Link className="btn" to="/join">Apply for membership</Link></div>
    <div className="cards">{list.map(s => <Link key={s.id} className="card member" to={`/members/${s.id}`} style={{ color: 'inherit' }}>
      <Avatar s={s} /><h3>{s.name}</h3>{s.role === 'admin' && <span className="badge admin">Board</span>}{s.boat && <><br /><small>{s.boat}</small></>}
    </Link>)}</div>
  </div></section>
}
