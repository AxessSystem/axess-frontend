import { useState, useMemo } from 'react'

const ZONE_COLORS = { stage_front: '#A855F7', vip_area: '#B8860B', floor: '#2563EB', bar: '#E85D04' }

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
  const [saving, setSaving] = useState(false)

  const theaterSeats = useMemo(() => {
    const out = []
    const rowCounts = useCustomRows && customRows.length > 0
      ? customRows
      : Array(rows).fill(seatsPerRow)
    rowCounts.forEach((count, ri) => {
      for (let si = 0; si < count; si++) {
        const seatKey = `r${ri + 1}s${si + 1}`
        const isBlocked = blockedSeats.has(seatKey)
        const isVip = vipSeats.has(seatKey)
        out.push({
          seat_key: seatKey,
          row_number: ri + 1,
          seat_number: si + 1,
          seat_type: isVip ? 'vip' : 'regular',
          status: isBlocked ? 'blocked' : 'available',
          price: isVip ? priceVip : priceRegular,
          metadata: { stage_label: stageLabel },
        })
      }
    })
    return out
  }, [rows, seatsPerRow, useCustomRows, customRows, blockedSeats, vipSeats, priceRegular, priceVip, stageLabel])

  const cycleSeatStatus = (seatKey) => {
    const st = getSeatStatus(seatKey)
    if (st === 'available') {
      setBlockedSeats(prev => new Set([...prev, seatKey]))
    } else if (st === 'blocked') {
      setBlockedSeats(prev => { const n = new Set(prev); n.delete(seatKey); return n })
      setVipSeats(prev => new Set([...prev, seatKey]))
    } else {
      setVipSeats(prev => { const n = new Set(prev); n.delete(seatKey); return n })
    }
  }

  const getSeatStatus = (seatKey) => {
    if (blockedSeats.has(seatKey)) return 'blocked'
    if (vipSeats.has(seatKey)) return 'vip'
    return 'available'
  }

  const handleSave = async () => {
    if (!eventId && onSave) {
      const config = buildConfig()
      onSave(config)
      return
    }
    if (!eventId) return
    setSaving(true)
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'
      const config = buildConfig()
      const body = { template_type: config.template_type, seats: config.seats, zones: config.zones }
      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/seating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('שגיאה בשמירה')
      onSave?.(await res.json())
    } catch (e) {
      throw e
    } finally {
      setSaving(false)
    }
  }

  const buildConfig = () => {
    if (templateType === 'theater' || templateType === 'mixed') {
      const seats = theaterSeats.filter(s => s.status !== 'blocked').map(s => ({
        seat_key: s.seat_key,
        row_number: s.row_number,
        seat_number: s.seat_number,
        seat_type: s.seat_type,
        status: s.status,
        price: s.price,
        metadata: s.metadata,
      }))
      return { enabled, template_type: templateType, seats, zones: [], stage_label: stageLabel }
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
      }))
      return { enabled, template_type: 'club', seats, zones }
    }
    return { enabled, template_type: templateType, seats: [], zones: [] }
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

  return (
    <div dir="rtl" style={{ padding: 24 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <span>הוסף מפת ישיבה</span>
      </label>

      {templateType === null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { key: 'theater', icon: '🎭', title: 'תיאטרון', desc: 'שורות וכיסאות ממוספרים' },
            { key: 'club', icon: '🎵', title: 'מועדון/מסיבה', desc: 'שולחנות ואזורים' },
            { key: 'mixed', icon: '🎪', title: 'מעורב', desc: 'תיאטרון + שולחנות VIP' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTemplateType(t.key)}
              style={{
                padding: 24,
                background: 'var(--v2-dark-3)',
                border: '2px solid var(--glass-border)',
                borderRadius: 16,
                color: '#fff',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      )}

      {templateType && (
        <>
          <button
            onClick={() => setTemplateType(null)}
            style={{ marginBottom: 16, padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: 'pointer' }}
          >
            ← בחר תבנית אחרת
          </button>

          {(templateType === 'theater' || templateType === 'mixed') && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>כמה שורות?</label>
                  <input type="number" min={1} max={50} value={rows} onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>כיסאות בשורה?</label>
                  <input type="number" min={1} max={100} value={seatsPerRow} onChange={e => setSeatsPerRow(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={useCustomRows} onChange={e => setUseCustomRows(e.target.checked)} />
                  שורות בגדלים שונים?
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>טקסט במה</label>
                <input value={stageLabel} onChange={e => setStageLabel(e.target.value)} placeholder="במה / STAGE / DJ BOOTH" style={{ width: 200, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
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
              <div style={{ background: '#0a0a0a', borderRadius: 12, padding: 16, overflow: 'auto', maxHeight: 300 }}>
                <svg viewBox="0 0 100 80" width="100%" height="auto" style={{ maxHeight: 280 }} preserveAspectRatio="xMidYMid meet">
                  <rect x="5" y="68" width="90" height="10" rx="4" fill="#1a1a2e" />
                  <text x="50" y="74" textAnchor="middle" fontSize="3" fill="#888">{stageLabel}</text>
                  {theaterSeats.reduce((acc, s) => {
                    const rn = s.row_number, sn = s.seat_number
                    const rowCounts = useCustomRows && customRows.length > 0 ? customRows : Array(rows).fill(seatsPerRow)
                    const count = rowCounts[rn - 1] ?? seatsPerRow
                    const totalW = (count - 1) * 2.5
                    const x = 50 - totalW / 2 + (sn - 1) * 2.5
                    const y = 60 - (rn - 1) * 3.5
                    const st = getSeatStatus(s.seat_key)
                    const fill = st === 'blocked' ? '#333' : st === 'vip' ? '#2a1a3a' : '#1a2e1a'
                    const stroke = st === 'blocked' ? '#333' : st === 'vip' ? '#A855F7' : '#00C37A'
                    return [...acc, (
                      <circle key={s.seat_key} cx={x} cy={y} r={1} fill={fill} stroke={stroke} strokeWidth="0.3" style={{ cursor: 'pointer' }} onClick={() => cycleSeatStatus(s.seat_key)} />
                    )]
                  }, [])}
                </svg>
              </div>
            </div>
          )}

          {templateType === 'club' && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: 'var(--v2-gray-400)', marginBottom: 12 }}>הוסף שולחנות (גרירה למקום)</p>
              <button
                onClick={() => setClubTables([...clubTables, { seat_key: `table-${clubTables.length + 1}`, zone: 'floor', capacity: 4, price: 0, position_x: 50, position_y: 40, label: `שולחן ${clubTables.length + 1}` }])}
                style={{ padding: '10px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                + הוסף שולחן
              </button>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {clubTables.map((t, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                    <input value={t.label} onChange={e => setClubTables(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="שולחן" style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    <input type="number" min={1} max={30} value={t.capacity ?? 4} onChange={e => setClubTables(prev => prev.map((x, j) => j === i ? { ...x, capacity: parseInt(e.target.value) || 4 } : x))} placeholder="קיבולת" style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    <input type="number" min={0} value={t.price ?? 0} onChange={e => setClubTables(prev => prev.map((x, j) => j === i ? { ...x, price: parseFloat(e.target.value) || 0 } : x))} placeholder="מחיר" style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    <button onClick={() => setClubTables(prev => prev.filter((_, j) => j !== i))} style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>מחק</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, height: 400, background: '#0a0a0a', borderRadius: 12, position: 'relative' }}>
                <svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                  <rect x="10" y="2" width="80" height="12" rx="4" fill="url(#clubStage)" />
                  <defs><linearGradient id="clubStage" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6d28d9" /><stop offset="1" stopColor="#1e3a8a" /></linearGradient></defs>
                  <text x="50" y="10" textAnchor="middle" fontSize="3" fill="#fff">STAGE</text>
                  {clubTables.map((t, i) => (
                    <circle key={i} cx={t.position_x ?? 50} cy={t.position_y ?? 40} r="4" fill={ZONE_COLORS[t.zone] || '#2563EB'} stroke="#444" strokeWidth="0.5">
                      <title>{t.label} — עד {t.capacity}</title>
                    </circle>
                  ))}
                </svg>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: '14px 24px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
              {saving ? 'שומר...' : 'שמור מפת ישיבה'}
            </button>
            {onCancel && <button onClick={onCancel} style={{ padding: '14px 24px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>ביטול</button>}
          </div>
        </>
      )}
    </div>
  )
}
