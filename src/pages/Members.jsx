import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Loading } from '../components/MediaCard'

export function Avatar({ s }) {
  const [broken, setBroken] = useState(false)
  const letter = (s.name || '?')[0].toUpperCase()
  if (!s.photo || broken) return <div className="av">{letter}</div>
  return <img src={s.photo} alt="" onError={() => setBroken(true)} />
}

export function AvatarEdit({ id = 'avatar-file', name, src, busy, onPick, onRemove }) {
  const letter = (name || '?')[0].toUpperCase()
  return <div className="avatar-edit">
    <label className={'avatar-pick' + (busy ? ' busy' : '')} htmlFor={id}>
      {src ? <img src={src} alt="" /> : <div className="av" aria-hidden="true">{letter}</div>}
      <span className="hint">{busy ? 'Saving…' : src ? 'Change photo' : 'Add photo'}</span>
    </label>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={busy} onChange={e => {
      const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(f)
    }} />
    {src && onRemove && <button type="button" className="linkish" onClick={onRemove} disabled={busy}>Remove photo</button>}
    <small>JPG, PNG or WEBP. This is what other members see.</small>
  </div>
}

export default function Members() {
  const [list, setList] = useState(null)
  useEffect(() => { getDocs(query(collection(db, 'users'), where('status', '==', 'active'), orderBy('name'))).then(s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.role === 'admin') - (a.role === 'admin')))).catch(() => setList([])) }, [])
  if (!list) return <Loading />
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Club members</h2><p>{list.length} active members.</p></div><Link className="btn" to="/join">Apply for membership</Link></div>
    <div className="cards">{list.map(s => <Link key={s.id} className="card member" to={`/members/${s.id}`} style={{ color: 'inherit' }}>
      <Avatar s={s} /><h3>{s.name}</h3>{s.role === 'admin' && <span className="badge board">Board</span>}{s.boat && <><br /><small>{s.boat}</small></>}
    </Link>)}</div>
  </div></section>
}
