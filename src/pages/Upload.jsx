import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { resizeImage, upload, fileName, youtubeId, SPECIES, todayISO } from '../lib/utils'

const MAX_PHOTO = 15, MAX_VIDEO = 250
export default function Upload() {
  const { user, profile, isAdmin } = useAuth(); const nav = useNavigate(); const toast = useToast()
  const [type, setType] = useState('photo'); const [f, setF] = useState({ title: '', description: '', species: '', location: '', caughtOn: '', videoUrl: '' })
  const [file, setFile] = useState(null); const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(null); const [err, setErr] = useState(null)
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.value }))
  const pick = e => { const a = e.target.files[0]; setFile(a || null); setPreview(a ? URL.createObjectURL(a) : null) }

  const send = async e => {
    e.preventDefault(); setErr(null)
    try {
      if (f.title.trim().length < 3) throw new Error('Give your post a title.')
      let url = null, path = null, thumbUrl = null, thumbPath = null, videoUrl = null
      if (type === 'photo') {
        if (!file) throw new Error('Pick a photo.')
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Format not allowed. Use JPG, PNG or WEBP.')
        if (file.size > MAX_PHOTO * 1024 * 1024) throw new Error(`That photo is over ${MAX_PHOTO} MB.`)
        const [large, small] = await Promise.all([resizeImage(file, 1800), resizeImage(file, 600, true)])
        const base = fileName('jpg')
        ;({ url, path } = await upload(`media/${user.uid}/${base}`, large, 'image/jpeg', setProgress))
        ;({ url: thumbUrl, path: thumbPath } = await upload(`media/${user.uid}/thumb-${base}`, small, 'image/jpeg'))
      } else if (type === 'video') {
        if (!file) throw new Error('Pick a video.')
        if (!/^video\/(mp4|quicktime|webm)$/.test(file.type)) throw new Error('Format not allowed. Use MP4, MOV or WEBM.')
        if (file.size > MAX_VIDEO * 1024 * 1024) throw new Error(`That video is over ${MAX_VIDEO} MB.`)
        const ext = file.name.split('.').pop().toLowerCase()
        ;({ url, path } = await upload(`media/${user.uid}/${fileName(ext)}`, file, file.type, setProgress))
      } else {
        if (!youtubeId(f.videoUrl)) throw new Error("That YouTube link isn't valid.")
        videoUrl = f.videoUrl.trim()
      }
      const status = isAdmin ? 'approved' : 'pending'
      const ref = await addDoc(collection(db, 'media'), {
        uid: user.uid, name: profile.name, type, url, path, thumbUrl, thumbPath, videoUrl,
        title: f.title.trim(), description: f.description.trim() || null, species: f.species.trim() || null, location: f.location.trim() || null,
        caughtOn: f.caughtOn || null, status, featured: false, views: 0, createdAt: serverTimestamp(),
      })
      toast('ok', status === 'approved' ? 'Published to the gallery.' : "Got it. The board will review it and it'll show up in the gallery once approved.")
      nav(`/gallery/${ref.id}`)
    } catch (ex) { setErr(ex.message); setProgress(null) }
  }

  return <section className="sec"><div className="wrap">
    <div className="head"><div><h2>Upload photo or video</h2><p>Photos up to {MAX_PHOTO} MB (JPG, PNG, WEBP). Videos up to {MAX_VIDEO} MB (MP4, MOV, WEBM) or a YouTube link.</p></div></div>
    <form className="form" onSubmit={send}>
      {err && <p className="err">{err}</p>}
      <div className="field"><label>What are you posting?</label>
        <div className="radios">{[['photo', 'Photo'], ['video', 'Video'], ['youtube', 'YouTube link']].map(([v, l]) =>
          <label key={v}><input type="radio" name="type" value={v} checked={type === v} onChange={() => { setType(v); setFile(null); setPreview(null) }} /><span>{l}</span></label>)}</div>
      </div>
      {type === 'photo' && <div className="field"><label htmlFor="a">Photo</label><input id="a" type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} />{preview && <img className="preview show" src={preview} alt="" />}</div>}
      {type === 'video' && <div className="field"><label htmlFor="v">Video</label><input id="v" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={pick} />{preview && <video className="preview show" src={preview} controls muted />}<small>MP4 (H.264) works best. Don't close the page while it uploads.</small></div>}
      {type === 'youtube' && <div className="field"><label htmlFor="y">YouTube link</label><input id="y" type="url" name="videoUrl" value={f.videoUrl} onChange={set} placeholder="https://youtu.be/…" /></div>}
      <div className="field"><label htmlFor="t">Title</label><input id="t" name="title" value={f.title} onChange={set} required maxLength={160} placeholder="e.g. 22 lb red snapper off Freeport" /></div>
      <div className="row">
        <div className="field"><label htmlFor="es">Species</label><input id="es" name="species" list="species-list" value={f.species} onChange={set} /><datalist id="species-list">{SPECIES.map(s => <option key={s} value={s} />)}</datalist></div>
        <div className="field"><label htmlFor="lg">Location</label><input id="lg" name="location" value={f.location} onChange={set} placeholder="Galveston, Freeport, Matagorda…" /></div>
      </div>
      <div className="field"><label htmlFor="fc">Date of the catch</label><input id="fc" type="date" name="caughtOn" value={f.caughtOn} onChange={set} max={todayISO()} /></div>
      <div className="field"><label htmlFor="d">Description</label><textarea id="d" name="description" value={f.description} onChange={set} placeholder="How the trip went, bait, sea conditions…" /></div>
      {progress !== null && <div className="progress" style={{ display: 'block' }}><b style={{ width: `${progress}%` }} /></div>}
      <button className="btn" type="submit" disabled={progress !== null} style={{ marginTop: 12 }}>{progress !== null ? `Uploading… ${progress}%` : 'Publish'}</button>
    </form>
  </div></section>
}
