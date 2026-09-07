import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { Loading } from '../components/MediaCard'
import { fmtDate } from '../lib/utils'
export default function NewsPost() {
  const { slug } = useParams(); const { isAdmin } = useAuth(); const [n, setN] = useState(undefined)
  useEffect(() => { getDocs(query(collection(db, 'news'), where('slug', '==', slug), where('published', '==', true), limit(1))).then(s => setN(s.empty ? null : { id: s.docs[0].id, ...s.docs[0].data() })).catch(() => setN(null)) }, [slug])
  if (n === undefined) return <Loading />
  if (!n) return <section className="sec"><div className="wrap"><h1>Article not found.</h1><Link to="/news">News</Link></div></section>
  return <section className="sec"><div className="wrap">
    <p><Link to="/news">← News</Link></p>
    <article className="prose"><time style={{ color: 'var(--ink-2)' }}>{fmtDate(n.createdAt, true)}</time><h1>{n.title}</h1>
      {n.imageUrl && <img src={n.imageUrl} alt="" style={{ borderRadius: 6, margin: '0 0 24px' }} />}
      <div style={{ whiteSpace: 'pre-line' }}>{n.body}</div>
      {isAdmin && <p style={{ marginTop: 24 }}><Link to={`/admin/news/${n.id}`}>Edit</Link></p>}
    </article>
  </div></section>
}
