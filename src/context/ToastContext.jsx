import { createContext, useCallback, useContext, useState } from 'react'
const Ctx = createContext(() => {})
export function ToastProvider({ children }) {
  const [list, setList] = useState([])
  const toast = useCallback((kind, msg) => {
    const id = Date.now() + Math.random()
    setList(l => [...l, { id, kind, msg }])
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 5000)
  }, [])
  return <Ctx.Provider value={toast}>{children}
    <div className="toasts" aria-live="polite">{list.map(t => <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>)}</div>
  </Ctx.Provider>
}
export const useToast = () => useContext(Ctx)
