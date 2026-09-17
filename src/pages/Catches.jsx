import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Empty, Loading } from '../components/MediaCard'
import { fmtDate, lb, inch } from '../lib/utils'

export default function Catches() {
  const [sp] = useSearchParams(); const year = Number(sp.get('year') || new Date().getFullYear()); const species = sp.get('species') || ''
  const [list, setList] = useState(null)
  useEffect(() => {
    getDocs(query(collection(db, 'catches'), where('status', '==', 'approved'), where('year', '==', year), orderBy('weightLb', 'desc'), limit(200)))
      .then(s => setList(s.docs.map(d => ({ id: d.id, ...d.data() })))).catch(e => { console.error(e); setList([]) })
  }, [year])
  if (!list) return <Loading />
  const speciesList = Object.entries(list.reduce((a, c) => (a[c.species] = (a[c.species] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1])
  const filtered = species ? list.filter(c => c.species === species) : list
  const podium = filtered.slice(0, 3)
  const byMember = Object.values(filtered.reduce((a, c) => { a[c.uid] ||= { uid: c.uid, name: c.name, n: 0, best: 0 }; a[c.uid].n++; a[c.uid].best = Math.max(a[c.uid].best, c.weightLb || 0); return a }, {})).sort((a, b) => b.n - a.n).slice(0, 10)
  const years = [...new Set([year, new Date().getFullYear(), new Date().getFullYear() - 1])].sort((a, b) => b - a)

  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>{year} catch leaderboard</h2><p>Ranked by weight. Members log their own catches and the board validates them.</p></div><Link className="btn" to="/catches/new">Log a catch</Link></div>
    <div className="filters">
      {years.map(a => <Link key={a} className={a === year ? 'on' : ''} to={`/catches?year=${a}`}>{a}</Link>)}
      <span style={{ width: 12 }} />
      <Link className={!species ? 'on' : ''} to={`/catches?year=${year}`}>All species</Link>
      {speciesList.map(([e, n]) => <Link key={e} className={species === e ? 'on' : ''} to={`/catches?year=${year}&species=${encodeURIComponent(e)}`}>{e} ({n})</Link>)}
    </div>
    {podium.length > 0 && <div className="podium">{podium.map((c, i) => <article key={c.id}>
      <span className="n">{i + 1}</span>
      {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <div className="none" aria-hidden="true" />}
      <div className="txt"><b>{lb(c.weightLb)} · {c.species}</b>{c.name}<br /><small>{c.location} · {fmtDate(c.date)}</small></div>
    </article>)}</div>}
    {filtered.length ? <div className="table-wrap"><table className="table"><thead><tr><th></th><th></th><th>Angler</th><th>Species</th><th>Weight</th><th>Length</th><th>Location</th><th>Bait</th><th>Date</th></tr></thead>
      <tbody>{filtered.map((c, i) => <tr key={c.id}><td className="pos">{i + 1}</td><td>{c.photoUrl && <img className="mini" src={c.photoUrl} alt="" />}</td><td><Link to={`/members/${c.uid}`}>{c.name}</Link></td><td>{c.species}</td><td><b>{lb(c.weightLb)}</b></td><td>{inch(c.lengthIn)}</td><td>{c.location}</td><td>{c.bait}</td><td>{fmtDate(c.date)}</td></tr>)}</tbody></table></div>
      : <Empty>No catches logged in {year}. <Link to="/catches/new">Log yours.</Link></Empty>}
    {byMember.length > 0 && <><h2 style={{ marginTop: 48 }}>Most active members in {year}</h2>
      <div className="table-wrap"><table className="table" style={{ maxWidth: 600 }}><thead><tr><th>Member</th><th>Catches</th><th>Heaviest</th></tr></thead>
        <tbody>{byMember.map(s => <tr key={s.uid}><td><Link to={`/members/${s.uid}`}>{s.name}</Link></td><td>{s.n}</td><td>{lb(s.best || null)}</td></tr>)}</tbody></table></div></>}
  </div></section>
}
