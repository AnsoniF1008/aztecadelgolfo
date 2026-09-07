import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, setDoc, addDoc, deleteDoc, collection, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useToast } from '../../context/ToastContext'
import { Loading } from '../../components/MediaCard'
import { slugify, resizeImage, upload, fileName } from '../../lib/utils'
export default function AdminNewsForm() {
  const { id } = useParams(); const isNew = id === 'new'; const nav = useNavigate(); const toast = useToast()
  const [f, setF] = useState(isNew ? { title: '', summary: '', body: '', imageUrl: null, published: true } : null); const [img, setImg] = useState(null); const [err, setErr] = useState(null)
  useEffect(() => {
    if (isNew) return
    getDoc(doc(db, 'news', id)).then(d => {
      if (!d.exists()) { toast('error', 'That article no longer exists.'); return nav('/admin/news') }
      setF(d.data())
    })
  }, [id])
  const set = e => setF(v => ({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const save = async e => {
    e.preventDefault(); setErr(null)
    try {
      if (f.title.trim().length < 3) throw new Error('The title is missing.')
      if (f.body.trim().length < 10) throw new Error('The body is missing.')
      let imageUrl = f.imageUrl || null
      if (img) { const b = await resizeImage(img, 1600); imageUrl = (await upload(`news/${fileName('jpg')}`, b, 'image/jpeg')).url }
      const data = { title: f.title.trim(), summary: (f.summary || '').trim() || f.body.trim().slice(0, 200), body: f.body.trim(), imageUrl, published: !!f.published }
      if (isNew) {
        let slug = slugify(f.title), base = slug, i = 2
        while (!(await getDocs(query(collection(db, 'news'), where('slug', '==', slug), limit(1)))).empty) slug = `${base}-${i++}`
        await addDoc(collection(db, 'news'), { ...data, slug, createdAt: serverTimestamp() })
      } else await setDoc(doc(db, 'news', id), data, { merge: true })
      toast('ok', 'Article saved.'); nav('/admin/news')
    } catch (ex) { setErr(ex.message) }
  }
  const remove = async () => { if (!confirm('Delete this article?')) return; await deleteDoc(doc(db, 'news', id)); nav('/admin/news') }
  if (!f) return <Loading />
  return <>
    <h2>{isNew ? 'New article' : 'Edit article'}</h2>
    <form className="form wide" onSubmit={save}>{err && <p className="err">{err}</p>}
      <div className="field"><label>Title</label><input name="title" required value={f.title} onChange={set} /></div>
      <div className="field"><label>Summary (optional)</label><input name="summary" maxLength={300} value={f.summary || ''} onChange={set} /></div>
      <div className="field"><label>Body</label><textarea name="body" style={{ minHeight: 300 }} value={f.body} onChange={set} /></div>
      <div className="field"><label>Image</label><input type="file" accept="image/*" onChange={e => setImg(e.target.files[0] || null)} />{f.imageUrl && !img && <img className="preview show" src={f.imageUrl} alt="" />}</div>
      <div className="field"><label><input type="checkbox" name="published" checked={!!f.published} onChange={set} /> Published</label></div>
      <div className="actions-row"><button className="btn">Save</button><Link className="btn gray" to="/admin/news">Cancel</Link>{!isNew && <button type="button" className="btn red" onClick={remove}>Delete</button>}</div>
    </form>
  </>
}
