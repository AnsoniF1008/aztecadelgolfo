import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import MediaCard, { Empty, Loading } from '../components/MediaCard'

const PER_PAGE = 24
export default function Gallery() {
  const { isAdmin, isActive } = useAuth()
  const canPost = isAdmin || isActive
  const [sp] = useSearchParams(); const type = sp.get('type') || ''; const species = sp.get('species') || ''
  const [items, setItems] = useState([]); const [last, setLast] = useState(null); const [done, setDone] = useState(false); const [loading, setLoading] = useState(true)
  const [speciesList, setSpeciesList] = useState([])

  const build = (cursor) => {
    const cond = [where('status', '==', 'approved')]
    if (type === 'photo') cond.push(where('type', '==', 'photo'))
    if (type === 'video') cond.push(where('type', 'in', ['video', 'youtube']))
    if (species) cond.push(where('species', '==', species))
    const parts = [collection(db, 'media'), ...cond, orderBy('createdAt', 'desc'), limit(PER_PAGE)]
    if (cursor) parts.push(startAfter(cursor))
    return query(...parts)
  }
  useEffect(() => {
    setLoading(true); setItems([]); setDone(false)
    getDocs(build(null)).then(s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLast(s.docs.at(-1) || null); setDone(s.size < PER_PAGE); setLoading(false) }).catch(e => { console.error(e); setLoading(false) })
  }, [type, species])
  useEffect(() => {
    getDocs(query(collection(db, 'media'), where('status', '==', 'approved'), limit(500))).then(s => {
      const c = {}; s.docs.forEach(d => { const e = d.data().species; if (e) c[e] = (c[e] || 0) + 1 })
      setSpeciesList(Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12))
    })
  }, [])
  const more = async () => { const s = await getDocs(build(last)); setItems(i => [...i, ...s.docs.map(d => ({ id: d.id, ...d.data() }))]); setLast(s.docs.at(-1) || null); setDone(s.size < PER_PAGE) }

  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Club gallery</h2><p>Photos and videos from our members. Every post is reviewed before it shows up here.</p></div>{canPost && <Link className="btn" to="/upload">Upload</Link>}</div>
    <div className="filters">
      <Link className={!type && !species ? 'on' : ''} to="/gallery">Everything</Link>
      <Link className={type === 'photo' ? 'on' : ''} to="/gallery?type=photo">Photos</Link>
      <Link className={type === 'video' ? 'on' : ''} to="/gallery?type=video">Videos</Link>
      {speciesList.map(([e, n]) => <Link key={e} className={species === e ? 'on' : ''} to={`/gallery?species=${encodeURIComponent(e)}`}>{e} ({n})</Link>)}
    </div>
    {loading ? <Loading /> : items.length ? <div className="grid">{items.map(m => <MediaCard key={m.id} m={m} />)}</div> : <Empty>{canPost ? <>Nothing here yet. <Link to="/upload">Be the first to post.</Link></> : 'Nothing here yet. Check back after the next trip.'}</Empty>}
    {!done && !loading && <p className="pager-wrap"><button className="btn gray" onClick={() => more().catch(() => {})}>Load more</button></p>}
  </div></section>
}
