import { useState, useMemo } from 'react'

const ZONE_COLORS = {
  stage_front: '#A855F7',
  vip_area: '#B8860B',
  floor: '#2563EB',
  bar: '#E85D04',
  custom: '#64748b',
}

const SEAT_STYLES = {
  available: { fill: '#1a2e1a', stroke: '#00C37A', strokeWidth: 0.3 },
  selected: { fill: '#00C37A', stroke: '#00C37A', strokeWidth: 0.3 },
  sold: { fill: '#1a1a1a', stroke: '#333', strokeWidth: 0.3, opacity: 0.5 },
  reserved: { fill: '#2a2a1a', stroke: '#666', strokeWidth: 0.3 },
  vip: { fill: '#2a1a3a', stroke: '#A855F7', strokeWidth: 0.5 },
  blocked: { display: 'none' },
}

export default function SeatingMap({ seats = [], templateType = 'theater', onSeatSelect, selectedSeats = [], zones = [] }) {
  const [hovered, setHovered] = useState(null)

  const { rows, stageConfig } = useMemo(() => {
    if (templateType === 'theater') {
      const byRow = {}
      seats.forEach(s => {
        const r = s.row_number ?? 1
        if (!byRow[r]) byRow[r] = []
        byRow[r].push(s)
      })
      Object.keys(byRow).forEach(r => byRow[r].sort((a, b) => (a.seat_number ?? 0) - (b.seat_number ?? 0)))
      const stageText = (seats[0]?.metadata?.stage_label) || 'במה'
      return { rows: byRow, stageConfig: { text: stageText } }
    }
    return { rows: {}, stageConfig: {} }
  }, [seats, templateType])

  const theaterSeats = useMemo(() => {
    const out = []
    const rowNums = Object.keys(rows).map(Number).sort((a, b) => a - b)
    const maxSeats = Math.max(...rowNums.map(r => (rows[r]?.length || 0)), 1)
    const rowSpacing = 3.5
    const seatSpacing = 2.5
    const startY = 65
    rowNums.forEach((rn, ri) => {
      const rowSeats = rows[rn] || []
      const rowY = startY - ri * rowSpacing
      const totalW = (rowSeats.length - 1) * seatSpacing
      let x = 50 - totalW / 2
      rowSeats.forEach(s => {
        const isSelected = selectedSeats.some(id => id === s.id)
        const style = SEAT_STYLES[s.status === 'blocked' ? 'blocked' : s.seat_type === 'vip' ? 'vip' : s.status] || SEAT_STYLES.available
        const effectiveStatus = s.status === 'blocked' ? 'blocked' : s.seat_type === 'vip' && s.status === 'available' ? 'vip' : s.status
        out.push({
          ...s,
          cx: x,
          cy: rowY,
          r: 1.0,
          isSelected,
          style: effectiveStatus === 'blocked' ? SEAT_STYLES.blocked : SEAT_STYLES[effectiveStatus] || SEAT_STYLES.available,
          label: `שורה ${s.row_number} כיסא ${s.seat_number}`,
          price: s.price != null ? `₪${Number(s.price).toFixed(0)}` : '',
        })
        x += seatSpacing
      })
    })
    return out
  }, [rows, selectedSeats])

  const clubSeats = useMemo(() => {
    return seats.filter(s => s.status !== 'blocked').map(s => {
      const cap = s.capacity ?? 1
      let r = 3.5
      if (cap >= 5 && cap <= 8) r = 4.5
      else if (cap >= 9) r = 5.5
      const x = (s.position_x != null ? Number(s.position_x) : 50)
      const y = (s.position_y != null ? Number(s.position_y) : 40)
      const zoneColor = ZONE_COLORS[s.zone] || ZONE_COLORS.custom
      const isSelected = selectedSeats.some(id => id === s.id)
      return { ...s, cx: x, cy: y, r, zoneColor, isSelected }
    })
  }, [seats, selectedSeats])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (templateType === 'theater' || templateType === 'mixed') {
    const theaterPart = templateType === 'mixed' ? seats.filter(s => s.row_number != null && s.seat_number != null) : seats
    const mixedClubPart = templateType === 'mixed' ? seats.filter(s => s.position_x != null && s.position_y != null) : []
    const rowsForRender = {}
    theaterPart.forEach(s => {
      const r = s.row_number ?? 1
      if (!rowsForRender[r]) rowsForRender[r] = []
      rowsForRender[r].push(s)
    })
    Object.keys(rowsForRender).forEach(r => rowsForRender[r].sort((a, b) => (a.seat_number ?? 0) - (b.seat_number ?? 0)))
    const rowNums = Object.keys(rowsForRender).map(Number).sort((a, b) => a - b)
    const rowSpacing = 3.5
    const seatSpacing = 2.5
    const startY = templateType === 'mixed' ? 55 : 65

    return (
      <svg viewBox="0 0 100 80" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: 400 }}>
        {/* Stage */}
        <defs>
          <linearGradient id="stageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a2a4e" />
            <stop offset="100%" stopColor="#1a1a2e" />
          </linearGradient>
        </defs>
        <rect x="5" y="70" width="90" height="8" rx="4" fill="url(#stageGrad)" stroke="#3a3a5e" strokeWidth="0.3" />
        <text x="50" y="75.5" textAnchor="middle" fontSize="2.5" fill="#a0a0c0">
          {stageConfig.text || 'במה'}
        </text>

        {/* Theater rows */}
        {rowNums.map((rn, ri) => {
          const rowSeats = rowsForRender[rn] || []
          const rowY = startY - ri * rowSpacing
          const totalW = Math.max(0, (rowSeats.length - 1) * seatSpacing)
          const startX = 50 - totalW / 2
          return (
            <g key={`row-${rn}`}>
              <text x="3" y={rowY + 0.4} fontSize="2" fill="var(--v2-gray-400)">שורה {rn}</text>
              {rowSeats.map((s, si) => {
                const isSelected = selectedSeats.some(id => id === s.id)
                const effectiveStatus = s.status === 'blocked' ? 'blocked'
                  : isSelected ? 'selected'
                  : s.seat_type === 'vip' && s.status === 'available' ? 'vip' : s.status
                const style = SEAT_STYLES[effectiveStatus]
                if (style?.display === 'none') return null
                const isHover = hovered === s.id
                const rad = (effectiveStatus === 'available' && isHover) ? 1.3 : 1.0
                const strokeW = (effectiveStatus === 'available' && isHover) ? 0.4 : (style?.strokeWidth ?? 0.3)
                const label = `שורה ${s.row_number} כיסא ${s.seat_number}${s.price != null ? ` — ₪${Number(s.price).toFixed(0)}` : ''}`
                const cx = startX + si * seatSpacing
                return (
                  <g key={s.id}>
                    <circle
                      cx={cx}
                      cy={rowY}
                      r={rad}
                      fill={style?.fill}
                      stroke={style?.stroke}
                      strokeWidth={strokeW}
                      opacity={style?.opacity ?? 1}
                      style={{ cursor: s.status === 'available' ? 'pointer' : 'default' }}
                      onClick={() => s.status === 'available' && onSeatSelect?.(s)}
                      onMouseEnter={() => setHovered(s.id)}
                      onMouseLeave={() => setHovered(null)}
                    />
                    {isHover && s.status === 'available' && (
                      <title>{label}</title>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Mixed: club tables on top */}
        {templateType === 'mixed' && mixedClubPart.length > 0 && mixedClubPart.map(s => {
          const cap = s.capacity ?? 1
          let r = 2.5
          if (cap >= 5 && cap <= 8) r = 3
          else if (cap >= 9) r = 3.5
          const zoneColor = ZONE_COLORS[s.zone] || ZONE_COLORS.custom
          const isSelected = selectedSeats.some(id => id === s.id)
          const style = s.status === 'sold' ? { opacity: 0.35 } : {}
          return (
            <g key={s.id}>
              <circle
                cx={s.position_x ?? 50}
                cy={s.position_y ?? 15}
                r={r}
                fill={zoneColor}
                stroke={isSelected ? '#00C37A' : '#444'}
                strokeWidth={isSelected ? 1 : 0.3}
                style={{ cursor: s.status === 'available' ? 'pointer', ...style }}
                onClick={() => s.status === 'available' && onSeatSelect?.(s)}
              />
              <text x={s.position_x ?? 50} y={(s.position_y ?? 15) + 0.5} textAnchor="middle" fontSize="2" fill="#fff">
                {s.label || s.seat_key}
              </text>
              <text x={s.position_x ?? 50} y={(s.position_y ?? 15) + 2} textAnchor="middle" fontSize="1.5" fill="rgba(255,255,255,0.7)">
                {cap}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <g transform="translate(50, 78)">
          <circle cx="-18" cy="0" r="0.8" fill="#1a2e1a" stroke="#00C37A" strokeWidth="0.2" />
          <text x="-16" y="0.4" fontSize="1.8" fill="#ccc">זמין</text>
          <circle cx="-4" cy="0" r="0.8" fill="#00C37A" stroke="#00C37A" strokeWidth="0.2" />
          <text x="-2" y="0.4" fontSize="1.8" fill="#ccc">נבחר</text>
          <circle cx="8" cy="0" r="0.8" fill="#1a1a1a" stroke="#333" strokeWidth="0.2" opacity="0.5" />
          <text x="10" y="0.4" fontSize="1.8" fill="#ccc">תפוס</text>
          <circle cx="20" cy="0" r="0.8" fill="#2a1a3a" stroke="#A855F7" strokeWidth="0.2" />
          <text x="22" y="0.4" fontSize="1.8" fill="#ccc">VIP</text>
        </g>
      </svg>
    )
  }

  if (templateType === 'club') {
    return (
      <svg viewBox="0 0 100 80" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: 400 }}>
        <defs>
          <linearGradient id="clubStageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <animate id="pulse" attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        </defs>
        <rect x="10" y="2" width="80" height="12" rx="4" fill="url(#clubStageGrad)" opacity="0.9">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="50" y="9" textAnchor="middle" fontSize="3" fill="#fff">STAGE / DJ BOOTH</text>

        {clubSeats.map(s => (
          <g key={s.id}>
            <circle
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill={s.zoneColor}
              stroke={s.isSelected ? '#00C37A' : '#444'}
              strokeWidth={s.isSelected ? 1 : 0.3}
              opacity={s.status === 'sold' ? 0.35 : 1}
              style={{ cursor: s.status === 'available' ? 'pointer' : 'default' }}
              onClick={() => s.status === 'available' && onSeatSelect?.(s)}
            />
            <text x={s.cx} y={s.cy - 0.5} textAnchor="middle" fontSize="2.5" fill="#fff" fontWeight="bold">
              {s.label || s.seat_key}
            </text>
            <text x={s.cx} y={s.cy + 1.2} textAnchor="middle" fontSize="1.5" fill="rgba(255,255,255,0.7)">
              עד {s.capacity ?? 1}
            </text>
            {s.status === 'sold' && (
              <text x={s.cx} y={s.cy + 2.5} textAnchor="middle" fontSize="1.5" fill="rgba(255,255,255,0.8)">תפוס</text>
            )}
          </g>
        ))}

        <g transform="translate(50, 76)">
          <circle cx="-18" cy="0" r="0.8" fill="#1a2e1a" stroke="#00C37A" strokeWidth="0.2" />
          <text x="-16" y="0.4" fontSize="1.8" fill="#ccc">זמין</text>
          <circle cx="-4" cy="0" r="0.8" fill="#00C37A" stroke="#00C37A" strokeWidth="0.2" />
          <text x="-2" y="0.4" fontSize="1.8" fill="#ccc">נבחר</text>
          <circle cx="8" cy="0" r="0.8" fill="#1a1a1a" stroke="#333" strokeWidth="0.2" opacity="0.5" />
          <text x="10" y="0.4" fontSize="1.8" fill="#ccc">תפוס</text>
          <circle cx="20" cy="0" r="0.8" fill="#B8860B" stroke="#B8860B" strokeWidth="0.2" />
          <text x="22" y="0.4" fontSize="1.8" fill="#ccc">VIP</text>
        </g>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 80" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: 400 }}>
      <text x="50" y="40" textAnchor="middle" fill="#888">אין מפת ישיבה</text>
    </svg>
  )
}
