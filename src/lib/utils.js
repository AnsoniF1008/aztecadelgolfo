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
export const todayISO = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
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

const VIDEO_STORAGE_MSG = 'Video files need Cloud Storage, which is off until billing is on. Post a YouTube link instead.'
const IMAGE_TOO_BIG = 'That photo is still too large after compressing. Try a smaller one.'
// Firestore docs cap at 1 MB. Leave headroom for title, captions, and other fields.
const DATA_URL_MAX = 450_000
let storageReady = null

function blobToDataUrl(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = () => rej(new Error('The image could not be read.'))
    r.readAsDataURL(blob)
  })
}

async function fitDataUrl(blob, onProgress) {
  let current = blob
  let max = 1280
  let quality = 0.78
  for (let i = 0; i < 6; i++) {
    const url = await blobToDataUrl(current)
    if (typeof url === 'string' && url.length <= DATA_URL_MAX) return url
    onProgress?.(Math.min(90, 25 + i * 12))
    current = await resizeImage(current, max, false, quality)
    max = Math.max(480, Math.round(max * 0.72))
    quality = Math.max(0.52, quality - 0.08)
  }
  const url = await blobToDataUrl(current)
  if (typeof url !== 'string' || url.length > DATA_URL_MAX) throw new Error(IMAGE_TOO_BIG)
  return url
}

