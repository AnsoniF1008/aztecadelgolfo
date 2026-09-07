import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const Ctx = createContext({ user: null, profile: null, loading: true, isAdmin: false, isActive: false })
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, async u => {
    setUser(u)
    if (!u) { setProfile(null); setIsAdmin(false); setLoading(false); return }
    const t = await u.getIdTokenResult(); setIsAdmin(!!t.claims.admin)
  }), [])

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid), async snap => {
      const p = snap.exists() ? { id: snap.id, ...snap.data() } : null
      setProfile(p); setLoading(false)
      // If the function synced the claim, refresh the token
      if (p?.claimsUpdatedAt) { const t = await user.getIdTokenResult(true); setIsAdmin(!!t.claims.admin) }
      if (p?.status === 'suspended') signOut(auth)
    }, () => setLoading(false))
  }, [user])

  return <Ctx.Provider value={{ user, profile, loading, isAdmin, isActive: profile?.status === 'active' }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
