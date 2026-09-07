import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import MediaCard, { Empty, Loading } from '../components/MediaCard'
import { Avatar } from './Members'
import { fmtDate, lb, inch } from '../lib/utils'
export default function MemberProfile() {
  const { id } = useParams(); const [s, setS] = useState(undefined); const [media, setMedia] = useState([]); const [catches, setCatches] = useState([])
  useEffect(() => {
    getDoc(doc(db, 'users', id)).then(async d => {
      if (!d.exists() || d.data().status !== 'active') return setS(null)
      setS({ id: d.id, ...d.data() })
      const [m, c] = await Promise.all([
        getDocs(query(collection(db, 'media'), where('status', '==', 'approved'), where('uid', '==', id), orderBy('createdAt', 'desc'), limit(24))),
        getDocs(query(collection(db, 'catches'), where('status', '==', 'approved'), where('uid', '==', id), orderBy('createdAt', 'desc'), limit(50))),
      ])
      setMedia(m.docs.map(x => ({ id: x.id, ...x.data() })))
      setCatches(c.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => (b.weightLb || 0) - (a.weightLb || 0)).slice(0, 10))
    }).catch(() => setS(null))
  }, [id])
  if (s === undefined) return <Loading />
  if (!s) return <section className="sec"><div className="wrap"><h1>Member not found.</h1><Link to="/members">See members</Link></div></section>
  return <section className="sec"><div className="wrap">
    <div className="detail" style={{ gridTemplateColumns: '260px 1fr' }}>
      <aside className="facts member"><Avatar s={s} /><h3>{s.name}</h3>{s.role === 'admin' && <span className="badge admin">Board</span>}
        {s.boat && <p style={{ marginTop: 8 }}><small>Boat: {s.boat}</small></p>}<p><small>Member since {fmtDate(s.createdAt)}</small></p>
        {s.bio && <p style={{ textAlign: 'left', whiteSpace: 'pre-line' }}>{s.bio}</p>}</aside>
      <div>
        <h2>Posts</h2>{media.length ? <div className="grid">{media.map(m => <MediaCard key={m.id} m={m} />)}</div> : <Empty>No posts yet.</Empty>}
        <h2 style={{ marginTop: 40 }}>Best catches</h2>
        {catches.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Species</th><th>Weight</th><th>Length</th><th>Location</th><th>Date</th></tr></thead><tbody>{catches.map(c => <tr key={c.id}><td>{c.species}</td><td><b>{lb(c.weightLb)}</b></td><td>{inch(c.lengthIn)}</td><td>{c.location}</td><td>{fmtDate(c.date)}</td></tr>)}</tbody></table></div> : <Empty>No catches logged.</Empty>}
      </div>
    </div>
  </div></section>
}