async function probeStorage() {
  if (storageReady != null) return storageReady
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    storageReady = true
    return true
  }
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  if (!bucket) {
    storageReady = false
    return false
  }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o`, { signal: ctrl.signal })
    clearTimeout(t)
    storageReady = r.status !== 404
  } catch {
    storageReady = false
  }
  return storageReady
}

function uploadToStorage(path, blob, contentType, onProgress) {
  return Promise.all([import('firebase/storage'), getStorageLazy()]).then(([{ ref, uploadBytesResumable, getDownloadURL }, storage]) =>
    new Promise((res, rej) => {
      const r = ref(storage, path)
      const task = uploadBytesResumable(r, blob, { contentType })
      const t = setTimeout(() => {
        task.cancel()
        rej(Object.assign(new Error('Storage did not respond.'), { code: 'storage/timeout' }))
      }, 12000)
      task.on(
        'state_changed',
        s => onProgress && s.totalBytes && onProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)),
        err => { clearTimeout(t); rej(err) },
        async () => {
          clearTimeout(t)
          res({ url: await getDownloadURL(r), path })
        },
      )
    }),
  )
}

function explainUpload(err) {
  const code = err?.code || ''
  if (code === 'storage/unauthorized') return 'You do not have permission to upload that file.'
  if (code === 'storage/canceled' || code === 'storage/timeout') return 'The upload stalled. Try again.'
  return err?.message || 'The file could not be uploaded.'
}

/** Uploads a Blob/File. Uses Storage when the bucket exists; otherwise stores a compressed data URL (Spark / no bucket). */
export async function upload(path, blob, contentType, onProgress) {
  const type = contentType || blob?.type || ''
  const isImage = type.startsWith('image/')
  if (await probeStorage()) {
    try {
      return await uploadToStorage(path, blob, type || contentType, onProgress)
    } catch (err) {
      storageReady = false
      if (!isImage) throw new Error(type.startsWith('video/') ? VIDEO_STORAGE_MSG : explainUpload(err))
    }
  }
  if (!isImage) throw new Error(type.startsWith('video/') ? VIDEO_STORAGE_MSG : 'That file type needs Cloud Storage, which is not on yet.')
  onProgress?.(15)
  const url = await fitDataUrl(blob, onProgress)
  onProgress?.(100)
  return { url, path }
}
export const fileName = (ext) => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

const PHOTO_OK = /^(image\/(jpeg|jpg|pjpeg|png|webp|heic|heif))$/i
export function isPhotoFile(file) {
  if (!file) return false
  if (PHOTO_OK.test(file.type) || /^image\//.test(file.type)) return true
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '')
}

/** Square JPEG data URL / Storage URL small enough for a Firestore profile field. */
export async function asAvatarUrl(file, path, onProgress) {
  if (!file) throw new Error('Pick a photo.')
  if (!isPhotoFile(file)) throw new Error('Use a JPG, PNG or WEBP photo.')
  if (file.size > 12 * 1024 * 1024) throw new Error('That photo is over 12 MB.')
  const b = await resizeImage(file, 320, true, 0.74)
  return (await upload(path, b, 'image/jpeg', onProgress)).url
}
export const SPECIES_GROUPS = [
  {
    label: 'Gar and primitive fish',
    items: [
      ['Alligator Gar', 'pez lagarto'],
      ['Longnose Gar', 'pez lagarto trompa de hueso'],
      ['Spotted Gar', 'pez lagarto pintado'],
      ['Shortnose Gar', 'pez lagarto de hocico corto'],
      ['Bowfin', ''],
    ],
  },
  {
    label: 'Catfish',
    items: [
      ['Blue Catfish', 'bagre azul'],
      ['Channel Catfish', 'bagre de canal'],
      ['Flathead Catfish', 'bagre cabeza plana'],
      ['Hardhead Catfish', 'bagre de mar'],
      ['Gafftopsail Catfish', 'bagre bandera'],
    ],
  },
  {
    label: 'Bass',
    items: [
      ['Largemouth Bass', 'lobina negra'],
      ['Spotted Bass', 'lobina pintada'],
      ['White Bass', 'lobina blanca'],
      ['Striped Bass', 'lobina rayada'],
      ['Hybrid Striped Bass', 'lobina híbrida'],
    ],
  },
  {
    label: 'Galveston Bay and coast',
    items: [
      ['Redfish', 'corvina roja'],
      ['Speckled Trout', 'trucha pintada'],
      ['Flounder', 'lenguado'],
      ['Black Drum', 'corvina negra'],
      ['Sheepshead', 'sargo'],
      ['Spanish Mackerel', 'sierra'],
      ['Jack Crevalle', 'jurel'],
    ],
  },
  {
    label: 'Sunfish and crappie',
    items: [
      ['Bluegill', 'agalla azul'],
      ['Black Crappie', 'crappie negra'],
      ['White Crappie', 'crappie blanca'],
      ['Redear Sunfish', 'mojarra oreja roja'],
      ['Longear Sunfish', 'mojarra oreja larga'],
      ['Warmouth', ''],
    ],
  },
  {
    label: 'Carp and other freshwater',
    items: [
      ['Common Carp', 'carpa común'],
      ['Grass Carp', 'carpa herbívora'],
      ['Smallmouth Buffalo', 'pez búfalo'],
      ['American Eel', 'anguila americana'],
    ],
  },
  {
    label: 'Gulf / offshore',
    items: [
      ['Red Snapper', 'huachinango'],
      ['Kingfish', 'sierra king'],
      ['Mahi-mahi', 'dorado'],
      ['Cobia', ''],
      ['Amberjack', ''],
      ['Wahoo', ''],
      ['Tuna', 'atún'],
      ['Grouper', 'mero'],
      ['Shark', 'tiburón'],
      ['Tarpon', 'sábalo'],
    ],
  },
]
export const SPECIES = SPECIES_GROUPS.flatMap(g => g.items.map(([name]) => name))

export function speciesLabel(name, es) {
  return es ? `${name} (${es})` : name
}

export function findSpecies(value) {
  if (!value) return null
  for (const g of SPECIES_GROUPS) {
    for (const [name, es] of g.items) {
      if (name === value) return { name, es, group: g.label }
    }
  }
  return null
}

export function filterSpecies(query) {
  const n = query.trim().toLowerCase()
  return SPECIES_GROUPS.map(g => ({
    label: g.label,
    items: n
      ? g.items.filter(([name, es]) => name.toLowerCase().includes(n) || (es && es.toLowerCase().includes(n)))
      : g.items,
  })).filter(g => g.items.length)
}
