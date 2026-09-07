import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, profile, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const cls = ({ isActive }) => isActive ? 'active' : ''
  const close = () => setOpen(false)
  return <>
    <header className="top">
      <Link className="brand" to="/" onClick={close}><img src="/logo.png" alt="" width="52" height="52" /><span>Azteca del Golfo<small>Fishing Club</small></span></Link>
      <button className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>☰</button>
      <nav className={`nav ${open ? 'open' : ''}`} onClick={close}>
        <NavLink className={cls} to="/gallery">Gallery</NavLink>
        <NavLink className={cls} to="/catches">Catches</NavLink>
        <NavLink className={cls} to="/events">Tournaments & Trips</NavLink>
        <NavLink className={cls} to="/news">News</NavLink>
        <NavLink className={cls} to="/members">Members</NavLink>
        <NavLink className={cls} to="/about">The Club</NavLink>
        {user ? <>
          <Link className="btn sm" to="/upload">Upload photo or video</Link>
          <NavLink className="user" to="/profile">{(profile?.name || user.email).split(' ')[0]}</NavLink>
          {isAdmin && <Link className="admin-link" to="/admin">Admin</Link>}
          <a href="#" onClick={e => { e.preventDefault(); signOut(auth) }}>Sign out</a>
        </> : <>
          <NavLink className={cls} to="/login">Sign in</NavLink>
          <Link className="btn sm" to="/join">Become a member</Link>
        </>}
      </nav>
    </header>
    <main><Outlet /></main>
    <footer className="footer">
      <div className="footer-in">
        <div><img src="/logo.png" alt="" width="96" height="96" /><p>Gulf anglers united by a love of the sea. Houston, TX.</p></div>
        <div><p><Link to="/gallery">Gallery</Link></p><p><Link to="/catches">Catch leaderboard</Link></p><p><Link to="/events">Tournaments & trips</Link></p><p><Link to="/about">Club rules</Link></p></div>
        <div><p><a href="mailto:info@aztecadelgolfo.com">info@aztecadelgolfo.com</a></p><p><Link to="/contact">Contact us</Link></p><p><Link to="/join">Apply for membership</Link></p></div>
      </div>
      <p className="copy">© {new Date().getFullYear()} Azteca del Golfo Fishing Club</p>
    </footer>
  </>
}
