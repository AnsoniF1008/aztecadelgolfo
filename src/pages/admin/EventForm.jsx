import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, setDoc, addDoc, deleteDoc, collection, getDocs, query, where, limit, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../context/ToastContext'
import { Loading } from '../../components/MediaCard'
import { fail } from '../../lib/forms'
import { slugify, toLocalInput, resizeImage, upload, fileName, fmtDate } from '../../lib/utils'

const BLANK = { title: '', type: 'trip', description: '', startsAt: '', endsAt: '', location: '', fee: '', capacity: '', imageUrl: null, published: true }
export default function AdminEventForm() {
  const { id } = useParams(); const isNew = id === 'new'; const nav = useNavigate(); const toast = useToast()
  const [f, setF] = useState(isNew ? BLANK : null); const [img, setImg] = useState(null); const [err, setErr] = useState(null); const [signups, setSignups] = useState([]); const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (isNew) return
    getDoc(doc(db, 'events', id)).then(d => {
      if (!d.exists()) { toast('error', 'That event no longer exists.'); return nav('/admin/events') }
      const x = d.data()
      setF({ ...x, startsAt: toLocalInput(x.startsAt), endsAt: toLocalInput(x.endsAt), fee: x.fee ?? '', capacity: x.capacity ?? '' })
    })
    getDocs(collection(db, 'events', id, 'registrations')).then(s => setSignups(s.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [id])
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const save = async e => {
    e.preventDefault(); setErr(null); setSaving(true)
    try {
      if (f.title.trim().length < 3) throw new Error('Enter a title of at least 3 characters.')
      if (!f.startsAt) throw new Error('Pick a start date and time.')
      if (f.endsAt && f.endsAt < f.startsAt) throw new Error('The end time has to be after the start.')
      let imageUrl = f.imageUrl || null
      if (img) { const b = await resizeImage(img, 1600); imageUrl = (await upload(`events/${fileName('jpg')}`, b, 'image/jpeg')).url }
      const data = { title: f.title.trim(), type: f.type, description: f.description.trim() || null, startsAt: Timestamp.fromDate(new Date(f.startsAt)), endsAt: f.endsAt ? Timestamp.fromDate(new Date(f.endsAt)) : null, location: f.location?.trim() || null, fee: f.fee !== '' ? Number(f.fee) : null, capacity: f.capacity !== '' ? Number(f.capacity) : null, imageUrl, published: !!f.published }
      if (isNew) {
        let slug = slugify(f.title), base = slug, i = 2
        while (!(await getDocs(query(collection(db, 'events'), where('slug', '==', slug), limit(1)))).empty) slug = `${base}-${i++}`
        await addDoc(collection(db, 'events'), { ...data, slug, registrationsCount: 0, createdAt: serverTimestamp() })
      } else await setDoc(doc(db, 'events', id), data, { merge: true })
      toast('ok', 'Event saved.'); nav('/admin/events')
    } catch (ex) { setErr(fail(ex, 'We could not save that event.')) }
    setSaving(false)
  }
  const remove = async () => { if (!confirm('Delete this event and its sign-ups?')) return; await deleteDoc(doc(db, 'events', id)); toast('ok', 'Event deleted.'); nav('/admin/events') }
  if (!f) return <Loading />
  return <>
    <h2>{isNew ? 'New event' : 'Edit event'}</h2>
    <form className="form wide" onSubmit={save}>{err && <p className="err" role="alert">{err}</p>}
      <div className="row"><div className="field"><label>Title</label><input name="title" required value={f.title} onChange={set} /></div>
        <div className="field"><label>Type</label><select name="type" value={f.type} onChange={set}><option value="tournament">Tournament</option><option value="trip">Fishing trip</option><option value="meeting">Meeting</option><option value="social">Social</option></select></div></div>
      <div className="row"><div className="field"><label>Starts</label><input type="datetime-local" name="startsAt" required value={f.startsAt} onChange={set} /></div>
        <div className="field"><label>Ends (optional)</label><input type="datetime-local" name="endsAt" value={f.endsAt} onChange={set} /></div></div>
      <div className="row"><div className="field"><label>Location</label><input name="location" value={f.location || ''} onChange={set} /></div>
        <div className="field"><label>Entry fee ($)</label><input type="number" step="0.01" min="0" name="fee" value={f.fee} onChange={set} /></div></div>
      <div className="row"><div className="field"><label>Capacity (blank = unlimited)</label><input type="number" min="1" name="capacity" value={f.capacity} onChange={set} /></div>
        <div className="field"><label>Image</label><input type="file" accept="image/*" onChange={e => setImg(e.target.files[0] || null)} />{f.imageUrl && !img && <img className="preview show" src={f.imageUrl} alt="" />}</div></div>
      <div className="field"><label>Description</label><textarea name="description" style={{ minHeight: 200 }} value={f.description || ''} onChange={set} /></div>
      <div className="field"><label><input type="checkbox" name="published" checked={!!f.published} onChange={set} /> Published (visible to everyone)</label></div>
      <div className="actions-row"><button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button><Link className="btn gray" to="/admin/events">Cancel</Link>{!isNew && <button type="button" className="btn red" onClick={remove}>Delete event</button>}</div>
    </form>
    {!isNew && <><h3 style={{ marginTop: 36 }}>Signed up ({signups.length})</h3>
      {signups.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Date</th></tr></thead><tbody>{signups.map(i => <tr key={i.id}><td><Link to={`/members/${i.id}`}>{i.name}</Link></td><td>{fmtDate(i.createdAt)}</td></tr>)}</tbody></table></div> : <p>Nobody signed up yet.</p>}</>}
  </>
}
