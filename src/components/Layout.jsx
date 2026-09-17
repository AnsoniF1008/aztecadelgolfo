import { useState, Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { Loading } from './MediaCard'

export default function Layout() {
  const { user, profile, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const cls = ({ isActive }) => isActive ? 'active' : ''
  const close = () => setOpen(false)
  useEffect(() => { setOpen(false) }, [loc.pathname])
  return <>
    <header className="top">
      <Link className="brand" to="/" onClick={close}><img src="/logo-104.webp" alt="" width="52" height="52" /><span>Azteca del Golfo<small>Fishing Club</small></span></Link>
      <button className={`menu-btn${open ? ' open' : ''}`} aria-label="Menu" aria-expanded={open} onClick={e => { e.stopPropagation(); setOpen(o => !o) }}><span /><span /><span /></button>
      <nav className={`nav ${open ? 'open' : ''}`} onClick={close}>
        <NavLink className={cls} to="/gallery">Gallery</NavLink>
        <NavLink className={cls} to="/catches">Catches</NavLink>
        <NavLink className={cls} to="/events">Events</NavLink>
        <NavLink className={cls} to="/news">News</NavLink>
        <NavLink className={cls} to="/members">Members</NavLink>
        <NavLink className={cls} to="/about">The Club</NavLink>
        {user ? <>
          {(isAdmin || profile?.status === 'active') && <Link className="btn sm" to="/upload">Upload</Link>}
          <NavLink className="user" to="/profile">{(profile?.name || user.email).split(' ')[0]}</NavLink>
          {isAdmin && <Link className="admin-link" to="/admin">Admin</Link>}
          <button type="button" className="text-btn" onClick={() => signOut(auth)}>Sign out</button>
        </> : <>
          <NavLink className={cls} to="/login">Sign in</NavLink>
          <Link className="btn sm" to="/join">Apply for membership</Link>
        </>}
      </nav>
    </header>
    <main><Suspense fallback={<Loading />}><div className="page" key={loc.pathname}><Outlet /></div></Suspense></main>
    <footer className="footer">
      <div className="footer-in">
        <div><img src="/logo-192.webp" alt="" width="96" height="96" loading="lazy" decoding="async" /><p>Gulf anglers united by a love of the sea. Houston, TX.</p></div>
        <div><p><Link to="/gallery">Gallery</Link></p><p><Link to="/catches">Catch leaderboard</Link></p><p><Link to="/events">Events</Link></p><p><Link to="/about">Club rules</Link></p></div>
        <div><p><a href="mailto:info@aztecadelgolfo.com">info@aztecadelgolfo.com</a></p><p><Link to="/contact">Contact us</Link></p><p><Link to="/join">Apply for membership</Link></p></div>
      </div>
      <p className="copy">© {new Date().getFullYear()} Azteca del Golfo Fishing Club</p>
    </footer>
  </>
}
