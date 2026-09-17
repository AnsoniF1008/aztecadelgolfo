import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fail } from '../lib/forms'
import { resizeImage, upload, fileName, todayISO, fmtDate } from '../lib/utils'
import SpeciesPicker from '../components/SpeciesPicker'

export default function CatchNew() {
  const { user, profile, isAdmin } = useAuth(); const nav = useNavigate(); const toast = useToast()
  const [f, setF] = useState({ species: '', weightLb: '', lengthIn: '', location: '', bait: '', date: todayISO(), notes: '', eventId: '' })
  const [photo, setPhoto] = useState(null); const [preview, setPreview] = useState(null); const [err, setErr] = useState(null); const [sending, setSending] = useState(false)
  const [tournaments, setTournaments] = useState([])
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  useEffect(() => {
    const since = Timestamp.fromDate(new Date(Date.now() - 60 * 864e5))
    getDocs(query(collection(db, 'events'), where('published', '==', true), where('startsAt', '>=', since), orderBy('startsAt', 'desc')))
      .then(s => setTournaments(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => e.type === 'tournament'))).catch(() => {})
  }, [])

  const send = async e => {
    e.preventDefault(); setErr(null); setSending(true)
    try {
      if (!f.species.trim()) throw new Error('Pick the species from the list.')
      const weight = f.weightLb === '' ? null : Number(f.weightLb)
      const length = f.lengthIn === '' ? null : Number(f.lengthIn)
      if ((weight == null || Number.isNaN(weight) || weight <= 0) && (length == null || Number.isNaN(length) || length <= 0)) {
        throw new Error('Enter a weight or a length greater than zero.')
      }
      if (!f.date || f.date > todayISO()) throw new Error('Pick a catch date that is not in the future.')
      if (photo && !/^image\//.test(photo.type) && !/\.(jpe?g|png|webp)$/i.test(photo.name)) throw new Error('Use a JPG, PNG or WEBP photo.')
      let photoUrl = null, photoPath = null
      if (photo) { const b = await resizeImage(photo, 1600); ({ url: photoUrl, path: photoPath } = await upload(`catches/${user.uid}/${fileName('jpg')}`, b, 'image/jpeg')) }
      await addDoc(collection(db, 'catches'), {
        uid: user.uid, name: profile.name, species: f.species.trim(), weightLb: weight, lengthIn: length,
        location: f.location.trim() || null, bait: f.bait.trim() || null, date: f.date, year: Number(f.date.slice(0, 4)), photoUrl, photoPath,
        notes: f.notes.trim() || null, eventId: f.eventId || null, status: isAdmin ? 'approved' : 'pending', createdAt: serverTimestamp(),
      })
      toast('ok', isAdmin ? 'Catch added to the leaderboard.' : "Catch submitted. It'll show on the leaderboard once the board validates it.")
      nav('/profile')
    } catch (ex) { setErr(fail(ex, 'We could not save that catch.')); setSending(false) }
  }
  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Log a catch</h2><p>Weight in pounds and length in inches. A photo with the scale or the tape helps us validate it faster.</p></div></div>
    <form className="form" onSubmit={send}>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="field"><label htmlFor="es">Species</label>
        <SpeciesPicker id="es" value={f.species} onChange={v => setF(s => ({ ...s, species: v }))} />
        <small>Houston, Galveston Bay, nearby freshwater, and Gulf species. Type a name in English or Spanish.</small>
      </div>
      <div className="row"><div className="field"><label htmlFor="pe">Weight (lb)</label><input id="pe" type="number" step="0.1" min="0" name="weightLb" value={f.weightLb} onChange={set} /></div>
        <div className="field"><label htmlFor="la">Length (in)</label><input id="la" type="number" step="0.1" min="0" name="lengthIn" value={f.lengthIn} onChange={set} /></div></div>
      <div className="row"><div className="field"><label htmlFor="lg">Location</label><input id="lg" name="location" value={f.location} onChange={set} /></div>
        <div className="field"><label htmlFor="ca">Bait / lure</label><input id="ca" name="bait" value={f.bait} onChange={set} /></div></div>
      <div className="row"><div className="field"><label htmlFor="fe">Date</label><input id="fe" type="date" name="date" required max={todayISO()} value={f.date} onChange={set} /></div>
        <div className="field"><label htmlFor="ev">Tournament (optional)</label><select id="ev" name="eventId" value={f.eventId} onChange={set}><option value="">Not in a tournament</option>{tournaments.map(t => <option key={t.id} value={t.id}>{t.title} ({fmtDate(t.startsAt)})</option>)}</select></div></div>
      <div className="field"><label htmlFor="fo">Photo</label><input id="fo" type="file" accept="image/*" onChange={e => { const a = e.target.files[0]; setPhoto(a || null); setPreview(a ? URL.createObjectURL(a) : null) }} />{preview && <img className="preview show" src={preview} alt="" />}</div>
      <div className="field"><label htmlFor="no">Notes</label><textarea id="no" name="notes" value={f.notes} onChange={set} /></div>
      <button className="btn" disabled={sending}>{sending ? 'Sending…' : 'Submit catch'}</button>
    </form>
  </div></section>
}
