import { useEffect, useRef, useState } from 'react'
import { filterSpecies, findSpecies } from '../lib/utils'

export default function SpeciesPicker({ id = 'es', value, onChange, optional }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const input = useRef(null)
  const selected = findSpecies(value)
  const groups = filterSpecies(q)

  useEffect(() => {
    const close = e => { if (!box.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const pick = name => { onChange(name); setQ(''); setOpen(false) }
  const clear = () => {
    onChange('')
    setQ('')
    setOpen(true)
    requestAnimationFrame(() => input.current?.focus())
  }
  const onKey = e => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key !== 'Enter') return
    e.preventDefault()
    const first = groups[0]?.items[0]
    if (first) pick(first[0])
  }

  return <div className="species-picker" ref={box}>
    {selected ? <div className="species-picked">
      <div>
        <strong>{selected.name}</strong>
        {selected.es ? <span>{selected.es}</span> : null}
      </div>
      <button type="button" className="linkish" onClick={clear}>Change</button>
    </div> : <>
      <input
        ref={input}
        id={id}
        type="search"
        autoComplete="off"
        inputMode="search"
        enterKeyHint="search"
        placeholder={optional ? 'Type to search — optional' : 'Type to search, e.g. lagarto or redfish'}
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
      />
      {open && <div id={`${id}-list`} className="species-list" role="listbox">
        {groups.length ? groups.map(g => <div key={g.label}>
          <div className="species-group">{g.label}</div>
          {g.items.map(([name, es]) => <button type="button" role="option" key={name} onClick={() => pick(name)}>
            <b>{name}</b>
            {es ? <small>{es}</small> : null}
          </button>)}
        </div>) : <p className="species-empty">No match. Try “gar”, “bagre”, or “trout”.</p>}
      </div>}
    </>}
  </div>
}
