import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { useAuth } from '@/contexts/AuthContext'
import {
  Calendar, MapPin, Users, DollarSign, Ticket,
  Star, Music, Edit, Send, BarChart2, Plus,
  Clock, CheckCircle, XCircle, Eye, Share2,
  Megaphone, QrCode, ChevronLeft,
  Key, Copy, Copy as CopyIcon, Trash2, ExternalLink,
  X, Mail, Sparkles, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Tooltip from '../../components/ui/Tooltip'
import CustomSelect from '@/components/ui/CustomSelect'
import EventEditModal from './EventEditModal'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin

const MODAL_CLOSE_X = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--v2-gray-400)',
  padding: 4,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const FLOOR_STATUS_COLORS = { arrived: '#22c55e', confirmed: '#2563EB', pending: '#eab308', no_show: '#ef4444', available: '#64748b', reserved: '#64748b' }

function FloorStatusModal({ event, onClose }) {
  const [data, setData] = useState({ seats: [], bookings: [] })
  const [loading, setLoading] = useState(true)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/events/${event.id}/floor-status`)
      .then(r => r.ok ? r.json() : { seats: [], bookings: [] })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [event.id])

  const updateStatus = async (bookingId, status) => {
    setUpdating(true)
    try {
      const r = await fetch(`${API_BASE}/api/admin/table-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) throw new Error('שגיאה')
      const d = await fetch(`${API_BASE}/api/admin/events/${event.id}/floor-status`).then(res => res.json())
      setData(d)
      setSelectedSeat(null)
      toast.success('עודכן')
    } catch (e) { toast.error(e.message) }
    finally { setUpdating(false) }
  }

  const counters = { arrived: 0, confirmed: 0, pending: 0, no_show: 0 }
  data.seats.forEach(s => {
    const st = (s.booking?.status || s.status || 'available')
    if (counters[st] !== undefined) counters[st]++
  })

  const seatsForMap = data.seats.map(s => ({
    ...s,
    status: s.booking?.status || s.status || 'available',
    cx: (s.position_x != null ? Number(s.position_x) : 50),
    cy: (s.position_y != null ? Number(s.position_y) : 40),
    r: Math.max(3, (s.capacity || 4) * 0.8),
  }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55 }} onClick={onClose}>
      <div style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 700, width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()} dir="rtl">
        <button type="button" onClick={onClose} style={MODAL_CLOSE_X} aria-label="סגור">
          <X size={20} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>ניהול ערב — {event.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', fontSize: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: FLOOR_STATUS_COLORS.arrived }} /> הגיעו: {counters.arrived}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: FLOOR_STATUS_COLORS.confirmed }} /> מאושרים: {counters.confirmed}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: FLOOR_STATUS_COLORS.pending }} /> ממתינים: {counters.pending}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: FLOOR_STATUS_COLORS.no_show }} /> no_show: {counters.no_show}</span>
        </div>
        {loading ? (
          <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
        ) : seatsForMap.length === 0 ? (
          <div style={{ color: 'var(--v2-gray-400)', padding: 24, textAlign: 'center' }}>אין שולחנות מוגדרים לאירוע זה</div>
        ) : (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1.2', maxHeight: 400, background: 'var(--v2-dark-3)', borderRadius: 12, overflow: 'hidden' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
              {seatsForMap.map(s => (
                <g key={s.seat_key} onClick={() => setSelectedSeat(selectedSeat?.seat_key === s.seat_key ? null : s)} style={{ cursor: 'pointer' }}>
                  <circle cx={s.cx} cy={s.cy} r={s.r} fill={FLOOR_STATUS_COLORS[s.status] || FLOOR_STATUS_COLORS.available} stroke="#fff" strokeWidth="0.5" />
                  <text x={s.cx} y={s.cy} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="3" fontWeight="700">{s.label || s.seat_key}</text>
                </g>
              ))}
            </svg>
            {selectedSeat && selectedSeat.booking && (
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, padding: 16, background: 'var(--v2-dark-2)', borderRadius: 12, border: '1px solid var(--glass-border)', zIndex: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>שולחן {selectedSeat.label || selectedSeat.seat_key}</div>
                <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 8 }}>Host: {(selectedSeat.booking.buyer_info?.first_name || '') + ' ' + (selectedSeat.booking.buyer_info?.last_name || '') || selectedSeat.booking.phone || '-'}</div>
                {selectedSeat.booking.guests?.length > 0 && (
                  <div style={{ fontSize: 13, marginBottom: 12 }}>
                    {selectedSeat.booking.guests.map(g => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <User size={14} color="#00C37A" />
                        <span>{g.name || '-'}</span>
                        <span>—</span>
                        {g.payment_status === 'paid' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} color="#00C37A" /> שולם</span>
                        ) : g.payment_status === 'waived' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ticket size={14} color="#00C37A" /> נכנס</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={14} color="#00C37A" /> ממתין</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => updateStatus(selectedSeat.booking.id, 'arrived')} disabled={updating} style={{ padding: '8px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>סמן הגיע</button>
                  <button onClick={() => updateStatus(selectedSeat.booking.id, 'no_show')} disabled={updating} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>no_show</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PromotersModal({ event, businessId, onClose, embedded }) {
  const { session } = useAuth()
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId
  }), [session, businessId])
  const [promoters, setPromoters] = useState([])
  const [eventPromoters, setEventPromoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [selPromoterId, setSelPromoterId] = useState('')
  const [commissionType, setCommissionType] = useState('fixed')
  const [commissionValue, setCommissionValue] = useState(0)
  const [maxTickets, setMaxTickets] = useState('')
  const [statsModal, setStatsModal] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [duplicateTarget, setDuplicateTarget] = useState(null)
  const [events, setEvents] = useState([])
  const [createPromoterOpen, setCreatePromoterOpen] = useState(false)
  const [newPromoterName, setNewPromoterName] = useState('')
  const [newPromoterPhone, setNewPromoterPhone] = useState('')
  const [newPromoterEmail, setNewPromoterEmail] = useState('')
  const [newPromoterInstagram, setNewPromoterInstagram] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/admin/promoters?business_id=${businessId}`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/admin/events/${event.id}/promoters`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
    ]).then(([p, ep, ev]) => { setPromoters(p); setEventPromoters(ep); setEvents(ev); setLoading(false) }).catch(() => setLoading(false))
  }, [event.id, businessId, authHeaders])

  const refreshPromoters = () => {
    fetch(`${API_BASE}/api/admin/events/${event.id}/promoters`).then(r => r.ok ? r.json() : []).then(setEventPromoters)
    fetch(`${API_BASE}/api/admin/promoters?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setPromoters)
  }

  const copyLink = (ep) => {
    const url = `${FRONTEND_URL}/e/${event.slug}?ref=${ep.promo_code}`
    navigator.clipboard?.writeText(url).then(() => toast.success('הועתק')).catch(() => toast.error('העתקה נכשלה'))
  }

  const openStats = (ep) => {
    setStatsModal(ep)
    fetch(`${API_BASE}/api/admin/events/${event.id}/promoters/${ep.promoter_id}/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(setStatsData)
  }

  const handleAddPromoter = async () => {
    if (!selPromoterId) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${event.id}/promoters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoter_id: selPromoterId, commission_type: commissionType, commission_value: parseFloat(commissionValue) || 0, max_tickets: maxTickets ? parseInt(maxTickets, 10) : null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('היחצ"ן נוסף לאירוע')
      setAddOpen(false)
      setSelPromoterId('')
      refreshPromoters()
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const handleRemove = async (ep) => {
    if (!confirm('הסר את היחצ"ן מאירוע זה?')) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${event.id}/promoters/${ep.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('שגיאה')
      toast.success('הוסר')
      refreshPromoters()
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const handleDuplicate = async (ep, targetEventId) => {
    if (!targetEventId) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/promoters/${ep.promoter_id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_event_id: targetEventId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('שוכפל לאירוע')
      refreshPromoters()
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const handleMarkPaid = async () => {
    if (!statsModal) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/promoters/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_promoter_id: statsModal.id }),
      })
      if (!res.ok) throw new Error('שגיאה')
      toast.success('סומן כשולם')
      setStatsModal(null)
      refreshPromoters()
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const handleCreatePromoter = async () => {
    if (!newPromoterName.trim()) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/promoters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, name: newPromoterName.trim(), phone: newPromoterPhone || null, email: newPromoterEmail || null, instagram: newPromoterInstagram || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('יחצ"ן נוצר')
      setCreatePromoterOpen(false)
      setNewPromoterName('')
      setNewPromoterPhone('')
      setNewPromoterEmail('')
      setNewPromoterInstagram('')
      refreshPromoters()
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const content = (
    <div style={{ background: embedded ? 'transparent' : 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: embedded ? 0 : 32, maxWidth: embedded ? '100%' : 560, width: embedded ? '100%' : '90%', maxHeight: embedded ? 'none' : '90vh', overflowY: 'auto' }} dir="rtl">
        {!embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>יחצ"נים — {event.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        )}
        {loading ? <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div> : (
          <>
            {eventPromoters.map(ep => (
              <div key={ep.id} style={{ padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12, marginBottom: 12, border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{ep.promoter_name}</span>
                    <span style={{ color: 'var(--v2-gray-400)', marginRight: 8, fontSize: 14 }}>— {ep.promo_code}</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 8 }}>מכירות: {ep.tickets_sold || 0} כרטיסים | עמלה: ₪{(ep.commission_earned || 0).toFixed(0)}</div>
                {ep.max_tickets && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ height: 6, background: 'var(--v2-dark-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, ((ep.tickets_sold || 0) / ep.max_tickets) * 100)}%`, background: 'var(--v2-primary)' }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>{ep.tickets_sold || 0} מתוך {ep.max_tickets}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => copyLink(ep)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><Copy size={14} color="var(--v2-dark)" /> העתק לינק</button>
                  <button onClick={() => openStats(ep)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><BarChart2 size={14} color="#00C37A" /> סטטיסטיקות</button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setDuplicateTarget(duplicateTarget === ep.id ? null : ep.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><CopyIcon size={14} color="#00C37A" /> שכפל לאירוע</button>
                    {duplicateTarget === ep.id && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, padding: 8, background: 'var(--v2-dark-3)', borderRadius: 8, border: '1px solid var(--glass-border)', minWidth: 180, zIndex: 10 }}>
                        <CustomSelect
                          value=""
                          onChange={(v) => { if (v) { handleDuplicate(ep, v); setDuplicateTarget(null) } }}
                          style={{ width: '100%', padding: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 6 }}
                          placeholder="בחר אירוע"
                          options={[
                            { value: '', label: 'בחר אירוע' },
                            ...events.filter(ev => ev.id !== event.id).map(ev => ({ value: ev.id, label: ev.title })),
                          ]}
                        />
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleRemove(ep)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><Trash2 size={14} color="#ef4444" /> הסר מאירוע</button>
                </div>
              </div>
            ))}
            {!addOpen && !createPromoterOpen && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setAddOpen(true)} style={{ padding: '10px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 600 }}>הוסף יחצ"ן</button>
                <button onClick={() => setCreatePromoterOpen(true)} style={{ padding: '10px 20px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>צור יחצ"ן חדש</button>
              </div>
            )}
            {addOpen && (
              <div style={{ marginTop: 20, padding: 20, background: 'var(--v2-dark-3)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                <h4 style={{ marginBottom: 12 }}>הוסף יחצ"ן לאירוע</h4>
                <CustomSelect
                  value={selPromoterId}
                  onChange={(val) => setSelPromoterId(val)}
                  style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }}
                  placeholder='בחר יחצ"ן'
                  options={[
                    { value: '', label: 'בחר יחצ"ן' },
                    ...promoters.filter(p => p.status !== 'inactive').map(p => ({ value: p.id, label: p.name })),
                  ]}
                />
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <label><input type="radio" checked={commissionType === 'fixed'} onChange={() => setCommissionType('fixed')} /> עמלה קבועה ₪</label>
                  <label><input type="radio" checked={commissionType === 'percent'} onChange={() => setCommissionType('percent')} /> אחוז %</label>
                </div>
                <input type="number" value={commissionValue} onChange={e => setCommissionValue(e.target.value)} placeholder={commissionType === 'fixed' ? '₪ לכרטיס' : '%'} style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <input type="number" value={maxTickets} onChange={e => setMaxTickets(e.target.value)} placeholder="מכסה כרטיסים (אופציונלי)" style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Tooltip text="עמלה תחושב אוטומטית לכל מכירה שנעשתה דרך הלינק של היחצן" />
                  <button onClick={handleAddPromoter} disabled={!selPromoterId} style={{ padding: '10px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: selPromoterId ? 'pointer' : 'not-allowed', fontWeight: 600 }}>הוסף</button>
                  <button onClick={() => setAddOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                </div>
              </div>
            )}
            {createPromoterOpen && (
              <div style={{ marginTop: 20, padding: 20, background: 'var(--v2-dark-3)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                <h4 style={{ marginBottom: 12 }}>צור יחצ"ן חדש</h4>
                <input value={newPromoterName} onChange={e => setNewPromoterName(e.target.value)} placeholder="שם *" style={{ width: '100%', padding: 12, marginBottom: 8, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <input value={newPromoterPhone} onChange={e => setNewPromoterPhone(e.target.value)} placeholder="טלפון" style={{ width: '100%', padding: 12, marginBottom: 8, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <input value={newPromoterEmail} onChange={e => setNewPromoterEmail(e.target.value)} placeholder="מייל" style={{ width: '100%', padding: 12, marginBottom: 8, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <input value={newPromoterInstagram} onChange={e => setNewPromoterInstagram(e.target.value)} placeholder="אינסטגרם" style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCreatePromoter} disabled={!newPromoterName.trim()} style={{ padding: '10px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>שמור</button>
                  <button onClick={() => setCreatePromoterOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Stats modal */}
        {statsModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => setStatsModal(null)}>
            <div style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()} dir="rtl">
              <button type="button" onClick={() => setStatsModal(null)} style={MODAL_CLOSE_X} aria-label="סגור">
                <X size={20} />
              </button>
              <h3 style={{ marginBottom: 16 }}>סטטיסטיקות — {statsModal.promoter_name}</h3>
              {statsData && (
                <>
                  <div style={{ marginBottom: 12 }}>סה"כ מכירות: ₪{statsData.total_sales?.toFixed(0)}</div>
                  <div style={{ marginBottom: 12 }}>כרטיסים: {statsData.total_tickets}</div>
                  <div style={{ marginBottom: 12 }}>עמלה לתשלום: ₪{statsData.commission_earned?.toFixed(0)}</div>
                  {statsData.top_ticket_type && <div style={{ marginBottom: 12 }}>סוג כרטיס מוביל: {statsData.top_ticket_type}</div>}
                </>
              )}
              <button onClick={handleMarkPaid} style={{ marginTop: 12, padding: '10px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>סמן כשולם</button>
              <button onClick={() => setStatsModal(null)} style={{ marginRight: 8, padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>סגור</button>
            </div>
          </div>
        )}
      </div>
  )

  if (embedded) return content
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55 }} onClick={onClose}>
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={MODAL_CLOSE_X} aria-label="סגור">
          <X size={20} />
        </button>
        {content}
      </div>
    </div>
  )
}

const STAFF_ROLES = [
  { id: 'door_staff', label: 'צוות כניסות' },
  { id: 'table_manager', label: 'מנהל שולחנות' },
  { id: 'bar_staff', label: 'צוות בר' },
  { id: 'promoter_manager', label: 'מנהל יחצ"נים' },
]

function EventDetailDrawer({ event, businessId, onClose, onEdit, onRefresh, initialTab = 'overview' }) {
  const [drawerTab, setDrawerTab] = useState(initialTab)
  useEffect(() => { setDrawerTab(initialTab) }, [initialTab])
  const [analytics, setAnalytics] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [eventStaff, setEventStaff] = useState([])
  const [eventPromoters, setEventPromoters] = useState([])
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [selStaffId, setSelStaffId] = useState('')
  const [selRoleId, setSelRoleId] = useState('')
  const [createCampaignTemplate, setCreateCampaignTemplate] = useState(null)
  const [pendingApprovals, setPendingApprovals] = useState([])
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    if (!event?.id) return
    Promise.all([
      fetch(`${API_BASE}/api/admin/events/${event.id}/analytics`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/admin/events/${event.id}/campaigns`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/admin/events/${event.id}/staff`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/admin/events/${event.id}/promoters`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/admin/events/${event.id}/pending-approvals`).then(r => r.ok ? r.json() : []),
    ]).then(([a, c, s, p, pend]) => {
      setAnalytics(a); setCampaigns(Array.isArray(c) ? c : []); setEventStaff(Array.isArray(s) ? s : []); setEventPromoters(Array.isArray(p) ? p : []);
      setPendingApprovals(Array.isArray(pend) ? pend : []);
    }).catch(() => {})
  }, [event?.id])

  useEffect(() => {
    if (addStaffOpen && businessId) {
      fetch(`${API_BASE}/api/staff?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setStaffList).catch(() => setStaffList([]))
    }
  }, [addStaffOpen, businessId])

  const addStaff = async () => {
    if (!selStaffId) return
    try {
      const r = await fetch(`${API_BASE}/api/admin/events/${event.id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_member_id: selStaffId, role_override: STAFF_ROLES.find(r => r.id === selRoleId)?.label || selRoleId }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'שגיאה')
      toast.success('חבר צוות נוסף')
      setAddStaffOpen(false)
      setSelStaffId('')
      setSelRoleId('')
      fetch(`${API_BASE}/api/admin/events/${event.id}/staff`).then(r => r.ok ? r.json() : []).then(setEventStaff)
    } catch (e) { toast.error(e.message) }
  }

  const removeStaff = async (memberId) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/events/${event.id}/staff/${memberId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('שגיאה')
      toast.success('הוסר מאירוע')
      fetch(`${API_BASE}/api/admin/events/${event.id}/staff`).then(r => r.ok ? r.json() : []).then(setEventStaff)
    } catch (e) { toast.error(e.message) }
  }

  const statusLabel = s => ({ draft: 'טיוטה', published: 'פעיל', active: 'פעיל', cancelled: 'בוטל', archived: 'הסתיים' }[s] || s)
  const statusColor = s => ({ draft: 'var(--v2-gray-400)', published: 'var(--v2-primary)', active: 'var(--v2-primary)', cancelled: '#ef4444', archived: '#3b82f6' }[s] || 'var(--v2-gray-400)')
  const eventLink = `${FRONTEND_URL}/e/${event?.slug}`
  const eventDate = event?.doors_open || event?.date || event?.event_end

  const drawerTabs = [
    { id: 'overview', label: 'סקירה', badge: pendingApprovals.length > 0 ? `${pendingApprovals.length} ממתינים` : null },
    { id: 'campaigns', label: 'קמפיינים' },
    { id: 'promoters', label: 'יחצ"נים' },
    { id: 'staff', label: 'צוות' },
    { id: 'stats', label: 'סטטיסטיקות' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 201 }} onClick={onClose} />
      <div dir="rtl" style={{
        position: 'relative', zIndex: 202, width: isMobile ? '100%' : 600, maxWidth: '100%',
        background: 'var(--v2-dark-2)', boxShadow: '-4px 0 24px rgba(0,0,0,0.4)', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: 20, borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{event?.title}</h2>
              {eventDate && <div style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>{new Date(eventDate).toLocaleDateString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
            </div>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }} aria-label="סגור"><ChevronLeft size={22} color="#00C37A" /></button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: statusColor(event?.status || 'draft'), color: (event?.status === 'published' || event?.status === 'active') ? 'var(--v2-dark)' : '#fff' }}>
              {statusLabel(event?.status || 'draft')}
            </span>
            <button onClick={() => { onClose(); onEdit(event) }} style={{ padding: '8px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>ערוך אירוע</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px', borderBottom: '1px solid var(--glass-border)', overflowX: 'auto' }}>
          {drawerTabs.map(t => (
            <button key={t.id} onClick={() => setDrawerTab(t.id)} style={{ padding: '8px 14px', borderRadius: 8, background: drawerTab === t.id ? 'var(--v2-primary)' : 'transparent', color: drawerTab === t.id ? 'var(--v2-dark)' : 'var(--v2-gray-400)', border: 'none', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>{t.label}{t.badge && <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 10 }}>{t.badge}</span>}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {drawerTab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4 }}>כרטיסים שנמכרו</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{analytics?.total_sold ?? 0}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4 }}>הכנסה</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>₪{analytics?.revenue ?? 0}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4 }}>יחצ"נים</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{eventPromoters?.length ?? 0}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4 }}>צוות</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{eventStaff?.length ?? 0}</div>
                </div>
              </div>
              {pendingApprovals.length > 0 && (
                <div style={{ marginBottom: 24, padding: 16, background: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>ממתינים לאישור</div>
                  {pendingApprovals.map(o => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)', gap: 12 }}>
                      <div>
                        <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><User size={14} color="#00C37A" />{(o.first_name || '') + ' ' + (o.last_name || '') || 'לקוח'}</span>
                        <span style={{ color: 'var(--v2-gray-400)', marginRight: 8 }}> — {o.phone}</span>
                        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{o.created_at ? new Date(o.created_at).toLocaleString('he-IL') : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={async () => { try { const r = await fetch(`${API_BASE}/api/admin/orders/${o.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved_by: 'dashboard' }) }); if (!r.ok) throw new Error(); const pend = await fetch(`${API_BASE}/api/admin/events/${event.id}/pending-approvals`).then(res => res.json()); setPendingApprovals(pend); toast.success('אושר'); onRefresh?.(); } catch (e) { toast.error('שגיאה') } }} style={{ padding: '6px 12px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} color="var(--v2-dark)" /> אשר</button>
                        <button onClick={async () => { try { const r = await fetch(`${API_BASE}/api/admin/orders/${o.id}/reject`, { method: 'POST' }); if (!r.ok) throw new Error(); const pend = await fetch(`${API_BASE}/api/admin/events/${event.id}/pending-approvals`).then(res => res.json()); setPendingApprovals(pend); toast.success('נדחה'); onRefresh?.(); } catch (e) { toast.error('שגיאה') } }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={14} color="#ef4444" /> דחה</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>לינק ציבורי</div>
                <div style={{ padding: 12, background: 'var(--v2-dark-3)', borderRadius: 8, marginBottom: 8, wordBreak: 'break-all' }}>{eventLink}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigator.clipboard?.writeText(eventLink).then(() => toast.success('הועתק'))} style={{ padding: '8px 14px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>העתק</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(eventLink)}`} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', background: '#25D366', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
                  <a href={eventLink} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>פתח</a>
                </div>
              </div>
            </>
          )}

          {drawerTab === 'campaigns' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {[
                  { key: 'event_invite', Icon: Mail, title: 'הזמנה לאירוע', desc: 'שלח שבוע לפני האירוע', preview: 'היי {{שם}}, מזמינים אותך ל...' },
                  { key: 'event_reminder', Icon: Clock, title: 'תזכורת', desc: 'שלח יום לפני האירוע', preview: 'מחר! {{שם_אירוע}} — הכרטיס שלך:' },
                  { key: 'event_followup', Icon: Sparkles, title: 'Follow-up', desc: 'שלח יום אחרי האירוע', preview: 'תודה שהגעת! הנה הטבה לאירוע הבא:' },
                ].map(tpl => {
                  const TplIcon = tpl.Icon
                  return (
                  <div key={tpl.key} style={{ padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 18, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><TplIcon size={20} color="#00C37A" /> {tpl.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>{tpl.desc}</div>
                    <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 12, fontStyle: 'italic' }}>{tpl.preview}</div>
                    <button onClick={() => setCreateCampaignTemplate(tpl.key)} style={{ padding: '8px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>צור קמפיין</button>
                  </div>
                  )
                })}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>קמפיינים קיימים</div>
                {campaigns.map(c => (
                  <div key={c.id} style={{ padding: 12, background: 'var(--v2-dark-3)', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{c.name || 'קמפיין'} — {c.status} (נשלח: {c.sent_count ?? 0})</span>
                  </div>
                ))}
                <Link to="/dashboard/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--v2-primary)', textDecoration: 'none', fontSize: 14 }}>צור קמפיין מותאם אישית →</Link>
              </div>
            </>
          )}

          {drawerTab === 'promoters' && (
            <PromotersModal event={event} businessId={businessId} onClose={() => {}} embedded />
          )}

          {drawerTab === 'staff' && (
            <>
              {eventStaff.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--v2-dark-3)', borderRadius: 12, marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>חבר צוות #{s.business_member_id?.slice(0, 8)}</span>
                    <span style={{ color: 'var(--v2-gray-400)', marginRight: 8 }}> — {s.role_override || s.role}</span>
                  </div>
                  <button onClick={() => removeStaff(s.business_member_id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>הסר מאירוע</button>
                </div>
              ))}
              {!addStaffOpen ? (
                <button onClick={() => setAddStaffOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>+ הוסף מהצוות</button>
              ) : (
                <div style={{ marginTop: 16, padding: 20, background: 'var(--v2-dark-3)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ marginBottom: 12 }}>הוסף צוות לאירוע</h4>
                  <CustomSelect
                    value={selStaffId}
                    onChange={(val) => setSelStaffId(val)}
                    style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }}
                    placeholder="בחר חבר צוות"
                    options={[
                      { value: '', label: 'בחר חבר צוות' },
                      ...staffList.filter(m => !eventStaff.some(es => es.business_member_id === m.id)).map(m => ({ value: m.id, label: `חבר #${m.id?.slice(0, 8)}` })),
                    ]}
                  />
                  <CustomSelect
                    value={selRoleId}
                    onChange={(val) => setSelRoleId(val)}
                    style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff' }}
                    placeholder="תפקיד באירוע"
                    options={[
                      { value: '', label: 'תפקיד באירוע' },
                      ...STAFF_ROLES.map(r => ({ value: r.id, label: r.label })),
                    ]}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addStaff} disabled={!selStaffId} style={{ padding: '10px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: selStaffId ? 'pointer' : 'not-allowed' }}>שלח SMS עם פרטי האירוע</button>
                    <button onClick={() => setAddStaffOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                  </div>
                  <Tooltip text="חברי צוות שתוסיף כאן יקבלו SMS עם לינק הסריקה ופרטי האירוע שלהם" />
                </div>
              )}
            </>
          )}

          {drawerTab === 'stats' && (
            <div>
              <div style={{ marginBottom: 16 }}>מכירות לפי יום — (גרף יתווסף)</div>
              <div style={{ marginBottom: 16 }}>מכירות לפי יחצ"ן — (גרף יתווסף)</div>
              <div style={{ marginBottom: 16 }}>כניסות לפי שעה — (גרף יתווסף)</div>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>top 3 יחצ"נים • top 3 סוגי כרטיסים</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Events() {
  const navigate = useNavigate()
  const eventsAllowed = useRequirePermission('can_view_events')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('הכל')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { session, businessId } = useAuth()
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId
  }), [session, businessId])
  const loadEvents = useCallback(() => {
    if (!businessId) return
    fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setEvents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [businessId, authHeaders])
  const [staffModalEvent, setStaffModalEvent] = useState(null)
  const [promotersModalEvent, setPromotersModalEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [detailEventTab, setDetailEventTab] = useState('overview')
  const [floorStatusEvent, setFloorStatusEvent] = useState(null)
  const [staffTokens, setStaffTokens] = useState([])
  const [newTokenLabel, setNewTokenLabel] = useState('')
  const [newTokenResult, setNewTokenResult] = useState(null)
  const [editModalEvent, setEditModalEvent] = useState(null)

  useEffect(() => {
    if (!businessId) return
    loadEvents()
  }, [businessId, loadEvents])

  const filteredEvents = events.filter(e => {
    // הצג את כל האירועים של העסק — לא לסנן לפי portal_visible
    const matchTab =
      activeTab === 'הכל' ? true
        : activeTab === 'פעילים' ? (e.status === 'active' || e.status === 'published')
          : activeTab === 'טיוטות' ? e.status === 'draft'
            : (activeTab === 'הסתיימו' || activeTab === 'הסתיים') ? (e.status === 'ended' || e.status === 'archived')
              : true
    return matchTab
  })

  const formatEventDate = (dateVal) => {
    if (!dateVal) return '—'
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return '—'
      const date = d.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jerusalem',
      })
      const time = d.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jerusalem',
      })
      return `${date} · ${time}`
    } catch {
      return '—'
    }
  }

  const eventCardUiStatus = (ev) => {
    const s = ev.status || 'draft'
    if (s === 'draft') return 'draft'
    if (s === 'published' || s === 'active') return 'active'
    return 'ended'
  }

  const eventCapacityApprox = (ev) => {
    if (ev.capacity != null && ev.capacity !== '') return Number(ev.capacity) || 0
    const types = ev.ticket_types
    if (Array.isArray(types) && types.length) {
      return types.reduce((sum, t) => sum + (Number(t.quantity_total) || 0), 0)
    }
    return 0
  }

  const openEditFromCard = (ev) => {
    setEditModalEvent(ev)
  }

  const openCampaignFromCard = (ev) => {
    setDetailEvent(ev)
    setDetailEventTab('campaigns')
  }

  const openStatsFromCard = (ev) => {
    setDetailEvent(ev)
    setDetailEventTab('stats')
  }

  const handleDuplicate = async (ev) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${ev.id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      setEvents(prev => [data, ...prev])
      toast.success('האירוע שוכפל')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  const handleDelete = async (ev) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${ev.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('שגיאה')
      setEvents(prev => prev.filter(e => e.id !== ev.id))
      setDeleteConfirm(null)
      toast.success('האירוע נמחק')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  const openStaffModal = async ev => {
    setStaffModalEvent(ev)
    setNewTokenResult(null)
    setNewTokenLabel('')
    try {
      const r = await fetch(`${API_BASE}/api/admin/events/${ev.id}/staff-tokens`)
      const data = r.ok ? await r.json() : []
      setStaffTokens(Array.isArray(data) ? data : [])
    } catch {
      setStaffTokens([])
    }
  }

  const addStaffToken = async () => {
    if (!staffModalEvent) return
    try {
      const r = await fetch(`${API_BASE}/api/admin/events/${staffModalEvent.id}/staff-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newTokenLabel || 'עמדת סריקה' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setNewTokenResult({ token: data.token, scan_url: data.scan_url })
      setStaffTokens(prev => [...prev, { token: data.token, label: newTokenLabel || 'עמדת סריקה', scans_count: 0 }])
      toast.success('עמדת סריקה נוצרה')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  const copyToClipboard = str => {
    navigator.clipboard?.writeText(str).then(() => toast.success('הועתק')).catch(() => toast.error('העתקה נכשלה'))
  }

  if (!eventsAllowed) return null

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>אירועים</h1>
        <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Megaphone size={16} color="#00C37A" aria-hidden />
          צור וניהל אירועים, שלח קמפיינים, עקוב אחר מכירות והגעה
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['הכל', 'טיוטות', 'פעילים', 'הסתיים'].map(tabLabel => (
            <button
              key={tabLabel}
              type="button"
              onClick={() => setActiveTab(tabLabel)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: activeTab === tabLabel ? 'none' : '1px solid var(--glass-border)',
                background: activeTab === tabLabel ? 'rgba(0,195,122,0.12)' : 'transparent',
                color: activeTab === tabLabel ? 'var(--v2-primary)' : 'var(--text)',
                fontWeight: activeTab === tabLabel ? 700 : 400,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {tabLabel}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/events/new')}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#00C37A',
            color: '#000',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={18} /> צור אירוע
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
      ) : filteredEvents.length === 0 ? (
        <div
          style={{
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 48,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <Calendar size={40} color="#00C37A" />
            <Music size={32} color="var(--v2-gray-400)" />
            <Star size={28} color="#00C37A" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>אין אירועים עדיין</div>
          <div style={{ color: 'var(--v2-gray-400)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Eye size={16} color="#00C37A" />
            צור אירוע ראשון וקבל קישור לשיתוף
            <Share2 size={16} color="#00C37A" />
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/events/new')}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--v2-primary)',
              color: 'var(--v2-dark)',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Plus size={18} />
            צור אירוע
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20,
        }}
        >
          {filteredEvents.map(ev => {
            const uiStatus = eventCardUiStatus(ev)
            const dateRaw = ev.date || ev.doors_open || ev.event_end || ev.created_at
            return (
              <div
                key={ev.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/events/${ev.id}`)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/dashboard/events/${ev.id}`) } }}
                style={{
                  background: 'var(--card)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                  {ev.cover_image_url || ev.image_url ? (
                    <img
                      src={ev.cover_image_url || ev.image_url}
                      alt={ev.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #1a1d2e 0%, #2a2d3e 100%)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#00C37A', letterSpacing: 3 }}>AXESS</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>העלאת תמונת אירוע</span>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))',
                  }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: uiStatus === 'active' ? '#00C37A' : uiStatus === 'draft' ? '#F59E0B' : 'rgba(255,255,255,0.2)',
                    color: uiStatus === 'active' ? '#000' : '#fff',
                  }}
                  >
                    {uiStatus === 'active' ? 'פעיל' : uiStatus === 'draft' ? 'טיוטה' : 'הסתיים'}
                  </span>
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                  }}
                  >
                    {ev.event_category || 'אירוע'}
                  </span>
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>{ev.title}</h3>
                  {ev.event_number && (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.3)',
                        fontFamily: 'monospace',
                        display: 'block',
                        marginBottom: 8,
                      }}
                    >
                      #{ev.event_number}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>
                    <Calendar size={14} color="#00C37A" />
                    <span>{formatEventDate(dateRaw)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>
                    <MapPin size={14} color="#00C37A" />
                    <span>{ev.location || ev.venue_name}</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 8,
                    padding: '10px 0',
                    borderTop: '1px solid var(--glass-border)',
                    borderBottom: '1px solid var(--glass-border)',
                    margin: '10px 0 14px',
                  }}
                  >
                    {[
                      { icon: <CheckCircle size={13} color="#00C37A" />, value: ev.approved_count ?? 0, label: 'מאושרים' },
                      { icon: <Clock size={13} color="#F59E0B" />, value: ev.pending_count ?? 0, label: 'ממתינים' },
                      { icon: <Eye size={13} color="#3B82F6" />, value: ev.views_count ?? 0, label: 'צפיות' },
                      { icon: <DollarSign size={13} color="#00C37A" />, value: `₪${Number(ev.revenue ?? 0).toLocaleString()}`, label: 'הכנסה' },
                    ].map(kpi => (
                      <div key={kpi.label} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                          {kpi.icon}
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{kpi.value}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--v2-gray-400)' }}>{kpi.label}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <a
                      href={`https://axess.pro/e/${ev.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: '#00C37A',
                        textDecoration: 'none',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink size={12} /> צפה באירוע
                    </a>
                    {/* כפתור פרסום — רק לטיוטות, מיושר לשמאל */}
                    {ev.status === 'draft' && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const res = await fetch(`${API_BASE}/api/admin/events/${ev.id}/publish`, {
                              method: 'POST',
                              headers: authHeaders(),
                            })
                            const data = await res.json()
                            if (res.ok) {
                              toast.success('האירוע פורסם בהצלחה!')
                              loadEvents()
                            } else {
                              toast.error(data.message || 'שגיאה בפרסום')
                            }
                          } catch (e) {
                            toast.error('שגיאה בפרסום')
                          }
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#00C37A',
                          color: '#000',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        פרסם
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openEditFromCard(ev) }}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--glass)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 13,
                      }}
                    >
                      <Edit size={14} color="#00C37A" /> ערוך
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openCampaignFromCard(ev) }}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(0,195,122,0.12)',
                        color: '#00C37A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Send size={14} /> קמפיין
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openStatsFromCard(ev) }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--glass)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BarChart2 size={14} color="#00C37A" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floor Status Modal */}
      {floorStatusEvent && (
        <FloorStatusModal event={floorStatusEvent} onClose={() => setFloorStatusEvent(null)} />
      )}

      {editModalEvent && (
        <EventEditModal
          eventId={editModalEvent?.id}
          event={editModalEvent}
          onClose={() => {
            setEditModalEvent(null)
            loadEvents()
          }}
          onSave={() => {
            loadEvents()
          }}
          authHeaders={authHeaders}
          businessId={businessId}
        />
      )}

      {/* Event Detail Drawer */}
      {detailEvent && (
        <EventDetailDrawer
          key={detailEvent.id}
          event={detailEvent}
          businessId={businessId}
          initialTab={detailEventTab}
          onClose={() => { setDetailEvent(null); setDetailEventTab('overview') }}
          onEdit={(ev) => { setDetailEvent(null); setDetailEventTab('overview'); setEditModalEvent(ev) }}
          onRefresh={() => fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setEvents)}
        />
      )}

      {/* Promoters Modal */}
      {promotersModalEvent && (
        <PromotersModal
          event={promotersModalEvent}
          businessId={businessId}
          onClose={() => setPromotersModalEvent(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setDeleteConfirm(null)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: 12 }}>מחק אירוע?</h3>
            <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>"{deleteConfirm.title}" — פעולה זו לא ניתנת לביטול.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 14, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff', cursor: 'pointer' }}>ביטול</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: 14, background: '#ef4444', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>מחק</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Scan Tokens Modal */}
      {staffModalEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => { setStaffModalEvent(null); setNewTokenResult(null) }}
        >
          <div
            style={{
              position: 'relative',
              background: 'var(--v2-dark-2)',
              borderRadius: 'var(--radius-lg)',
              padding: 32,
              maxWidth: 480,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { setStaffModalEvent(null); setNewTokenResult(null) }}
              style={MODAL_CLOSE_X}
              aria-label="סגור"
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><QrCode size={22} color="#00C37A" /> עמדות סריקה — {staffModalEvent.title}</h2>
            <div style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 24 }}>צור לינקים לעמדות סריקה בודדות (כניסה ראשית, בר, VIP וכו׳)</div>

            {/* Existing tokens */}
            {staffTokens.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {staffTokens.map(t => (
                  <div
                    key={t.id || t.token}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      background: 'var(--v2-dark-3)',
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{t.label || 'עמדת סריקה'}</span>
                      <span style={{ color: 'var(--v2-gray-400)', marginRight: 8 }}> — {t.scans_count || 0} סריקות</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${FRONTEND_URL}/scan/${staffModalEvent.slug}?token=${t.token}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        background: 'var(--v2-primary)',
                        color: 'var(--v2-dark)',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      <Copy size={14} />
                      העתק לינק
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new token */}
            {newTokenResult ? (
              <div
                style={{
                  padding: 16,
                  background: 'rgba(0,195,122,0.15)',
                  border: '1px solid var(--v2-primary)',
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>לינק חדש נוצר</div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 12, wordBreak: 'break-all' }}>{newTokenResult.scan_url}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button
                    onClick={() => copyToClipboard(newTokenResult.scan_url)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      background: 'var(--v2-primary)',
                      color: 'var(--v2-dark)',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <Copy size={16} />
                    העתק לינק
                  </button>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(newTokenResult.scan_url)}`}
                    alt="QR"
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                  />
                </div>
                <button
                  onClick={() => setNewTokenResult(null)}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 8,
                    color: 'var(--v2-gray-400)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  הוסף עמדה נוספת
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)', fontSize: 14 }}>שם העמדה (למשל: כניסה ראשית, בר, VIP)</label>
                <input
                  value={newTokenLabel}
                  onChange={e => setNewTokenLabel(e.target.value)}
                  placeholder="כניסה ראשית"
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    marginBottom: 12,
                  }}
                />
                <button
                  onClick={addStaffToken}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--v2-primary)',
                    color: 'var(--v2-dark)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Key size={18} />
                  הוסף עמדה
                </button>
              </div>
            )}

            <button
              onClick={() => { setStaffModalEvent(null); setNewTokenResult(null) }}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                color: 'var(--v2-gray-400)',
                cursor: 'pointer',
              }}
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
