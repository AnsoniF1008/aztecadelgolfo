import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth'
import { doc, updateDoc, setDoc, deleteDoc, collection, getDocs, query, where, orderBy, collectionGroup, getDoc } from 'firebase/firestore'
import { auth, db, getFunctionsLazy } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Empty } from '../components/MediaCard'
import { fmtDate, lb, inch, resizeImage, upload, fileName, dayOf, monthOf } from '../lib/utils'

export default function Profile() {
  const { user, profile, isAdmin } = useAuth(); const toast = useToast()
  const [media, setMedia] = useState([]); const [catches, setCatches] = useState([]); const [events, setEvents] = useState([])
  const [f, setF] = useState({ name: '', phone: '', boat: '', bio: '' }); const [photo, setPhoto] = useState(null)
  const [contact, setContact] = useState(null)
  const [pw, setPw] = useState({ current: '', next: '', next2: '' }); const [err, setErr] = useState(null)
  const load = async () => {
    const [m, c, r] = await Promise.all([
      getDocs(query(collection(db, 'media'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'catches'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'))),
      getDocs(query(collectionGroup(db, 'registrations'), where('uid', '==', user.uid))),
    ])
    setMedia(m.docs.map(d => ({ id: d.id, ...d.data() }))); setCatches(c.docs.map(d => ({ id: d.id, ...d.data() })))
    const evDocs = await Promise.all(r.docs.map(d => getDoc(d.ref.parent.parent)))
    setEvents(evDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })).filter(e => e.startsAt?.toDate() >= new Date()).sort((a, b) => a.startsAt.seconds - b.startsAt.seconds))
  }
  useEffect(() => { load().catch(console.error) }, [user.uid])
  useEffect(() => { getDoc(doc(db, 'users', user.uid, 'private', 'contact')).then(d => setContact(d.exists() ? d.data() : {})).catch(() => setContact({})) }, [user.uid])
  useEffect(() => { if (profile) setF(v => ({ ...v, name: profile.name || '', boat: profile.boat || '', bio: profile.bio || '' })) }, [profile])
  useEffect(() => { if (contact) setF(v => ({ ...v, phone: contact.phone || '' })) }, [contact])
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))

  const save = async e => {
    e.preventDefault(); setErr(null)
    try {
      if (f.name.trim().length < 3) throw new Error('That name is too short.')
      const data = { name: f.name.trim(), boat: f.boat.trim() || null, bio: f.bio.trim() || null }
      if (photo) { const b = await resizeImage(photo, 400, true); data.photo = (await upload(`profiles/${user.uid}/${fileName('jpg')}`, b, 'image/jpeg')).url }
      await updateDoc(doc(db, 'users', user.uid), data)
      await setDoc(doc(db, 'users', user.uid, 'private', 'contact'), { phone: f.phone.trim() || null }, { merge: true })
      toast('ok', 'Changes saved.')
    } catch (ex) { setErr(ex.message) }
  }
  const changePw = async e => {
    e.preventDefault(); setErr(null)
    try {
      if (pw.next.length < 8 || pw.next !== pw.next2) throw new Error('The new password must be 8+ characters and both fields must match.')
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pw.current))
      await updatePassword(user, pw.next); setPw({ current: '', next: '', next2: '' }); toast('ok', 'Password updated.')
    } catch { setErr("Your current password isn't correct.") }
  }
  const remove = async (col, id) => { if (!confirm('Delete this?')) return; await deleteDoc(doc(db, col, id)); toast('ok', 'Deleted.'); load() }
  const claimAdmin = async () => {
    try {
      const [{ httpsCallable }, fns] = await Promise.all([import('firebase/functions'), getFunctionsLazy()])
      await httpsCallable(fns, 'claimFirstAdmin')()
      toast('ok', "You're an administrator now. Reloading…"); setTimeout(() => location.reload(), 1500)
    } catch (ex) { toast('error', ex.message) }
  }

  if (!profile) return <section className="sec"><div className="wrap"><Empty>We couldn't find your member profile. <a href="#" onClick={() => signOut(auth)}>Sign out</a> and register again.</Empty></div></section>
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Hi, {profile.name.split(' ')[0]}</h2><p>Membership: <Badge s={profile.status} />{profile.status === 'pending' && ' — the board will review your application soon.'}</p></div>
      <div className="actions-row"><Link className="btn sm" to="/upload">Upload photo or video</Link><Link className="btn sm gray" to="/catches/new">Log a catch</Link><button className="btn sm gray" onClick={() => signOut(auth)}>Sign out</button></div></div>
    {err && <p className="err">{err}</p>}
    {!isAdmin && <p><small><a href="#" onClick={e => { e.preventDefault(); claimAdmin() }}>Are you the first user on this site? Claim the administrator role.</a></small></p>}

    {events.length > 0 && <><h3>Your upcoming events</h3><div className="event-list" style={{ marginBottom: 32 }}>{events.map(ev => <div key={ev.id} className="event"><div className="date"><b>{dayOf(ev.startsAt)}</b><span>{monthOf(ev.startsAt)}</span></div><div><h3 style={{ display: 'inline' }}>{ev.title}</h3><div className="meta">{ev.location}</div></div><Link className="btn sm gray" to={`/events/${ev.slug}`}>View</Link></div>)}</div></>}

    <h3>Your posts ({media.length})</h3>
    {media.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Views</th><th>Date</th><th></th></tr></thead>
      <tbody>{media.map(m => <tr key={m.id}><td><Link to={`/gallery/${m.id}`}>{m.title}</Link></td><td>{m.type}</td><td><Badge s={m.status} /></td><td>{m.views || 0}</td><td>{fmtDate(m.createdAt)}</td><td><button className="btn sm red" onClick={() => remove('media', m.id)}>Delete</button></td></tr>)}</tbody></table></div>
      : <Empty>You haven't posted anything yet. <Link to="/upload">Upload your first photo.</Link></Empty>}

    <h3 style={{ marginTop: 36 }}>Your catches ({catches.length})</h3>
    {catches.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Species</th><th>Weight</th><th>Length</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>{catches.map(c => <tr key={c.id}><td>{c.species}</td><td>{lb(c.weightLb)}</td><td>{inch(c.lengthIn)}</td><td>{fmtDate(c.date)}</td><td><Badge s={c.status} /></td><td><button className="btn sm red" onClick={() => remove('catches', c.id)}>Delete</button></td></tr>)}</tbody></table></div>
      : <Empty>No catches yet. <Link to="/catches/new">Log one.</Link></Empty>}

    <div className="row" style={{ marginTop: 40, alignItems: 'start' }}>
      <form className="form" onSubmit={save}><h3>My details</h3>
        <div className="field"><label htmlFor="n">Name</label><input id="n" name="name" required value={f.name} onChange={set} /></div>
        <div className="field"><label htmlFor="tl">Phone</label><input id="tl" type="tel" name="phone" value={f.phone} onChange={set} /></div>
        <div className="field"><label htmlFor="bt">Boat</label><input id="bt" name="boat" value={f.boat} onChange={set} /></div>
        <div className="field"><label htmlFor="bi">About me</label><textarea id="bi" name="bio" value={f.bio} onChange={set} /></div>
        <div className="field"><label htmlFor="fo">Profile photo</label><input id="fo" type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0] || null)} />{profile.photo && !photo && <img className="preview show" src={profile.photo} alt="" style={{ width: 120, borderRadius: '50%' }} />}</div>
        <button className="btn">Save changes</button></form>
      <form className="form" onSubmit={changePw}><h3>Change password</h3>
        <div className="field"><label htmlFor="a">Current password</label><input id="a" type="password" required autoComplete="current-password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} /></div>
        <div className="field"><label htmlFor="b">New</label><input id="b" type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} /></div>
        <div className="field"><label htmlFor="c">Repeat the new one</label><input id="c" type="password" required minLength={8} autoComplete="new-password" value={pw.next2} onChange={e => setPw(p => ({ ...p, next2: e.target.value }))} /></div>
        <button className="btn gray">Update password</button></form>
    </div>
  </div></section>
}
