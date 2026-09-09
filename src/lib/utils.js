import { getStorageLazy } from './firebase'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export function toDate(v) {
  if (!v) return null
  if (v.toDate) return v.toDate()
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T12:00:00')
  return new Date(v)
}
export function fmtDate(v, long = false) {
  const d = toDate(v); if (!d) return ''
  return long ? `${DAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
export function fmtTime(v) { const d = toDate(v); return d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '' }
export function dayOf(v) { const d = toDate(v); return d ? d.getDate() : '' }
export function monthOf(v) { const d = toDate(v); return d ? MONTHS[d.getMonth()] : '' }
export function slugify(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Math.random().toString(36).slice(2, 8) }
export function youtubeId(url = '') { const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : null }
export function lb(n) { return n == null ? '—' : `${Number(n).toFixed(1)} lb` }
export function inch(n) { return n == null ? '—' : `${Number(n).toFixed(1)} in` }
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const toLocalInput = (v) => { const d = toDate(v); if (!d) return ''; const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` }

/** Resizes an image in the browser (canvas) and returns a JPEG Blob. */
export function resizeImage(file, max, square = false, quality = 0.86) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width: w, height: h } = img
      const c = document.createElement('canvas'); const ctx = c.getContext('2d')
      if (square) { const s = Math.min(w, h); c.width = c.height = max; ctx.drawImage(img, (w-s)/2, (h-s)/2, s, s, 0, 0, max, max) }
      else { const r = Math.min(1, max / Math.max(w, h)); c.width = Math.round(w*r); c.height = Math.round(h*r); ctx.drawImage(img, 0, 0, c.width, c.height) }
      URL.revokeObjectURL(url)
      c.toBlob(b => b ? res(b) : rej(new Error('The image could not be processed.')), 'image/jpeg', quality)
    }
    img.onerror = () => rej(new Error('Not a valid image file.'))
    img.src = url
  })
}

/** Uploads a Blob/File to Storage with progress. Returns { url, path }. */
export async function upload(path, blob, contentType, onProgress) {
  const [{ ref, uploadBytesResumable, getDownloadURL }, storage] =
    await Promise.all([import('firebase/storage'), getStorageLazy()])
  return new Promise((res, rej) => {
    const r = ref(storage, path)
    const task = uploadBytesResumable(r, blob, { contentType })
    task.on('state_changed', s => onProgress && onProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)), rej,
      async () => res({ url: await getDownloadURL(r), path }))
  })
}
export const fileName = (ext) => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
export const SPECIES = ['Red snapper','Kingfish','Mahi-mahi','Redfish','Speckled trout','Flounder','Cobia','Amberjack','Wahoo','Tuna','Grouper','Shark','Tarpon','Jack crevalle','Sheepshead']
