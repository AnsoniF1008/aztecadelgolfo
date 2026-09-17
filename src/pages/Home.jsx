import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import MediaCard, { Empty } from '../components/MediaCard'
import { dayOf, monthOf, fmtTime, fmtDate, lb } from '../lib/utils'

export default function Home() {
  const [d, setD] = useState({ media: [], events: [], top: [], news: [] })
  useEffect(() => {
    (async () => {
      const year = new Date().getFullYear()
      const [m, e, t, n] = await Promise.all([
        getDocs(query(collection(db, 'media'), where('status', '==', 'approved'), orderBy('featured', 'desc'), orderBy('createdAt', 'desc'), limit(8))),
        getDocs(query(collection(db, 'events'), where('published', '==', true), where('startsAt', '>=', Timestamp.now()), orderBy('startsAt'), limit(3))),
        getDocs(query(collection(db, 'catches'), where('status', '==', 'approved'), where('year', '==', year), orderBy('weightLb', 'desc'), limit(5))),
        getDocs(query(collection(db, 'news'), where('published', '==', true), orderBy('createdAt', 'desc'), limit(3))),
      ])
      const map = s => s.docs.map(x => ({ id: x.id, ...x.data() }))
      setD({ media: map(m), events: map(e), top: map(t), news: map(n) })
    })().catch(console.error)
  }, [])

  return <>
    <section className="hero">
      <div className="hero-sea" aria-hidden="true" />
      <div className="hero-in">
      <div>
        <h1>Gulf anglers, united by the sea.</h1>
        <p>Azteca del Golfo Fishing Club brings together everyone who heads out on the water every weekend: tournaments, group trips, a catch leaderboard and a gallery where every trip is on the record.</p>
        <div className="actions"><Link className="btn" to="/gallery">See the gallery</Link><Link className="btn outline" to="/join">Apply for membership</Link></div>
      </div>
      <div className="emblem-wrap">
        <span className="emblem-ring" aria-hidden="true" />
        <img className="emblem" src="/logo-768.webp" alt="Club emblem: Aztec sun on a black field" width="380" height="380" />
      </div>
    </div></section>

    <section className="sec"><div className="wrap">
      <div className="head"><h2>Latest from the water</h2><Link className="btn sm gray" to="/gallery">The whole gallery</Link></div>
      {d.media.length ? <div className="grid">{d.media.map(m => <MediaCard key={m.id} m={m} />)}</div>
        : <Empty>No photos published yet. They’ll show up here after the next trip.</Empty>}
    </div></section>

    <section className="sec dark"><div className="wrap">
      <div className="head"><h2>Upcoming trips and tournaments</h2><Link className="btn sm outline" to="/events">Full calendar</Link></div>
      {d.events.length ? <div className="event-list">{d.events.map(ev =>
        <div key={ev.id} className="event on-dark">
          <div className="date"><b>{dayOf(ev.startsAt)}</b><span>{monthOf(ev.startsAt)}</span></div>
          <div><span className={`type ${ev.type}`}>{ev.type}</span><h3>{ev.title}</h3><div className="meta">{ev.location} · {fmtTime(ev.startsAt)}</div></div>
          <Link className="btn sm" to={`/events/${ev.slug}`}>Details</Link>
        </div>)}</div> : <p style={{ opacity: .8 }}>No events on the calendar right now.</p>}
    </div></section>

    <section className="sec"><div className="wrap">
      <div className="head"><h2>{new Date().getFullYear()} leaderboard — the heaviest catches</h2><Link className="btn sm gray" to="/catches">Full leaderboard</Link></div>
      {d.top.length ? <div className="table-wrap"><table className="table"><thead><tr><th></th><th>Angler</th><th>Species</th><th>Weight</th><th>Location</th><th>Date</th></tr></thead>
        <tbody>{d.top.map((c, i) => <tr key={c.id}><td className="pos">{i + 1}</td><td>{c.name}</td><td>{c.species}</td><td><b>{lb(c.weightLb)}</b></td><td>{c.location}</td><td>{fmtDate(c.date)}</td></tr>)}</tbody></table></div>
        : <Empty>This year's leaderboard is empty. The board will post catches after they are validated.</Empty>}
    </div></section>

    {d.news.length > 0 && <section className="sec" style={{ paddingTop: 0 }}><div className="wrap">
      <div className="head"><h2>Club news</h2><Link className="btn sm gray" to="/news">All news</Link></div>
      <div className="cards">{d.news.map(n => <article key={n.id} className="card">
        {n.imageUrl && <Link to={`/news/${n.slug}`}><img src={n.imageUrl} alt="" /></Link>}
        <div className="cb"><time>{fmtDate(n.createdAt)}</time><h3><Link to={`/news/${n.slug}`} style={{ color: 'inherit' }}>{n.title}</Link></h3><p>{n.summary}</p></div></article>)}</div>
    </div></section>}

    <section className="sec gulf"><div className="wrap cta-band">
      <div><h2>Fish the Gulf? This is your club.</h2><p>Annual membership, monthly trips, club tournaments with prizes, and a community that shares spots, baits and techniques.</p></div>
      <Link className="btn" to="/join">Apply for membership</Link>
    </div></section>
  </>
}
