import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Guard({ children, requireActive = false, requireAdmin = false }) {
  const { user, profile, loading, isAdmin } = useAuth(); const loc = useLocation()
  if (loading) return <div className="loading">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ next: loc.pathname }} replace />
  if (requireAdmin && !isAdmin) return <section className="sec"><div className="wrap"><h1>Restricted area</h1><p>This section is for the board only.</p></div></section>
  if (requireActive && !isAdmin && profile?.status !== 'active') {
    return <Navigate to="/profile" state={{ needActive: true }} replace />
  }
  return children
}
