import { Link } from 'react-router-dom'
import { youtubeId } from '../lib/utils'
export default function MediaCard({ m }) {
  return <Link className="mcard" to={`/gallery/${m.id}`}>
    {m.type === 'photo' && <img src={m.thumbUrl || m.url} alt={m.title} loading="lazy" />}
    {m.type === 'youtube' && <><img src={`https://i.ytimg.com/vi/${youtubeId(m.videoUrl)}/hqdefault.jpg`} alt="" loading="lazy" /><span className="play">▶</span></>}
    {m.type === 'video' && <><video src={`${m.url}#t=0.5`} preload="metadata" muted playsInline /><span className="play">▶</span></>}
    <div className="mcap"><strong>{m.title}</strong><span>{m.name}{m.species ? ` · ${m.species}` : ''}</span></div>
  </Link>
}
export function MediaEmbed({ m }) {
  if (m.type === 'photo') return <img className="media-full" src={m.url} alt={m.title} />
  if (m.type === 'youtube') return <div className="yt"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId(m.videoUrl)}`} allowFullScreen title={m.title} /></div>
  return <video className="media-full" src={m.url} controls playsInline preload="metadata" />
}
export const Badge = ({ s }) => <span className={`badge ${s}`}>{s}</span>
export const Empty = ({ children }) => <div className="empty">{children}</div>
export const Loading = () => <div className="loading">Loading…</div>
