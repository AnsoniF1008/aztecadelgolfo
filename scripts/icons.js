/**
 * Builds every icon and social-preview asset in public/ from assets/logo-1024.png.
 * The 1024px original is never shipped — it is 1.28 MB on its own.
 * Run after replacing that file:  npm run icons
 */
import sharp from 'sharp'

const SRC = 'assets/logo-1024.png'
const BLACK = '#0a0a0a' // --black, the emblem background

const png = (size, name) => sharp(SRC).resize(size, size).png({ compressionLevel: 9, effort: 10, palette: true }).toFile(`public/${name}`)
const webp = (size, name) => sharp(SRC).resize(size, size).webp({ quality: 82, effort: 6 }).toFile(`public/${name}`)

await Promise.all([
  // What the pages actually load: header 52px, footer 96px, hero min(380px,80vw) — each at 2x.
  webp(104, 'logo-104.webp'),
  webp(192, 'logo-192.webp'),
  webp(768, 'logo-768.webp'),
  // Favicons and the iOS home screen icon.
  png(16, 'favicon-16.png'),
  png(32, 'favicon-32.png'),
  png(180, 'apple-touch-icon.png'),
  // Web app manifest wants PNG at 192 and 512.
  png(192, 'logo-192.png'),
  png(512, 'logo.png'),
])

// Link preview for WhatsApp, Facebook, iMessage and X: emblem centred on club black.
const emblem = await sharp(SRC).resize(460, 460).png().toBuffer()
await sharp({ create: { width: 1200, height: 630, channels: 4, background: BLACK } })
  .composite([{ input: emblem, gravity: 'center' }])
  .png({ compressionLevel: 9, effort: 10, palette: true })
  .toFile('public/og-image.png')

console.log('Wrote public/ icons and og-image.png from', SRC)
