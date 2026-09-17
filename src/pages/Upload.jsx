import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fail } from '../lib/forms'
import { resizeImage, upload, fileName, youtubeId, todayISO } from '../lib/utils'
import SpeciesPicker from '../components/SpeciesPicker'

const MAX_PHOTO = 15
export default function Upload() {
  const { user, profile, isAdmin } = useAuth(); const nav = useNavigate(); const toast = useToast()
  const [type, setType] = useState('photo'); const [f, setF] = useState({ title: '', description: '', species: '', location: '', caughtOn: '', videoUrl: '' })
  const [file, setFile] = useState(null); const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(null); const [err, setErr] = useState(null)
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  const pick = e => { const a = e.target.files[0]; setFile(a || null); setPreview(a ? URL.createObjectURL(a) : null) }
  const busy = progress !== null

  const send = async e => {
    e.preventDefault(); setErr(null)
    try {
      if (f.title.trim().length < 3) throw new Error('Give your post a title of at least 3 characters.')
      setProgress(0)
      let url = null, path = null, thumbUrl = null, thumbPath = null, videoUrl = null
      if (type === 'photo') {
        if (!file) throw new Error('Pick a photo.')
        if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
          throw new Error('Use a JPG, PNG or WEBP photo.')
        }
        if (file.size > MAX_PHOTO * 1024 * 1024) throw new Error(`That photo is over ${MAX_PHOTO} MB.`)
        const large = await resizeImage(file, 1800)
        const base = fileName('jpg')
        ;({ url, path } = await upload(`media/${user.uid}/${base}`, large, 'image/jpeg', setProgress))
        if (!url.startsWith('data:')) {
          const small = await resizeImage(file, 600, true)
          ;({ url: thumbUrl, path: thumbPath } = await upload(`media/${user.uid}/thumb-${base}`, small, 'image/jpeg'))
        }
      } else {
        if (!youtubeId(f.videoUrl)) throw new Error('Paste a full YouTube link (youtu.be or youtube.com).')
        videoUrl = f.videoUrl.trim()
      }
      const status = isAdmin ? 'approved' : 'pending'
      const ref = await addDoc(collection(db, 'media'), {
        uid: user.uid, name: profile.name, type, url, path, thumbUrl, thumbPath, videoUrl,
        title: f.title.trim(), description: f.description.trim() || null, species: f.species.trim() || null, location: f.location.trim() || null,
        caughtOn: f.caughtOn || null, status, featured: false, views: 0, createdAt: serverTimestamp(),
      })
      toast('ok', status === 'approved' ? 'Published to the gallery.' : 'Got it. It will show in the gallery once the board approves it.')
      nav(`/gallery/${ref.id}`)
    } catch (ex) { setErr(fail(ex, 'The upload did not finish.')); setProgress(null) }
  }

  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Upload to the gallery</h2><p>Photos up to {MAX_PHOTO} MB (JPG, PNG, WEBP), or a YouTube link.</p></div></div>
    <form className="form" onSubmit={send}>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="field"><label>What are you posting?</label>
        <div className="radios">{[['photo', 'Photo'], ['youtube', 'YouTube link']].map(([v, l]) =>
          <label key={v}><input type="radio" name="type" value={v} checked={type === v} onChange={() => { setType(v); setFile(null); setPreview(null) }} /><span>{l}</span></label>)}</div>
      </div>
      {type === 'photo' && <div className="field"><label htmlFor="a">Photo</label><input id="a" type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} />{preview && <img className="preview show" src={preview} alt="" />}</div>}
      {type === 'youtube' && <div className="field"><label htmlFor="y">YouTube link</label><input id="y" type="url" name="videoUrl" value={f.videoUrl} onChange={set} placeholder="https://youtu.be/…" /></div>}
      <div className="field"><label htmlFor="t">Title</label><input id="t" name="title" value={f.title} onChange={set} required minLength={3} maxLength={160} placeholder="e.g. 22 lb red snapper off Freeport" /></div>
      <div className="row">
        <div className="field"><label htmlFor="es">Species <span className="opt">(optional)</span></label>
          <SpeciesPicker id="es" optional value={f.species} onChange={v => setF(s => ({ ...s, species: v }))} />
        </div>
        <div className="field"><label htmlFor="lg">Location <span className="opt">(optional)</span></label><input id="lg" name="location" value={f.location} onChange={set} placeholder="Galveston, Freeport, Matagorda…" /></div>
      </div>
      <div className="field"><label htmlFor="fc">Date of the catch <span className="opt">(optional)</span></label><input id="fc" type="date" name="caughtOn" value={f.caughtOn} onChange={set} max={todayISO()} /></div>
      <div className="field"><label htmlFor="d">Description <span className="opt">(optional)</span></label><textarea id="d" name="description" maxLength={4000} value={f.description} onChange={set} placeholder="How the trip went, bait, sea conditions…" /></div>
      {busy && <div className="progress show"><b style={{ width: `${progress}%` }} /></div>}
      <button className="btn" type="submit" disabled={busy}>{busy ? `Uploading… ${progress}%` : 'Publish'}</button>
    </form>
  </div></section>
}
