import { useState, useMemo, useRef, useEffect } from 'react'
import { Grid3X3, LayoutGrid, Layers } from 'lucide-react'
import Tooltip from './ui/Tooltip'
import CustomSelect from './ui/CustomSelect'

const ZONE_COLORS = { stage_front: '#A855F7', vip_area: '#B8860B', floor: '#2563EB', bar: '#E85D04', custom: '#64748b' }
const RECT_COLORS = ['#6d28d9', '#1e3a8a', '#991b1b', '#14532d']
const ZONE_OPTIONS = ['stage_front', 'vip', 'floor', 'bar', 'custom']
const ZONE_LABELS = { stage_front: 'קדמת במה', vip: 'VIP', floor: 'רחבת ריקודים', bar: 'בר', custom: 'מותאם' }
const TABLE_COLORS = ['#A855F7', '#2563EB', '#E85D04', '#00C37A', '#B8860B', '#64748b']

const getPos = (e) => {
  if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

const randOffset = () => (Math.random() - 0.5) * 8

export default function SeatingBuilder({ eventId, initialConfig, onSave, onCancel }) {
  const [enabled, setEnabled] = useState(!!initialConfig?.enabled)
  const [templateType, setTemplateType] = useState(initialConfig?.template_type || null)
  const [rows, setRows] = useState(initialConfig?.rows ?? 5)
  const [seatsPerRow, setSeatsPerRow] = useState(initialConfig?.seats_per_row ?? 10)
  const [customRows, setCustomRows] = useState(initialConfig?.custom_rows || [])
  const [useCustomRows, setUseCustomRows] = useState(!!initialConfig?.custom_rows?.length)
  const [stageLabel, setStageLabel] = useState(initialConfig?.stage_label || 'במה')
  const [priceRegular, setPriceRegular] = useState(initialConfig?.price_regular ?? 80)
  const [priceVip, setPriceVip] = useState(initialConfig?.price_vip ?? 150)
  const [blockedSeats, setBlockedSeats] = useState(new Set(initialConfig?.blocked_seats || []))
  const [vipSeats, setVipSeats] = useState(new Set(initialConfig?.vip_seats || []))
  const [zones, setZones] = useState(initialConfig?.zones || [])
  const [clubTables, setClubTables] = useState(initialConfig?.club_tables || [])
  const [clubRects, setClubRects] = useState(initialConfig?.club_rects || [])
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [selectedElement, setSelectedElement] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef(null)

  const [theaterShape, setTheaterShape] = useState(initialConfig?.shape || 'straight')
  const [theaterWings, setTheaterWings] = useState(!!initialConfig?.wings)
  const [wingSeatsCount, setWingSeatsCount] = useState(initialConfig?.wing_seats_count ?? 5)
  const [wingPrice, setWingPrice] = useState(initialConfig?.wing_price ?? 100)
  const [balcony, setBalcony] = useState(!!initialConfig?.balcony)
  const [balconyRows, setBalconyRows] = useState(initialConfig?.balcony_rows ?? 2)
  const [balconySeatsPerRow, setBalconySeatsPerRow] = useState(initialConfig?.balcony_seats_per_row ?? 10)
  const [balconyPrice, setBalconyPrice] = useState(initialConfig?.balcony_price ?? 120)
  const [rowOverrides, setRowOverrides] = useState(initialConfig?.row_overrides || {})
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  const [editPanelOpen, setEditPanelOpen] = useState(false)
  const [tableShape, setTableShape] = useState('circle')
  const [resizing, setResizing] = useState(null)
  const [rotating, setRotating] = useState(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pushHistory = (state) => {
    const newHist = history.slice(0, historyIndex + 1)
    newHist.push(JSON.parse(JSON.stringify(state)))
    if (newHist.length > 20) newHist.shift()
    setHistory(newHist)
    setHistoryIndex(newHist.length - 1)
  }

  const undo = () => {
    if (historyIndex <= 0) return
    const idx = historyIndex - 1
    setHistoryIndex(idx)
    const s = history[idx]
    if (templateType === 'club') {
      setClubTables(s.clubTables || [])
      setClubRects(s.clubRects || [])
    } else {
      setRows(s.rows ?? rows)
      setSeatsPerRow(s.seatsPerRow ?? seatsPerRow)
      setCustomRows(s.customRows || [])
      setBlockedSeats(new Set(s.blockedSeats || []))
      setVipSeats(new Set(s.vipSeats || []))
    }
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    const idx = historyIndex + 1
    setHistoryIndex(idx)
    const s = history[idx]
    if (templateType === 'club') {
      setClubTables(s.clubTables || [])
      setClubRects(s.clubRects || [])
    } else {
      setRows(s.rows ?? rows)
      setSeatsPerRow(s.seatsPerRow ?? seatsPerRow)
      setCustomRows(s.customRows || [])
      setBlockedSeats(new Set(s.blockedSeats || []))
      setVipSeats(new Set(s.vipSeats || []))
    }
  }

  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo() }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [historyIndex, history])

  const updateElement = (type, id, upd) => {
    if (type === 'table') {
      setClubTables(prev => prev.map((t, i) => t.seat_key === id || i === id ? { ...t, ...upd } : t))
    } else {
      setClubRects(prev => prev.map((r, i) => r.id === id || i === id ? { ...r, ...upd } : r))
    }
  }

  const handleDragStart = (e, type, id) => {
    e.preventDefault()
    const pos = getPos(e)
    setDragging({ type, id, startX: pos.x, startY: pos.y })
  }

  const handleDragMove = (e) => {
    if (resizing || rotating) { handleResizeRotateMove(e); return }
    if (!dragging) return
    e.preventDefault()
    const pos = getPos(e)
    const canvas = canvasRef.current?.getBoundingClientRect()
    if (!canvas) return
    const x = ((pos.x - canvas.left) / canvas.width) * 100
    const y = ((pos.y - canvas.top) / canvas.height) * 80
    let nx = Math.max(0, Math.min(95, x))
    let ny = Math.max(0, Math.min(75, y))
    if (snapToGrid) {
      nx = Math.round(nx / 5) * 5
      ny = Math.round(ny / 5) * 5
    }
    if (dragging.type === 'table') {
      setClubTables(prev => prev.map((t, i) => (t.seat_key === dragging.id || i === dragging.id) ? { ...t, position_x: nx, position_y: ny } : t))
    } else {
      setClubRects(prev => prev.map((r, i) => (r.id === dragging.id || i === dragging.id) ? { ...r, position_x: nx, position_y: ny } : r))
    }
  }

  const handleDragEnd = () => { setDragging(null); setResizing(null); setRotating(null) }

  const getElementBounds = (type, id) => {
    if (type === 'rect') {
      const r = clubRects.find(x => x.id === id)
      if (!r) return null
      const x = r.position_x ?? 10
      const y = r.position_y ?? 2
      const w = r.width ?? 80
      const h = r.height ?? 12
      return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 }
    }
    const t = clubTables[id]
    if (!t) return null
    const shape = t.shape || 'circle'
    const cx = t.position_x ?? 50
    const cy = t.position_y ?? 40
    const baseSize = 4
    const w = t.width ?? (shape === 'rectangle' ? baseSize * 2 * 1.8 : baseSize * 2)
    const h = t.height ?? baseSize * 2
    if (shape === 'circle') {
      const r = Math.min(w, h) / 2
      return { x: cx - r, y: cy - r, w: r * 2, h: r * 2, cx, cy }
    }
    return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy }
  }

  const handleResizeStart = (e, type, id, handle) => {
    e.stopPropagation()
    const pos = getPos(e)
    const b = getElementBounds(type, id)
    if (!b) return
    if (type === 'rect') {
      setResizing({ type, id, handle, startX: pos.x, startY: pos.y, startW: b.w, startH: b.h, startX0: b.x, startY0: b.y })
    } else {
      setResizing({ type, id, handle, startX: pos.x, startY: pos.y, startW: b.w, startH: b.h })
    }
  }

  const handleRotateStart = (e, type, id) => {
    e.stopPropagation()
    const b = getElementBounds(type, id)
    if (!b) return
    setRotating({ type, id, centerX: b.cx, centerY: b.cy })
  }

  const handleResizeRotateMove = (e) => {
    if (resizing) {
      e.preventDefault()
      const pos = getPos(e)
      const canvas = canvasRef.current?.getBoundingClientRect()
      if (!canvas) return
      const scaleX = 100 / canvas.width
      const scaleY = 80 / canvas.height
      const dx = (pos.x - resizing.startX) * scaleX
      const dy = (pos.y - resizing.startY) * scaleY
      const { handle, startW, startH, startX0, startY0 } = resizing
      let nw = startW, nh = startH, nx = resizing.startX0, ny = resizing.startY0
      if (handle.includes('e')) nw = Math.max(5, startW + dx)
      if (handle.includes('w')) { nw = Math.max(5, startW - dx); nx = startX0 + (startW - nw) }
      if (handle.includes('s')) nh = Math.max(5, startH + dy)
      if (handle.includes('n')) { nh = Math.max(5, startH - dy); ny = startY0 + (startH - nh) }
      if (resizing.type === 'rect') {
        setClubRects(prev => prev.map(r => r.id === resizing.id ? { ...r, position_x: nx, position_y: ny, width: nw, height: nh } : r))
      } else {
        setClubTables(prev => prev.map((t, i) => i === resizing.id ? { ...t, width: nw, height: nh } : t))
      }
    }
    if (rotating) {
      e.preventDefault()
      const pos = getPos(e)
      const canvas = canvasRef.current?.getBoundingClientRect()
      if (!canvas) return
      const scaleY = 80 / canvas.height
      const cyScreen = canvas.top + (rotating.centerY / 80) * canvas.height
      const cxScreen = canvas.left + (rotating.centerX / 100) * canvas.width
      const angle = Math.atan2(pos.y - cyScreen, pos.x - cxScreen)
      const deg = angle * 180 / Math.PI
      if (rotating.type === 'rect') {
        setClubRects(prev => prev.map(r => r.id === rotating.id ? { ...r, rotation: deg } : r))
      } else {
        setClubTables(prev => prev.map((t, i) => i === rotating.id ? { ...t, rotation: deg } : t))
      }
    }
  }

  const theaterSeats = useMemo(() => {
    const rowCounts = useCustomRows && customRows.length > 0 ? customRows : Array(rows).fill(seatsPerRow)
    const out = []
    rowCounts.forEach((count, ri) => {
      const actualCount = typeof count === 'number' ? count : (rowOverrides[ri + 1]?.seats ?? seatsPerRow)
      for (let si = 0; si < actualCount; si++) {
        const seatKey = `r${ri + 1}s${si + 1}`
        const isBlocked = blockedSeats.has(seatKey)
        const isVip = vipSeats.has(seatKey)
        const rowPrice = rowOverrides[ri + 1]?.price ?? (isVip ? priceVip : priceRegular)
        const rowStatus = rowOverrides[ri + 1]?.status
        out.push({
          seat_key: seatKey,
          row_number: ri + 1,
          seat_number: si + 1,
          seat_type: isVip ? 'vip' : 'regular',
          status: rowStatus === 'blocked' ? 'blocked' : rowStatus === 'vip' ? 'vip' : isBlocked ? 'blocked' : 'available',
          price: rowStatus === 'vip' ? priceVip : rowPrice,
          metadata: { stage_label: stageLabel },
        })
      }
    })
    return out
  }, [rows, seatsPerRow, useCustomRows, customRows, blockedSeats, vipSeats, priceRegular, priceVip, stageLabel, rowOverrides])

  const cycleSeatStatus = (seatKey) => {
    const st = getSeatStatus(seatKey)
    if (st === 'available') setBlockedSeats(prev => new Set([...prev, seatKey]))
    else if (st === 'blocked') {
      setBlockedSeats(prev => { const n = new Set(prev); n.delete(seatKey); return n })
      setVipSeats(prev => new Set([...prev, seatKey]))
    } else setVipSeats(prev => { const n = new Set(prev); n.delete(seatKey); return n })
  }

  const getSeatStatus = (seatKey) => {
    if (blockedSeats.has(seatKey)) return 'blocked'
    if (vipSeats.has(seatKey)) return 'vip'
    return 'available'
  }

  const handleSave = async () => {
    if (!eventId && onSave) { onSave(buildConfig()); return }
    if (!eventId) return
    setSaving(true)
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
      const config = buildConfig()
      const body = { template_type: config.template_type, seats: config.seats, zones: config.zones }
      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/seating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('שגיאה בשמירה')
      onSave?.(await res.json())
    } catch (e) { throw e } finally { setSaving(false) }
  }

  const buildConfig = () => {
    if (templateType === 'theater' || templateType === 'mixed') {
      const seats = theaterSeats.filter(s => s.status !== 'blocked').map(s => ({
        seat_key: s.seat_key, row_number: s.row_number, seat_number: s.seat_number,
        seat_type: s.seat_type, status: s.status, price: s.price, metadata: s.metadata,
      }))
      return {
        enabled, template_type: templateType, seats, zones: [],
        stage_label: stageLabel, shape: theaterShape,
        wings: theaterWings, wing_seats_count: wingSeatsCount, wing_price: wingPrice,
        balcony, balcony_rows: balconyRows, balcony_seats_per_row: balconySeatsPerRow, balcony_price: balconyPrice,
        row_overrides: rowOverrides,
      }
    }
    if (templateType === 'club') {
      const seats = clubTables.map((t, i) => ({
        seat_key: t.seat_key || `table-${i + 1}`,
        zone: t.zone || 'floor',
        zone_label: t.zone_label || t.zone,
        capacity: t.capacity ?? 4,
        price: t.price ?? 0,
        position_x: t.position_x ?? 20 + (i % 5) * 15,
        position_y: t.position_y ?? 25 + Math.floor(i / 5) * 15,
        label: t.label || `שולחן ${i + 1}`,
        color: t.color,
        metadata: { included: t.included, shape: t.shape || 'circle' },
      }))
      return { enabled, template_type: 'club', seats, zones: clubRects, club_rects: clubRects }
    }
    return { enabled, template_type: templateType, seats: [], zones: [] }
  }

  const addTable = () => {
    const cx = 50 + randOffset()
    const cy = 40 + randOffset()
    const baseSize = 4
    const w = tableShape === 'rectangle' ? baseSize * 2 * 1.8 : baseSize * 2
    const h = baseSize * 2
    const newTable = { seat_key: `table-${clubTables.length + clubRects.length + 1}`, zone: 'floor', capacity: 4, price: 0, position_x: cx, position_y: cy, label: `שולחן ${clubTables.length + 1}`, shape: tableShape, width: w, height: h }
    const newTables = [...clubTables, newTable]
    pushHistory({ clubTables: newTables, clubRects })
    setClubTables(newTables)
    setSelectedElement({ type: 'table', id: newTables.length - 1 })
    setEditPanelOpen(true)
  }

  const addRect = (kind) => {
    const cx = 50 + randOffset()
    const cy = kind === 'stage' ? 8 : kind === 'bar' ? 70 : 30 + randOffset()
    const labels = { stage: 'STAGE', dj: 'DJ BOOTH', vip: 'VIP', bar: 'BAR' }
    const sizes = { stage: { w: 60, h: 12 }, dj: { w: 25, h: 10 }, vip: { w: 40, h: 20 }, bar: { w: 50, h: 8 } }
    const s = sizes[kind]
    const rect = {
      id: `rect-${Date.now()}`,
      kind,
      text: labels[kind],
      position_x: cx - s.w / 2,
      position_y: cy,
      width: s.w,
      height: s.h,
      color: RECT_COLORS[kind === 'stage' ? 0 : kind === 'dj' ? 1 : kind === 'vip' ? 2 : 3],
    }
    const newRects = [...clubRects, rect]
    pushHistory({ clubTables, clubRects: newRects })
    setClubRects(newRects)
    setSelectedElement({ type: 'rect', id: rect.id })
    setEditPanelOpen(true)
  }

  const duplicateElement = () => {
    if (!selectedElement) return
    if (selectedElement.type === 'table') {
      const t = clubTables[selectedElement.id]
      if (!t) return
      const clone = { ...t, seat_key: `table-${Date.now()}`, label: `${t.label} (עותק)`, position_x: (t.position_x ?? 50) + 5, position_y: (t.position_y ?? 40) + 5 }
      const newTables = [...clubTables, clone]
      pushHistory({ clubTables: newTables, clubRects })
      setClubTables(newTables)
      setSelectedElement({ type: 'table', id: newTables.length - 1 })
    } else {
      const r = clubRects.find(x => x.id === selectedElement.id)
      if (!r) return
      const clone = { ...r, id: `rect-${Date.now()}`, text: `${r.text || ''} (עותק)`, position_x: (r.position_x ?? 10) + 5, position_y: (r.position_y ?? 2) + 5 }
      const newRects = [...clubRects, clone]
      pushHistory({ clubTables, clubRects: newRects })
      setClubRects(newRects)
      setSelectedElement({ type: 'rect', id: clone.id })
    }
  }

  const deleteElement = () => {
    if (!selectedElement) return
    if (selectedElement.type === 'table') {
      const newTables = clubTables.filter((_, i) => i !== selectedElement.id)
      pushHistory({ clubTables: newTables, clubRects })
      setClubTables(newTables)
    } else {
      const newRects = clubRects.filter(r => r.id !== selectedElement.id)
      pushHistory({ clubTables, clubRects: newRects })
      setClubRects(newRects)
    }
    setSelectedElement(null)
    setEditPanelOpen(false)
  }

  const saveState = () => {
    if (templateType === 'club') pushHistory({ clubTables: [...clubTables], clubRects: [...clubRects] })
    else pushHistory({ rows, seatsPerRow, customRows, blockedSeats: [...blockedSeats], vipSeats: [...vipSeats] })
  }

  if (!enabled) {
    return (
      <div dir="rtl" style={{ padding: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <span>הוסף מפת ישיבה</span>
        </label>
        <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>סמן כדי להוסיף בחירת מקום לאירוע</p>
      </div>
    )
  }

  const toolbar = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <button onClick={undo} disabled={historyIndex <= 0} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer' }}>↩ Undo</button>
      <button onClick={redo} disabled={historyIndex >= history.length - 1} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer' }}>↪ Redo</button>
      {!isMobile && (
        <>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>🔍+</button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>🔍−</button>
          <button onClick={() => setZoom(1)} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>📐 Fit</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
            <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} />
            <span style={{ fontSize: 14 }}>נעץ לרשת</span>
          </label>
        </>
      )}
      <button onClick={saveState} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>💾 שמור טיוטה</button>
    </div>
  )

  const mobileToolbar = isMobile ? (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <button onClick={addTable} style={{ padding: '8px 12px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ שולחן</button>
      <button onClick={() => addRect('stage')} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>+ במה</button>
      <button onClick={undo} disabled={historyIndex <= 0} style={{ padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: 'pointer' }}>↩</button>
      <button onClick={handleSave} disabled={saving} style={{ padding: '8px 12px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>שמור</button>
    </div>
  ) : null

  return (
    <div dir="rtl" style={{ padding: 24 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <span>הוסף מפת ישיבה</span>
      </label>

      {templateType === null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { key: 'theater', Icon: Grid3X3, title: 'תיאטרון', desc: 'שורות וכיסאות ממוספרים' },
            { key: 'club', Icon: LayoutGrid, title: 'מועדון/מסיבה', desc: 'שולחנות ואזורים' },
            { key: 'mixed', Icon: Layers, title: 'מעורב', desc: 'תיאטרון + שולחנות VIP' },
          ].map(t => (
            <button key={t.key} onClick={() => setTemplateType(t.key)} style={{ padding: 24, background: 'var(--v2-dark-3)', border: '2px solid var(--glass-border)', borderRadius: 16, color: '#fff', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ marginBottom: 8 }}><t.Icon size={32} /></div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      )}

      {templateType && (
        <>
          <button onClick={() => setTemplateType(null)} style={{ marginBottom: 16, padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: 'pointer' }}>← בחר תבנית אחרת</button>

          {isMobile && templateType === 'club' && mobileToolbar}

          {!isMobile && toolbar}

          {(templateType === 'theater' || templateType === 'mixed') && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>צורת אולם</label>
                  <CustomSelect
                    value={theaterShape}
                    onChange={(val) => setTheaterShape(val)}
                    style={{ padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                    options={[
                      { value: 'straight', label: 'ישר' },
                      { value: 'curved', label: 'קמור' },
                      { value: 'fan', label: 'מניפה' },
                      { value: 'u', label: 'U-shape' },
                      { value: 'square', label: 'מרובע' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>כמה שורות?</label>
                  <input type="number" min={1} value={rows} onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))} placeholder="מספר שורות" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>כיסאות בשורה?</label>
                  <input type="number" min={1} value={seatsPerRow} onChange={e => setSeatsPerRow(Math.max(1, parseInt(e.target.value) || 1))} placeholder="כיסאות בשורה" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={useCustomRows} onChange={e => setUseCustomRows(e.target.checked)} />
                  שורות בגדלים שונים?
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" checked={theaterWings} onChange={e => setTheaterWings(e.target.checked)} />
                הוסף אגפים
              </label>
              {theaterWings && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>כיסאות באגף</label>
                    <input type="number" min={1} value={wingSeatsCount} onChange={e => setWingSeatsCount(Math.max(1, parseInt(e.target.value) || 1))} placeholder="כיסאות באגף" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>מחיר אגף ₪</label>
                    <input type="number" min={0} value={wingPrice} onChange={e => setWingPrice(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                  </div>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" checked={balcony} onChange={e => setBalcony(e.target.checked)} />
                הוסף יציע
              </label>
              {balcony && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>שורות יציע</label>
                    <input type="number" min={1} value={balconyRows} onChange={e => setBalconyRows(Math.max(1, parseInt(e.target.value) || 1))} placeholder="שורות יציע" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>כיסאות בשורה</label>
                    <input type="number" min={1} value={balconySeatsPerRow} onChange={e => setBalconySeatsPerRow(Math.max(1, parseInt(e.target.value) || 1))} placeholder="כיסאות בשורה" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>מחיר יציע ₪</label>
                    <input type="number" min={0} value={balconyPrice} onChange={e => setBalconyPrice(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>טקסט במה</label>
                <input value={stageLabel} onChange={e => setStageLabel(e.target.value)} placeholder="במה / STAGE" style={{ width: 200, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>מחיר רגיל ₪</label>
                  <input type="number" min={0} value={priceRegular} onChange={e => setPriceRegular(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>מחיר VIP ₪</label>
                  <input type="number" min={0} value={priceVip} onChange={e => setPriceVip(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 12 }}>לחץ על כיסא: חסום ↔ VIP ↔ רגיל</p>
              <div style={{ background: '#0a0a0a', borderRadius: 12, padding: 16, overflow: 'auto', maxHeight: 300, border: '1px solid rgba(0,195,122,0.3)' }}>
                <svg viewBox="0 0 100 80" width="100%" height="auto" style={{ maxHeight: 280, transform: `scale(${zoom})` }} preserveAspectRatio="xMidYMid meet">
                  {balcony && (() => {
                    const rowSpacing = 3.5
                    const mainTop = 60 - (rows - 1) * rowSpacing
                    const balcY = Math.max(2, mainTop - balconyRows * rowSpacing - 3)
                    const balcH = balconyRows * rowSpacing + 2
                    return (
                      <>
                        <rect x={28} y={balcY} width={44} height={balcH} rx="2" fill="#B8860B" opacity={0.8} />
                        <text x={50} y={balcY + balcH / 2 + 0.5} textAnchor="middle" fontSize="2" fill="#333">יציע</text>
                      </>
                    )
                  })()}
                  {theaterWings && (
                    <>
                      <rect x={2} y={12} width={12} height={50} rx="2" fill="var(--v2-primary)" opacity={0.7} transform="rotate(-15 8 37)" />
                      <text x={6} y={40} textAnchor="middle" fontSize="1.8" fill="#fff" transform="rotate(-15 6 40)">אגף שמאל</text>
                      <rect x={86} y={12} width={12} height={50} rx="2" fill="var(--v2-primary)" opacity={0.7} transform="rotate(15 92 37)" />
                      <text x={94} y={40} textAnchor="middle" fontSize="1.8" fill="#fff" transform="rotate(15 94 40)">אגף ימין</text>
                    </>
                  )}
                  <rect x="5" y={balcony ? 70 : 68} width="90" height="8" rx="4" fill="#1a1a2e" />
                  <text x="50" y={(balcony ? 70 : 68) + 5} textAnchor="middle" fontSize="3" fill="#888">{stageLabel}</text>
                  {theaterSeats.reduce((acc, s) => {
                    const rn = s.row_number, sn = s.seat_number
                    const rowCounts = useCustomRows && customRows.length > 0 ? customRows : Array(rows).fill(seatsPerRow)
                    const count = rowCounts[rn - 1] ?? seatsPerRow
                    const actualCount = rowOverrides[rn]?.seats ?? count
                    const totalW = (actualCount - 1) * 2.5
                    const x = 50 - totalW / 2 + (sn - 1) * 2.5
                    const y = 60 - (rn - 1) * 3.5
                    const st = getSeatStatus(s.seat_key)
                    const fill = st === 'blocked' ? '#333' : st === 'vip' ? '#2a1a3a' : '#1a2e1a'
                    const stroke = st === 'blocked' ? '#333' : st === 'vip' ? '#A855F7' : '#00C37A'
                    return [...acc, (<circle key={s.seat_key} cx={x} cy={y} r={1} fill={fill} stroke={stroke} strokeWidth="0.3" style={{ cursor: 'pointer' }} onClick={() => cycleSeatStatus(s.seat_key)} />)]
                  }, [])}
                </svg>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 12, color: 'var(--v2-gray-400)' }}>
                <span>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#00C37A', marginLeft: 4 }} />
                  פנוי
                </span>
                <span>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#A855F7', marginLeft: 4 }} />
                  VIP
                </span>
                <span>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#444', marginLeft: 4 }} />
                  חסום
                </span>
                <span>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#2563EB', marginLeft: 4 }} />
                  נמכר
                </span>
              </div>
            </div>
          )}

          {templateType === 'club' && (
            <div style={{ marginBottom: 24 }}>
              {!isMobile && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>צורת שולחן:</span>
                    {['circle', 'square', 'rectangle'].map(sh => (
                      <button key={sh} onClick={() => setTableShape(sh)} style={{ padding: '8px 16px', borderRadius: 8, border: tableShape === sh ? '2px solid var(--v2-primary)' : '1px solid var(--glass-border)', background: tableShape === sh ? 'rgba(0,195,122,0.1)' : 'var(--v2-dark-3)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                        {sh === 'circle' ? '⭕ עיגול' : sh === 'square' ? '⬜ ריבוע' : '▬ מלבן'}
                      </button>
                    ))}
                  </div>
                  <button onClick={addTable} style={{ padding: '10px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ שולחן</button>
                  <button onClick={() => addRect('stage')} style={{ padding: '10px 16px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>+ במה</button>
                  <button onClick={() => addRect('dj')} style={{ padding: '10px 16px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>+ DJ Booth</button>
                  <button onClick={() => addRect('vip')} style={{ padding: '10px 16px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>+ אזור VIP</button>
                  <button onClick={() => addRect('bar')} style={{ padding: '10px 16px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>+ בר</button>
                </div>
              )}
              <div
                ref={canvasRef}
                style={{ marginTop: 16, height: 400, background: snapToGrid ? 'radial-gradient(circle, var(--glass-border) 1px, transparent 1px)' : '#0a0a0a', backgroundSize: snapToGrid ? '5% 5%' : undefined, borderRadius: 12, position: 'relative', touchAction: 'none' }}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              >
                <svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                  {clubRects.map((r, i) => {
                    const rx = r.position_x ?? 10
                    const ry = r.position_y ?? 2
                    const rw = r.width ?? 80
                    const rh = r.height ?? 12
                    const rcx = rx + rw / 2
                    const rcy = ry + rh / 2
                    return (
                    <g key={r.id} transform={`translate(${rcx},${rcy}) rotate(${r.rotation || 0}) translate(${-rcx},${-rcy})`}>
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        rx="4"
                        fill={r.color || RECT_COLORS[0]}
                        stroke={selectedElement?.type === 'rect' && selectedElement?.id === r.id ? '#00C37A' : 'transparent'}
                        strokeWidth="1"
                        style={{ cursor: 'move' }}
                        onMouseDown={e => { handleDragStart(e, 'rect', r.id); setSelectedElement({ type: 'rect', id: r.id }) }}
                        onTouchStart={e => { handleDragStart(e, 'rect', r.id); setSelectedElement({ type: 'rect', id: r.id }) }}
                        onClick={() => { setSelectedElement({ type: 'rect', id: r.id }); setEditPanelOpen(true) }}
                      />
                      <text x={rcx} y={rcy + 1} textAnchor="middle" fontSize="2.5" fill="#fff">{r.text || 'STAGE'}</text>
                    </g>
                    )
                  })}
                  {selectedElement && (() => {
                    const type = selectedElement.type
                    const id = selectedElement.id
                    const b = getElementBounds(type, id)
                    if (!b) return null
                    const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
                    const hp = (h) => {
                      const cx = h.includes('e') ? b.x + b.w : h.includes('w') ? b.x : b.x + b.w / 2
                      const cy = h.includes('s') ? b.y + b.h : h.includes('n') ? b.y : b.y + b.h / 2
                      return { cx, cy }
                    }
                    return (
                      <g key="handles">
                        {handles.map(h => (
                          <circle key={h} cx={hp(h).cx} cy={hp(h).cy} r={1.5} fill="white" stroke="var(--v2-primary)" strokeWidth="0.5" style={{ cursor: 'nwse-resize', pointerEvents: 'all' }} onMouseDown={e => handleResizeStart(e, type, id, h)} onTouchStart={e => handleResizeStart(e, type, id, h)} />
                        ))}
                        <circle cx={b.cx} cy={b.y - 4} r={1.5} fill="white" stroke="var(--v2-primary)" strokeWidth="0.5" style={{ cursor: 'grab', pointerEvents: 'all' }} onMouseDown={e => handleRotateStart(e, type, id)} onTouchStart={e => handleRotateStart(e, type, id)} />
                      </g>
                    )
                  })()}
                  {clubTables.map((t, i) => {
                    const shape = t.shape || 'circle'
                    const cx = t.position_x ?? 50
                    const cy = t.position_y ?? 40
                    const r = 4
                    const fill = t.color || ZONE_COLORS[t.zone] || '#2563EB'
                    const stroke = selectedElement?.type === 'table' && selectedElement?.id === i ? '#00C37A' : '#444'
                    const dragProps = {
                      style: { cursor: 'move' },
                      onMouseDown: e => { handleDragStart(e, 'table', i); setSelectedElement({ type: 'table', id: i }) },
                      onTouchStart: e => { handleDragStart(e, 'table', i); setSelectedElement({ type: 'table', id: i }) },
                      onClick: () => { setSelectedElement({ type: 'table', id: i }); setEditPanelOpen(true) },
                    }
                    const rCircle = shape === 'circle' ? (Math.min(t.width ?? 8, t.height ?? 8) / 2) : 4
                    if (shape === 'circle') {
                      return (
                        <g key={i} transform={`rotate(${t.rotation || 0} ${cx} ${cy})`}>
                          <circle cx={cx} cy={cy} r={rCircle} fill={fill} stroke={stroke} strokeWidth="1" {...dragProps}>
                            <title>{t.label} — עד {t.capacity ?? 4}</title>
                          </circle>
                        </g>
                      )
                    }
                    const w = t.width ?? (shape === 'square' ? 8 : 14.4)
                    const h = t.height ?? 8
                    return (
                      <g key={i} transform={`rotate(${t.rotation || 0} ${cx} ${cy})`}>
                        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="1" fill={fill} stroke={stroke} strokeWidth="1" {...dragProps}>
                          <title>{t.label} — עד {t.capacity ?? 4}</title>
                        </rect>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {editPanelOpen && selectedElement && (
                <div style={{
                  position: isMobile ? 'fixed' : 'relative',
                  bottom: isMobile ? 0 : undefined,
                  left: 0, right: 0,
                  maxHeight: isMobile ? '50vh' : 400,
                  background: 'var(--v2-dark-2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 16,
                  padding: 20,
                  marginTop: isMobile ? 0 : 16,
                  zIndex: isMobile ? 100 : 1,
                  overflowY: 'auto',
                  touchAction: isMobile ? 'pan-y' : undefined,
                }}>
                  {selectedElement.type === 'table' && (() => {
                    const t = clubTables[selectedElement.id]
                    if (!t) return null
                    return (
                      <>
                        <h4 style={{ marginBottom: 12 }}>עריכת שולחן</h4>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>מספר שולחן <Tooltip text="המספר שיוצג על השולחן במפה" /></label>
                          <input value={t.label} onChange={e => setClubTables(prev => prev.map((x, j) => j === selectedElement.id ? { ...x, label: e.target.value } : x))} placeholder="מספר שולחן (למשל: 12)" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>כמות אנשים מקסימלית <Tooltip text="כמה אנשים יכולים לשבת בשולחן זה" /></label>
                          <input type="range" min={1} max={30} value={t.capacity ?? 4} onChange={e => setClubTables(prev => prev.map((x, j) => j === selectedElement.id ? { ...x, capacity: parseInt(e.target.value) || 4 } : x))} style={{ width: '100%', marginBottom: 4 }} />
                          <span style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)' }}>עד {t.capacity ?? 4} אנשים</span>
                        </div>
                        <input type="number" min={0} value={t.price ?? 0} onChange={e => setClubTables(prev => prev.map((x, j) => j === selectedElement.id ? { ...x, price: parseFloat(e.target.value) || 0 } : x))} placeholder="מחיר ₪" style={{ width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                        <CustomSelect
                          value={t.zone || 'floor'}
                          onChange={(val) => setClubTables(prev => prev.map((x, j) => j === selectedElement.id ? { ...x, zone: val } : x))}
                          style={{ width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                          options={ZONE_OPTIONS.map(z => ({ value: z, label: ZONE_LABELS[z] }))}
                        />
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>צבע אזור</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                          {TABLE_COLORS.map(c => (
                            <button key={c} onClick={() => setClubTables(prev => prev.map((x, j) => j === selectedElement.id ? { ...x, color: c } : x))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: (t.color || ZONE_COLORS[t.zone]) === c ? '2px solid #fff' : 'none', cursor: 'pointer' }} />
                          ))}
                        </div>
                        <textarea value={t.included || ''} onChange={e => setClubTables(prev => prev.map((x, j) => j === selectedElement.id ? { ...x, included: e.target.value } : x))} placeholder="מה כלול" rows={2} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={duplicateElement} style={{ padding: '10px 20px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, cursor: 'pointer' }}>📋 שכפל</button>
                          <button onClick={deleteElement} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>מחק</button>
                        </div>
                      </>
                    )
                  })()}
                  {selectedElement.type === 'rect' && (() => {
                    const r = clubRects.find(x => x.id === selectedElement.id)
                    if (!r) return null
                    return (
                      <>
                        <h4 style={{ marginBottom: 12 }}>עריכת אזור</h4>
                        <input value={r.text} onChange={e => setClubRects(prev => prev.map(x => x.id === r.id ? { ...x, text: e.target.value } : x))} placeholder="טקסט (STAGE/DJ/BAR)" style={{ width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>רוחב 5-40%</label>
                        <input type="range" min={5} max={40} value={r.width ?? 60} onChange={e => setClubRects(prev => prev.map(x => x.id === r.id ? { ...x, width: parseInt(e.target.value) } : x))} style={{ width: '100%', marginBottom: 8 }} />
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>גובה 5-40%</label>
                        <input type="range" min={5} max={40} value={r.height ?? 12} onChange={e => setClubRects(prev => prev.map(x => x.id === r.id ? { ...x, height: parseInt(e.target.value) } : x))} style={{ width: '100%', marginBottom: 8 }} />
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>צבע רקע</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                          {RECT_COLORS.map(c => (
                            <button key={c} onClick={() => setClubRects(prev => prev.map(x => x.id === r.id ? { ...x, color: c } : x))} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: (r.color || RECT_COLORS[0]) === c ? '2px solid #fff' : 'none', cursor: 'pointer' }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={duplicateElement} style={{ padding: '10px 20px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, cursor: 'pointer' }}>📋 שכפל</button>
                          <button onClick={deleteElement} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>מחק</button>
                        </div>
                      </>
                    )
                  })()}
                  {isMobile && <button onClick={() => setEditPanelOpen(false)} style={{ marginTop: 12, width: '100%', padding: 12, background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: 'pointer' }}>סגור (swipe למטה)</button>}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: '14px 24px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'שומר...' : 'שמור מפת ישיבה'}</button>
            {onCancel && <button onClick={onCancel} style={{ padding: '14px 24px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>ביטול</button>}
          </div>
        </>
      )}
    </div>
  )
}
