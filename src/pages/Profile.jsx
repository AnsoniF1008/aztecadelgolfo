import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth'
import { doc, updateDoc, setDoc, deleteDoc, collection, getDocs, query, where, orderBy, collectionGroup, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Empty } from '../components/MediaCard'
import { fail, MIN_PASSWORD } from '../lib/forms'
import { fmtDate, lb, inch, fileName, dayOf, monthOf, asAvatarUrl } from '../lib/utils'
import { AvatarEdit } from './Members'

export default function Profile() {
  const { user, profile, isAdmin } = useAuth(); const toast = useToast(); const loc = useLocation()
  const [media, setMedia] = useState([]); const [catches, setCatches] = useState([]); const [events, setEvents] = useState([])
  const [f, setF] = useState({ name: '', phone: '', boat: '', bio: '' })
  const [photoBusy, setPhotoBusy] = useState(false)
  const [contact, setContact] = useState(null)
  const [pw, setPw] = useState({ current: '', next: '', next2: '' }); const [err, setErr] = useState(null)
  const [saving, setSaving] = useState(false); const [savingPw, setSavingPw] = useState(false)
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
  useEffect(() => { load().catch(() => {}) }, [user.uid])
  useEffect(() => { getDoc(doc(db, 'users', user.uid, 'private', 'contact')).then(d => setContact(d.exists() ? d.data() : {})).catch(() => setContact({})) }, [user.uid])
  useEffect(() => { if (profile) setF(v => ({ ...v, name: profile.name || '', boat: profile.boat || '', bio: profile.bio || '' })) }, [profile])
  useEffect(() => { if (contact) setF(v => ({ ...v, phone: contact.phone || '' })) }, [contact])
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  const canPost = isAdmin || profile?.status === 'active'

  const savePhoto = async (file) => {
    setErr(null)
    setPhotoBusy(true)
    try {
      const url = await asAvatarUrl(file, `profiles/${user.uid}/${fileName('jpg')}`)
      await updateDoc(doc(db, 'users', user.uid), { photo: url })
      toast('ok', 'Profile photo updated.')
    } catch (ex) { setErr(fail(ex, 'We could not save that photo.')) }
    setPhotoBusy(false)
  }
  const removePhoto = async () => {
    if (!confirm('Remove your profile photo?')) return
    setErr(null)
    setPhotoBusy(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { photo: null })
      toast('ok', 'Profile photo removed.')
    } catch (ex) { setErr(fail(ex, 'We could not remove that photo.')) }
    setPhotoBusy(false)
  }

  const save = async e => {
    e.preventDefault(); setErr(null)
    try {
      if (f.name.trim().length < 3) throw new Error('Enter a name with at least 3 letters.')
      setSaving(true)
      const data = { name: f.name.trim(), boat: f.boat.trim() || null, bio: f.bio.trim() || null }
      await updateDoc(doc(db, 'users', user.uid), data)
      await setDoc(doc(db, 'users', user.uid, 'private', 'contact'), { phone: f.phone.trim() || null }, { merge: true })
      toast('ok', 'Changes saved.')
    } catch (ex) { setErr(fail(ex, 'We could not save those changes.')) }
    setSaving(false)
  }
  const changePw = async e => {
    e.preventDefault(); setErr(null)
    if (pw.next.length < MIN_PASSWORD) return setErr(`The new password must be at least ${MIN_PASSWORD} characters.`)
    if (pw.next !== pw.next2) return setErr('The two new passwords do not match.')
    setSavingPw(true)
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pw.current))
      await updatePassword(user, pw.next); setPw({ current: '', next: '', next2: '' }); toast('ok', 'Password updated.')
    } catch (ex) { setErr(fail(ex, 'Your current password is not correct.')) }
    setSavingPw(false)
  }
  const remove = async (col, id) => { if (!confirm('Delete this? This cannot be undone.')) return; await deleteDoc(doc(db, col, id)); toast('ok', 'Deleted.'); load() }

  if (!profile) return <section className="sec"><div className="wrap"><Empty>We couldn't find your member profile. <button type="button" className="linkish" onClick={() => signOut(auth)}>Sign out</button> and apply again.</Empty></div></section>
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Hi, {profile.name.split(' ')[0]}</h2><p>Membership: <Badge s={profile.status} />{profile.status === 'pending' && ' — the board will review your application soon.'}</p></div>
      <div className="actions-row">
        {canPost && <Link className="btn sm" to="/upload">Upload</Link>}
        {canPost && <Link className="btn sm gray" to="/catches/new">Log a catch</Link>}
        <button className="btn sm gray" onClick={() => signOut(auth)}>Sign out</button>
      </div></div>
    {(profile.status === 'pending' || loc.state?.needActive) && <p className="note">Your application is still with the board. You can browse the club; posting photos and logging catches opens once you are approved.</p>}
    {err && <p className="err" role="alert">{err}</p>}

    {events.length > 0 && <><h3>Your upcoming events</h3><div className="event-list" style={{ marginBottom: 32 }}>{events.map(ev => <div key={ev.id} className="event"><div className="date"><b>{dayOf(ev.startsAt)}</b><span>{monthOf(ev.startsAt)}</span></div><div><h3>{ev.title}</h3><div className="meta">{ev.location}</div></div><Link className="btn sm gray" to={`/events/${ev.slug}`}>View</Link></div>)}</div></>}

    <h3>Your posts ({media.length})</h3>
    {media.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Views</th><th>Date</th><th></th></tr></thead>
      <tbody>{media.map(m => <tr key={m.id}><td><Link to={`/gallery/${m.id}`}>{m.title}</Link></td><td>{m.type}</td><td><Badge s={m.status} /></td><td>{m.views || 0}</td><td>{fmtDate(m.createdAt)}</td><td><button className="btn sm red" onClick={() => remove('media', m.id)}>Delete</button></td></tr>)}</tbody></table></div>
      : <Empty>{canPost ? <>You haven't posted anything yet. <Link to="/upload">Upload your first photo.</Link></> : 'Posts will live here after the board approves your membership.'}</Empty>}

    <h3 className="block-title">Your catches ({catches.length})</h3>
    {catches.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Species</th><th>Weight</th><th>Length</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>{catches.map(c => <tr key={c.id}><td>{c.species}</td><td>{lb(c.weightLb)}</td><td>{inch(c.lengthIn)}</td><td>{fmtDate(c.date)}</td><td><Badge s={c.status} /></td><td><button className="btn sm red" onClick={() => remove('catches', c.id)}>Delete</button></td></tr>)}</tbody></table></div>
      : <Empty>{canPost ? <>No catches yet. <Link to="/catches/new">Log one.</Link></> : 'Your catches will show here after you are approved.'}</Empty>}

    <div className="row stacked" style={{ marginTop: 40, alignItems: 'start' }}>
      <form className="form flush" onSubmit={save}><h3>My details</h3>
        <AvatarEdit id="profile-photo" name={f.name || profile.name} src={profile.photo || ''} busy={photoBusy} onPick={savePhoto} onRemove={removePhoto} />
        <div className="field"><label htmlFor="n">Name</label><input id="n" name="name" required minLength={3} maxLength={80} value={f.name} onChange={set} /></div>
        <div className="field"><label htmlFor="tl">Phone</label><input id="tl" type="tel" name="phone" autoComplete="tel" value={f.phone} onChange={set} /></div>
        <div className="field"><label htmlFor="bt">Boat</label><input id="bt" name="boat" maxLength={80} value={f.boat} onChange={set} /></div>
        <div className="field"><label htmlFor="bi">About me</label><textarea id="bi" name="bio" maxLength={2000} value={f.bio} onChange={set} /></div>
        <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></form>
      <form className="form flush" onSubmit={changePw}><h3>Change password</h3>
        <div className="field"><label htmlFor="a">Current password</label><input id="a" type="password" required autoComplete="current-password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} /></div>
        <div className="field"><label htmlFor="b">New password</label><input id="b" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} /><small>At least {MIN_PASSWORD} characters.</small></div>
        <div className="field"><label htmlFor="c">Repeat the new one</label><input id="c" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" value={pw.next2} onChange={e => setPw(p => ({ ...p, next2: e.target.value }))} /></div>
        <button className="btn gray" disabled={savingPw}>{savingPw ? 'Updating…' : 'Update password'}</button></form>
    </div>
  </div></section>
}
