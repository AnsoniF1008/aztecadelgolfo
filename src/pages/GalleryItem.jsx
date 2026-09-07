import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, deleteDoc, increment, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import MediaCard, { MediaEmbed, Badge, Loading } from '../components/MediaCard'
import { fmtDate } from '../lib/utils'

export default function GalleryItem() {
  const { id } = useParams(); const nav = useNavigate(); const toast = useToast()
  const { user, isAdmin } = useAuth()
  const [m, setM] = useState(undefined); const [more, setMore] = useState([])
  useEffect(() => {
    getDoc(doc(db, 'media', id)).then(async s => {
      if (!s.exists()) return setM(null)
      const d = { id: s.id, ...s.data() }; setM(d)
      if (d.status === 'approved') updateDoc(s.ref, { views: increment(1) }).catch(() => {})
      const o = await getDocs(query(collection(db, 'media'), where('status', '==', 'approved'), where('uid', '==', d.uid), orderBy('createdAt', 'desc'), limit(5)))
      setMore(o.docs.map(x => ({ id: x.id, ...x.data() })).filter(x => x.id !== d.id).slice(0, 4))
    }).catch(() => setM(null))
  }, [id])
  const remove = async () => { if (!confirm('Delete this post?')) return; await deleteDoc(doc(db, 'media', id)); toast('ok', 'Post deleted.'); nav('/gallery') }

  if (m === undefined) return <Loading />
  if (m === null) return <section className="sec"><div className="wrap"><h1>This post isn't available.</h1><Link to="/gallery">Back to the gallery</Link></div></section>
  const canEdit = user && (user.uid === m.uid || isAdmin)
  return <section className="sec"><div className="wrap">
    <p><Link to="/gallery">← Back to the gallery</Link></p>
    <div className="detail">
      <div>
        <MediaEmbed m={m} />
        <h1 style={{ fontSize: '2rem', marginTop: 20 }}>{m.title}</h1>
        {m.status !== 'approved' && <p><Badge s={m.status} /> Only you (and the board) can see this post until it's approved.</p>}
        {m.description && <p className="prose" style={{ whiteSpace: 'pre-line' }}>{m.description}</p>}
      </div>
      <aside className="facts">
        <dl>
          <dt>Member</dt><dd><Link to={`/members/${m.uid}`}>{m.name}</Link></dd>
          {m.species && <><dt>Species</dt><dd>{m.species}</dd></>}
          {m.location && <><dt>Location</dt><dd>{m.location}</dd></>}
          {m.caughtOn && <><dt>Caught on</dt><dd>{fmtDate(m.caughtOn)}</dd></>}
          <dt>Posted</dt><dd>{fmtDate(m.createdAt)}</dd>
          <dt>Views</dt><dd>{(m.views || 0) + 1}</dd>
        </dl>
        {canEdit && <button className="btn sm red" style={{ marginTop: 16 }} onClick={remove}>Delete</button>}
      </aside>
    </div>
    {more.length > 0 && <><h2 style={{ marginTop: 48 }}>More from {m.name}</h2><div className="grid">{more.map(x => <MediaCard key={x.id} m={x} />)}</div></>}
  </div></section>
}
