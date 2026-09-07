import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Empty, Loading } from '../components/MediaCard'
import { fmtDate } from '../lib/utils'
export default function News() {
  const [list, setList] = useState(null)
  useEffect(() => { getDocs(query(collection(db, 'news'), where('published', '==', true), orderBy('createdAt', 'desc'), limit(50))).then(s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })))).catch(() => setList([])) }, [])
  if (!list) return <Loading />
  return <section className="sec"><div className="wrap">
    <div className="head"><h2>Club news</h2></div>
    {list.length ? <div className="cards">{list.map(n => <article key={n.id} className="card">{n.imageUrl && <Link to={`/news/${n.slug}`}><img src={n.imageUrl} alt="" /></Link>}
      <div className="cb"><time>{fmtDate(n.createdAt)}</time><h3><Link to={`/news/${n.slug}`} style={{ color: 'inherit' }}>{n.title}</Link></h3><p>{n.summary}</p></div></article>)}</div> : <Empty>No news yet.</Empty>}
  </div></section>
}
