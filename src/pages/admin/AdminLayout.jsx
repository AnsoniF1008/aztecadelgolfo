import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
export default function AdminLayout() {
  const [p, setP] = useState({ media: 0, catches: 0, users: 0, messages: 0 })
  useEffect(() => {
    const subs = [
      onSnapshot(query(collection(db, 'media'), where('status', '==', 'pending')), s => setP(x => ({ ...x, media: s.size }))),
      onSnapshot(query(collection(db, 'catches'), where('status', '==', 'pending')), s => setP(x => ({ ...x, catches: s.size }))),
      onSnapshot(query(collection(db, 'users'), where('status', '==', 'pending')), s => setP(x => ({ ...x, users: s.size }))),
      onSnapshot(query(collection(db, 'messages'), where('read', '==', false)), s => setP(x => ({ ...x, messages: s.size }))),
    ]; return () => subs.forEach(u => u())
  }, [])
  const n = k => p[k] ? ` (${p[k]})` : ''
  const cls = ({ isActive }) => isActive ? 'on' : ''
  return <div className="admin-shell">
    <aside>
      <NavLink end className={cls} to="/admin">Overview</NavLink>
      <NavLink className={cls} to="/admin/media">Gallery{n('media')}</NavLink>
      <NavLink className={cls} to="/admin/catches">Catches{n('catches')}</NavLink>
      <NavLink className={cls} to="/admin/events">Events</NavLink>
      <NavLink className={cls} to="/admin/news">News</NavLink>
      <NavLink className={cls} to="/admin/members">Members{n('users')}</NavLink>
      <NavLink className={cls} to="/admin/messages">Messages{n('messages')}</NavLink>
    </aside>
    <section><Outlet context={p} /></section>
  </div>
}
