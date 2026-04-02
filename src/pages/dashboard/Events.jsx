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
  Check, X, Save, Mail, Sparkles, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import SeatingBuilder from '../../components/SeatingBuilder'
import Tooltip from '../../components/ui/Tooltip'
import DateTimePicker from '../../components/ui/DateTimePicker'
import RichTextEditor from '../../components/ui/RichTextEditor'
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

function MenuBuilderModal({ businessId, onClose }) {
  const [name, setName] = useState('')
  const [categories, setCategories] = useState([{ name: '', items: [] }])
  const [saving, setSaving] = useState(false)
  const addCategory = () => setCategories(c => [...c, { name: '', items: [] }])
  const addItem = (ci) => setCategories(c => c.map((cat, i) => i === ci ? { ...cat, items: [...cat.items, { name: '', price: 0, description: '', image_url: '' }] } : cat))
  const updateCat = (ci, fn, v) => setCategories(c => c.map((cat, i) => i === ci ? { ...cat, [fn]: v } : cat))
  const updateItem = (ci, ii, fn, v) => setCategories(c => c.map((cat, i) => i === ci ? { ...cat, items: cat.items.map((it, j) => j === ii ? { ...it, [fn]: v } : it) } : cat))

  const handleSave = async (asDraft = true) => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const items = categories.flatMap(c => c.items.filter(i => i.name).map(i => ({ name: i.name, price: i.price, description: i.description, category: c.name || null })))
      const res = await fetch(`${API_BASE}/api/admin/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, name: name.trim(), items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('התפריט נשמר')
      onClose()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'relative', zIndex: 301, background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()} dir="rtl">
        <button type="button" onClick={onClose} style={MODAL_CLOSE_X} aria-label="סגור">
          <X size={20} />
        </button>
        <h3 style={{ marginBottom: 20 }}>צור תפריט חדש</h3>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="שם התפריט" style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
        {categories.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 20, padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
            <input value={cat.name} onChange={e => updateCat(ci, 'name', e.target.value)} placeholder="שם קטגוריה" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
            {cat.items.map((it, ii) => (
              <div key={ii} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <input value={it.name} onChange={e => updateItem(ci, ii, 'name', e.target.value)} placeholder="שם פריט" style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                <input type="number" value={it.price} onChange={e => updateItem(ci, ii, 'price', parseFloat(e.target.value) || 0)} placeholder="מחיר" style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                <input value={it.description} onChange={e => updateItem(ci, ii, 'description', e.target.value)} placeholder="תיאור" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
              </div>
            ))}
            <button onClick={() => addItem(ci)} style={{ padding: '8px 16px', background: 'transparent', border: '1px dashed var(--glass-border)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13 }}>הוסף פריט</button>
          </div>
        ))}
        <button onClick={addCategory} style={{ marginBottom: 20, padding: '10px 16px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>הוסף קטגוריה</button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => handleSave(true)} disabled={saving || !name.trim()} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', cursor: saving ? 'wait' : 'pointer' }}>שמור כטיוטה</button>
          <button onClick={() => handleSave(false)} disabled={saving || !name.trim()} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: saving ? 'wait' : 'pointer' }}>פרסם</button>
          <button onClick={onClose} style={{ padding: 14, borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', cursor: 'pointer', background: 'transparent' }}>ביטול</button>
        </div>
      </div>
    </div>
  )
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

function LayoutBuilderModal({ businessId, onClose }) {
  const [name, setName] = useState('')
  const [config, setConfig] = useState(null)

  const handleSave = (cfg) => {
    if (!name.trim()) { toast.error('הזן שם לסקיצה'); return }
    fetch(`${API_BASE}/api/admin/layouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId, name: name.trim(), template_type: cfg.template_type || 'theater', config: cfg }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        toast.success('הסקיצה נשמרה')
        onClose()
      })
      .catch(e => toast.error(e.message || 'שגיאה'))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'relative', zIndex: 301, background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()} dir="rtl">
        <button type="button" onClick={onClose} style={MODAL_CLOSE_X} aria-label="סגור">
          <X size={20} />
        </button>
        <h3 style={{ marginBottom: 16 }}>צור סקיצה חדשה</h3>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="שם הסקיצה (למשל: תצורת שולחנות VIP)" style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
        <SeatingBuilder eventId={null} initialConfig={config} onSave={(cfg) => handleSave(cfg)} onCancel={onClose} />
      </div>
    </div>
  )
}

const defaultForm = () => ({
  title: '',
  doors_open: null,
  event_end: null,
  venue_name: '',
  venue_address: '',
  venue_maps_url: '',
  rich_description: '',
  age_restriction: 0,
  dress_code: '',
  cover_image_url: '',
  gallery_urls: [],
  ticket_types: [{ name: 'כניסה', price: 0, quantity_total: null }],
  show_remaining: false,
  allow_waitlist: false,
  linked_menu_ids: [],
  linked_layout_ids: [],
  seating: null,
  primary_color: 'var(--v2-primary)',
  approval_required: false,
  approval_instagram: '',
  requires_id: false,
  resident_only_price: null,
  non_resident_price: null,
  city_code: '',
  city_name: '',
  branding: {
    logo_url: '',
    primary_color: '#00C37A',
    secondary_color: '#64748b',
    bg_color: '#0a0a0a',
    font_style: 'modern',
  },
})

const BRANDING_PRESETS = [
  '#00C37A', '#2563EB', '#A855F7', '#E85D04', '#EC4899', '#64748b',
]
const FONT_STYLES = [
  { id: 'modern', label: 'מודרני' },
  { id: 'classic', label: 'קלאסי' },
  { id: 'minimal', label: 'מינימל' },
]

export default function Events() {
  const navigate = useNavigate()
  const eventsAllowed = useRequirePermission('can_view_events')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardTemplate, setWizardTemplate] = useState('regular')
  const [activeTab, setActiveTab] = useState('הכל')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(defaultForm())
  const [menus, setMenus] = useState([])
  const [layouts, setLayouts] = useState([])
  const [menuBuilderOpen, setMenuBuilderOpen] = useState(false)
  const [layoutBuilderOpen, setLayoutBuilderOpen] = useState(false)
  const [publishSuccessEvent, setPublishSuccessEvent] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { session, businessId } = useAuth()
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId
  }), [session, businessId])
  const loadEvents = useCallback(() => {
    if (!businessId || businessId === 'null') return
    fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents)
  }, [businessId, authHeaders])
  const [staffModalEvent, setStaffModalEvent] = useState(null)
  const [promotersModalEvent, setPromotersModalEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [detailEventTab, setDetailEventTab] = useState('overview')
  const [floorStatusEvent, setFloorStatusEvent] = useState(null)
  const [staffTokens, setStaffTokens] = useState([])
  const [newTokenLabel, setNewTokenLabel] = useState('')
  const [newTokenResult, setNewTokenResult] = useState(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [closeWizardModalOpen, setCloseWizardModalOpen] = useState(false)
  const [draftDeleteConfirm, setDraftDeleteConfirm] = useState(null)
  const [editModalEvent, setEditModalEvent] = useState(null)

  const saveDraft = () => {
    const draftsArr = JSON.parse(localStorage.getItem('axess_event_drafts') || '[]')
    const draftId = form.draftId || Date.now()
    const existing = draftsArr.findIndex(d => d.draftId === draftId)
    const draft = {
      ...form,
      draftId,
      savedAt: new Date().toISOString(),
      status: 'draft'
    }
    if (existing >= 0) draftsArr[existing] = draft
    else draftsArr.unshift(draft)
    localStorage.setItem('axess_event_drafts', JSON.stringify(draftsArr.slice(0, 10)))
    if (!form.draftId) setForm(f => ({ ...f, draftId }))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
    setDrafts(JSON.parse(localStorage.getItem('axess_event_drafts') || '[]'))
  }

  useEffect(() => {
    if (!businessId || businessId === 'null') return;
    fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [businessId, authHeaders])

  useEffect(() => {
    if (!businessId) return
    Promise.all([
      fetch(`${API_BASE}/api/admin/menus?business_id=${businessId}`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/admin/layouts?business_id=${businessId}`).then(r => r.ok ? r.json() : []),
    ]).then(([m, l]) => { setMenus(m); setLayouts(l) }).catch(() => {})
  }, [businessId])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('axess_event_drafts') || '[]')
    setDrafts(saved)
  }, [])

  useEffect(() => {
    if (!form.title) return
    const timer = setTimeout(() => { saveDraft() }, 2000)
    return () => clearTimeout(timer)
  }, [form])

  const openWizard = (template = 'regular') => {
    setWizardTemplate(template)
    setForm(defaultForm())
    if (template === 'theater') setForm(f => ({ ...f, seating: { enabled: true, template_type: 'theater' } }))
    if (template === 'tables') setForm(f => ({ ...f, seating: { enabled: true, template_type: 'club' } }))
    setStep(1)
    setCloseWizardModalOpen(false)
    setWizardOpen(true)
  }

  const requestCloseWizard = () => setCloseWizardModalOpen(true)
  const doCloseWizard = () => {
    saveDraft()
    setWizardOpen(false)
    setCloseWizardModalOpen(false)
    setForm(defaultForm())
    setStep(1)
  }

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
      return new Date(dateVal).toLocaleDateString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
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

  const addTicketType = () => {
    setForm(f => ({ ...f, ticket_types: [...f.ticket_types, { name: '', price: 0, quantity_total: null }] }))
  }
  const updateTicketType = (i, field, val) => {
    setForm(f => ({
      ...f,
      ticket_types: f.ticket_types.map((t, j) => j === i ? { ...t, [field]: val } : t),
    }))
  }

  const buildEventPayload = () => ({
    business_id: businessId,
    title: form.title,
    date: form.doors_open || form.event_end || null,
    doors_open: form.doors_open || null,
    event_end: form.event_end || null,
    venue_name: form.venue_name || null,
    venue_address: form.venue_address || null,
    venue_maps_url: form.venue_maps_url || null,
    location: form.venue_address || form.venue_name,
    location_url: form.venue_maps_url,
    rich_description: form.rich_description || null,
    age_restriction: form.age_restriction ?? 0,
    dress_code: form.dress_code || null,
    cover_image_url: form.cover_image_url || null,
    image_url: form.cover_image_url || form.image_url,
    gallery_urls: form.gallery_urls || [],
    display_config: {
      primary_color: form.primary_color,
      show_remaining: form.show_remaining,
      allow_waitlist: form.allow_waitlist,
    },
    settings: { show_remaining: form.show_remaining, auto_waitlist: form.allow_waitlist },
    approval_required: form.approval_required || false,
    approval_instagram: form.approval_instagram || null,
    requires_id: form.requires_id || false,
    resident_only_price: form.resident_only_price ?? null,
    non_resident_price: form.non_resident_price ?? null,
    city_code: form.city_code || null,
    city_name: form.city_name || null,
    ticket_types: form.ticket_types.filter(t => t.name),
    branding: form.branding || {},
  })

  const handleCreate = async (asDraft = true, seatingConfig) => {
    const seating = seatingConfig ?? form.seating
    try {
      const body = buildEventPayload()
      const res = await fetch(`${API_BASE}/api/admin/events`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      if (seating?.enabled && data.id && seating.seats?.length > 0) {
        const seatRes = await fetch(`${API_BASE}/api/admin/events/${data.id}/seating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template_type: seating.template_type, seats: seating.seats, zones: seating.zones || [] }),
        })
        if (!seatRes.ok) toast.error('מפת ישיבה לא נשמרה')
      }
      if (form.linked_menu_ids?.length) {
        for (const mid of form.linked_menu_ids) {
          await fetch(`${API_BASE}/api/admin/events/${data.id}/menus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ menu_id: mid }),
          })
        }
      }
      if (form.linked_layout_ids?.length) {
        for (const lid of form.linked_layout_ids) {
          await fetch(`${API_BASE}/api/admin/events/${data.id}/layouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ venue_layout_id: lid }),
          })
        }
      }
      if (!asDraft) {
        const pubRes = await fetch(`${API_BASE}/api/admin/events/${data.id}/publish`, { method: 'POST' })
        if (pubRes.ok) {
          setPublishSuccessEvent({ ...data, slug: (await pubRes.json()).slug || data.slug })
          setWizardOpen(false)
          setStep(1)
        }
      }
      setEvents(prev => [data, ...prev])
      setWizardOpen(false)
      setForm(defaultForm())
      setStep(1)
      toast.success(asDraft ? 'האירוע נשמר כטיוטה' : 'האירוע פורסם!')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  const handlePublish = async () => {
    await handleCreate(false)
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

  const wizardSteps = ['פרטים בסיסיים', 'מיקום', 'תיאור', 'תמונות', 'כרטיסים', 'תפריט וסקיצה', 'עיצוב', 'סיכום']

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
          onClick={() => openWizard('regular')}
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

      {/* טיוטות שמורות */}
      {drafts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>טיוטות שמורות ({drafts.length})</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {drafts.map(d => {
              const savedAt = d.savedAt ? new Date(d.savedAt).getTime() : 0
              const mins = Math.floor((Date.now() - savedAt) / 60000)
              const hours = Math.floor(mins / 60)
              const timeStr = hours > 0 ? `לפני ${hours} שעות` : mins > 0 ? `לפני ${mins} דקות` : 'עכשיו'
              return (
                <div key={d.draftId} style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 12, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.title || 'ללא שם'}</div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>נשמר: {timeStr}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => { setForm(d); setStep(1); setWizardOpen(true); setCloseWizardModalOpen(false) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><Edit size={14} color="var(--v2-dark)" /> ערוך</button>
                    <button type="button" onClick={() => setDraftDeleteConfirm(d)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><Trash2 size={14} color="#00C37A" /> מחק</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
            onClick={() => openWizard()}
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
            const dateRaw = ev.doors_open || ev.date || ev.event_end
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
                  <img
                    src={ev.cover_image_url || ev.image_url || 'https://images.unsplash.com/photo-1540039155733?w=600'}
                    alt={ev.title || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>
                    <Calendar size={14} color="#00C37A" />
                    <span>{formatEventDate(ev.date || dateRaw)}</span>
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
                      marginBottom: 12,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={12} /> צפה באירוע
                  </a>

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

      {/* Wizard Modal — 7 steps */}
      {wizardOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 199 }} onClick={requestCloseWizard}>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'var(--v2-dark)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={requestCloseWizard} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>צור אירוע חדש</h2>
                {draftSaved && (
                  <span style={{ fontSize: 12, color: 'var(--v2-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} /> נשמר אוטומטית
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', fontSize: 12, padding: '0 16px' }}>
              {wizardSteps.map((s, i) => (
                <span key={i} style={{ padding: '4px 8px', borderRadius: 8, background: step === i + 1 ? 'var(--v2-primary)' : 'var(--v2-dark-3)', color: step === i + 1 ? 'var(--v2-dark)' : 'var(--v2-gray-400)' }}>{i + 1}. {s}</span>
              ))}
            </div>

            {/* Content area — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', paddingBottom: '100px' }}>
            {/* Step 1 — פרטים בסיסיים */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>שם האירוע *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="מסיבת ריקודים" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>פתיחת דלתות <Tooltip text="פתיחת דלתות היא השעה שהקהל יכול להיכנס. סיום האירוע הוא השעה שבה נסגרות הדלתות." /></label>
                  <DateTimePicker value={form.doors_open} onChange={v => setForm(f => ({ ...f, doors_open: v }))} placeholder="בחר תאריך ושעה" />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>סיום אירוע</label>
                  <DateTimePicker value={form.event_end} onChange={v => setForm(f => ({ ...f, event_end: v }))} placeholder="בחר תאריך ושעה" />
                </div>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="approvalReq" checked={form.approval_required} onChange={e => setForm(f => ({ ...f, approval_required: e.target.checked }))} />
                  <label htmlFor="approvalReq" style={{ color: 'var(--v2-gray-400)', cursor: 'pointer' }}>דרוש אישור ידני להרשמה</label>
                  <Tooltip text="לאחר כל הרשמה תקבל SMS עם לינק לאישור ידני. הלקוח יקבל כרטיס רק לאחר אישורך." />
                </div>
                {form.approval_required && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>לינק Instagram לאישור (אופציונלי)</label>
                    <input value={form.approval_instagram} onChange={e => setForm(f => ({ ...f, approval_instagram: e.target.value }))} placeholder="https://instagram.com/[username]" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                  </div>
                )}
              </>
            )}

            {/* Step 2 — מיקום */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>שם המקום <Tooltip text="הכתובת תוצג בכרטיס הלקוח עם כפתור ניווט" /></label>
                  <input value={form.venue_name} onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} placeholder="אולם האירועים, תל אביב" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>כתובת מלאה</label>
                  <input value={form.venue_address} onChange={e => setForm(f => ({ ...f, venue_address: e.target.value }))} placeholder="רחוב הרצל 1, תל אביב" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>לינק Google Maps</label>
                  <input value={form.venue_maps_url} onChange={e => setForm(f => ({ ...f, venue_maps_url: e.target.value }))} placeholder="https://maps.google.com/..." style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
              </>
            )}

            {/* Step 3 — תיאור */}
            {step === 3 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>תיאור האירוע <Tooltip text="תיאור עשיר יוצג בדף האירוע הציבורי" /></label>
                  <RichTextEditor value={form.rich_description} onChange={v => setForm(f => ({ ...f, rich_description: v }))} placeholder="תאר את האירוע — מה מצפה לקהל..." minHeight={200} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>גיל מינימום</label>
                  <CustomSelect
                    value={form.age_restriction}
                    onChange={(val) => setForm(f => ({ ...f, age_restriction: parseInt(val, 10) }))}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                    options={[
                      { value: 0, label: 'ללא הגבלה' },
                      { value: 18, label: '18+' },
                      { value: 21, label: '21+' },
                    ]}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>קוד לבוש (אופציונלי)</label>
                  <input value={form.dress_code} onChange={e => setForm(f => ({ ...f, dress_code: e.target.value }))} placeholder="חגיגי / קז׳ואל" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
              </>
            )}

            {/* Step 4 — תמונות */}
            {step === 4 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>תמונת שער <Tooltip text="תמונת השער מוצגת בראש דף האירוע ובתצוגה המקדימה" /></label>
                  <input type="url" value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder="הדבק URL לתמונה (או העלה מאוחר יותר)" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                  {form.cover_image_url && <img src={form.cover_image_url} alt="" style={{ marginTop: 8, maxWidth: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }} onError={e => { e.target.style.display = 'none' }} />}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>גלריה (עד 6 תמונות) <Tooltip text="תמונות נוספות בדף האירוע" /></label>
                  <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>הוסף קישורי תמונות מופרדים בפסיק</p>
                  <input value={(form.gallery_urls || []).join(', ')} onChange={e => setForm(f => ({ ...f, gallery_urls: e.target.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6) }))} placeholder="https://... , https://..." style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
              </>
            )}

            {/* Step 5 — כרטיסים */}
            {step === 5 && (
              <>
                {form.ticket_types.map((tt, i) => (
                  <div key={i} style={{ marginBottom: 16, padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                    <input value={tt.name} onChange={e => updateTicketType(i, 'name', e.target.value)} placeholder="שם סוג (למשל: VIP)" style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    <input type="number" value={tt.price} onChange={e => updateTicketType(i, 'price', parseFloat(e.target.value) || 0)} placeholder="מחיר ₪" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    <input type="number" value={tt.quantity_total ?? ''} onChange={e => updateTicketType(i, 'quantity_total', e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="כמות (ריק = ללא הגבלה)" style={{ width: '100%', padding: 10, marginTop: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                  </div>
                ))}
                <button onClick={addTicketType} style={{ marginBottom: 16, padding: 10, background: 'transparent', border: '1px dashed var(--glass-border)', borderRadius: 12, color: 'var(--v2-gray-400)', cursor: 'pointer', width: '100%' }}>+ הוסף סוג כרטיס</button>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="showRem" checked={form.show_remaining} onChange={e => setForm(f => ({ ...f, show_remaining: e.target.checked }))} />
                  <label htmlFor="showRem" style={{ color: 'var(--v2-gray-400)', cursor: 'pointer' }}>הצג כמות נותרת לציבור</label>
                  <Tooltip text="לקוחות יראו 'נותרו X כרטיסים' — יוצר urgency" />
                </div>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="allowWait" checked={form.allow_waitlist} onChange={e => setForm(f => ({ ...f, allow_waitlist: e.target.checked }))} />
                  <label htmlFor="allowWait" style={{ color: 'var(--v2-gray-400)', cursor: 'pointer' }}>אפשר רשימת המתנה</label>
                </div>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="reqId" checked={form.requires_id} onChange={e => setForm(f => ({ ...f, requires_id: e.target.checked }))} />
                  <label htmlFor="reqId" style={{ color: 'var(--v2-gray-400)', cursor: 'pointer' }}>חובת תעודת זהות (18+)</label>
                  <Tooltip text="נדרשת תעודת זהות בעת ההרשמה" />
                </div>
                {form.requires_id && (
                  <div style={{ marginBottom: 16, padding: 12, background: 'var(--v2-dark-2)', borderRadius: 8, fontSize: 13, color: 'var(--v2-gray-400)' }}>לקוחות יידרשו להזין תעודת זהות בעת ההרשמה</div>
                )}
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="residentPricing" checked={!!(form.city_code || form.city_name || form.resident_pricing_enabled)} onChange={e => { if (!e.target.checked) setForm(f => ({ ...f, resident_pricing_enabled: false, city_code: '', city_name: '', resident_only_price: null, non_resident_price: null })); else setForm(f => ({ ...f, resident_pricing_enabled: true })) }} />
                  <label htmlFor="residentPricing" style={{ color: 'var(--v2-gray-400)', cursor: 'pointer' }}>מחיר שונה לתושב עיר</label>
                  <Tooltip text="הלקוח יוכנס שם עירו ויקבל מחיר מותאם אוטומטית" />
                </div>
                {(form.resident_pricing_enabled || form.city_code || form.city_name || form.resident_only_price != null || form.non_resident_price != null) && (
                  <div style={{ marginBottom: 24, padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 4, color: 'var(--v2-gray-400)' }}>קוד עיר / שם עיר</label>
                      <input value={form.city_code || form.city_name || ''} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, city_code: v, city_name: v })) }} placeholder="תל אביב" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 4, color: 'var(--v2-gray-400)' }}>מחיר לתושב ₪</label>
                      <input type="number" value={form.resident_only_price ?? ''} onChange={e => setForm(f => ({ ...f, resident_only_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="0" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, color: 'var(--v2-gray-400)' }}>מחיר לתושב חוץ ₪</label>
                      <input type="number" value={form.non_resident_price ?? ''} onChange={e => setForm(f => ({ ...f, non_resident_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="0" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 6 — תפריט וסקיצה */}
            {step === 6 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>תפריטים <Tooltip text="תפריט מקושר לאירוע יוצג ב-Validator של הלקוח" /></label>
                  <CustomSelect
                    value=""
                    onChange={(val) => { if (val) setForm(f => ({ ...f, linked_menu_ids: [...new Set([...(f.linked_menu_ids || []), String(val)])] })) }}
                    placeholder="הוסף תפריט לקישור"
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                    options={(() => {
                      const avail = menus.filter(m => !(form.linked_menu_ids || []).map(String).includes(String(m.id)))
                      let placeholderLabel = 'בחר תפריט להוספה'
                      if (!menus.length) placeholderLabel = 'אין תפריטים — צור תפריט חדש'
                      else if (!avail.length) placeholderLabel = 'כל התפריטים כבר קשורים'
                      return [{ value: '', label: placeholderLabel }, ...avail.map(m => ({ value: m.id, label: m.name }))]
                    })()}
                  />
                  {(form.linked_menu_ids || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {(form.linked_menu_ids || []).map(id => {
                        const m = menus.find(x => String(x.id) === String(id))
                        return (
                          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--v2-dark-2)', borderRadius: 8, fontSize: 13, border: '1px solid var(--glass-border)' }}>
                            {m?.name || id}
                            <button type="button" onClick={() => setForm(f => ({ ...f, linked_menu_ids: (f.linked_menu_ids || []).filter(x => String(x) !== String(id)) }))} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} aria-label="הסר תפריט"><X size={14} /></button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <button type="button" onClick={() => setMenuBuilderOpen(true)} style={{ marginTop: 8, padding: '8px 16px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>צור תפריט חדש</button>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>סקיצות <Tooltip text="סקיצה שמורה ניתנת לשימוש חוזר באירועים עתידיים" /></label>
                  <CustomSelect
                    value=""
                    onChange={(val) => { if (val) setForm(f => ({ ...f, linked_layout_ids: [...new Set([...(f.linked_layout_ids || []), String(val)])] })) }}
                    placeholder="הוסף סקיצה לקישור"
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                    options={(() => {
                      const avail = layouts.filter(l => !(form.linked_layout_ids || []).map(String).includes(String(l.id)))
                      let placeholderLabel = 'בחר סקיצה להוספה'
                      if (!layouts.length) placeholderLabel = 'אין סקיצות — צור סקיצה חדשה'
                      else if (!avail.length) placeholderLabel = 'כל הסקיצות כבר קשורות'
                      return [{ value: '', label: placeholderLabel }, ...avail.map(l => ({ value: l.id, label: l.name }))]
                    })()}
                  />
                  {(form.linked_layout_ids || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {(form.linked_layout_ids || []).map(id => {
                        const l = layouts.find(x => String(x.id) === String(id))
                        return (
                          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--v2-dark-2)', borderRadius: 8, fontSize: 13, border: '1px solid var(--glass-border)' }}>
                            {l?.name || id}
                            <button type="button" onClick={() => setForm(f => ({ ...f, linked_layout_ids: (f.linked_layout_ids || []).filter(x => String(x) !== String(id)) }))} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} aria-label="הסר סקיצה"><X size={14} /></button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <button type="button" onClick={() => setLayoutBuilderOpen(true)} style={{ marginTop: 8, padding: '8px 16px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>צור סקיצה חדשה</button>
                </div>
              </>
            )}

            {/* Step 7 — עיצוב */}
            {step === 7 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>לוגו (URL)</label>
                      <input type="url" value={form.branding?.logo_url || ''} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, logo_url: e.target.value } }))} placeholder="https://..." style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>צבע ראשי</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        {BRANDING_PRESETS.map(c => (
                          <button key={c} onClick={() => setForm(f => ({ ...f, branding: { ...f.branding, primary_color: c } }))} style={{ width: 36, height: 36, borderRadius: 8, background: c, border: form.branding?.primary_color === c ? '3px solid #fff' : 'none', cursor: 'pointer' }} />
                        ))}
                        <input type="color" value={form.branding?.primary_color || '#00C37A'} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, primary_color: e.target.value } }))} style={{ width: 36, height: 36, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="בחר צבע" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>צבע משני</label>
                      <input type="color" value={form.branding?.secondary_color || '#64748b'} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, secondary_color: e.target.value } }))} style={{ width: 48, height: 36, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>רקע</label>
                      <input type="color" value={form.branding?.bg_color || '#0a0a0a'} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, bg_color: e.target.value } }))} style={{ width: 48, height: 36, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', marginBottom: 8, color: 'var(--v2-gray-400)' }}>סגנון פונט</label>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {FONT_STYLES.map(fs => (
                          <button key={fs.id} onClick={() => setForm(f => ({ ...f, branding: { ...f.branding, font_style: fs.id } }))} style={{ padding: '12px 20px', borderRadius: 12, background: form.branding?.font_style === fs.id ? 'var(--v2-primary)' : 'var(--v2-dark-3)', color: form.branding?.font_style === fs.id ? 'var(--v2-dark)' : '#fff', border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600 }}>{fs.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 20, background: form.branding?.bg_color || '#0a0a0a', borderRadius: 16, border: '1px solid var(--glass-border)', minHeight: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      {form.branding?.logo_url && <img src={form.branding.logo_url} alt="" style={{ height: 40, width: 'auto', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />}
                      <span style={{ fontSize: 18, fontWeight: 700, color: form.branding?.primary_color || '#00C37A' }}>{form.title || 'שם האירוע'}</span>
                    </div>
                    <div style={{ fontSize: 14, color: form.branding?.secondary_color || '#64748b', marginBottom: 12 }}>{form.venue_name || 'מיקום'}</div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 12, color: form.branding?.primary_color || '#00C37A', fontWeight: 600 }}>תצוגה מקדימה — דף הזמנה</div>
                  </div>
                </div>
              </>
            )}

            {/* Step 8 — סיכום ופרסום */}
            {step === 8 && (
              <>
                <div style={{ marginBottom: 24, padding: 20, background: 'var(--v2-dark-3)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ marginBottom: 12 }}>תצוגה מקדימה</h3>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{form.title || 'שם האירוע'}</div>
                  {(form.doors_open || form.event_end) && <div style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 8 }}>{new Date(form.doors_open || form.event_end).toLocaleDateString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                  {form.venue_name && <div style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>{form.venue_name}</div>}
                  {form.cover_image_url && <img src={form.cover_image_url} alt="" style={{ marginTop: 12, width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />}
                </div>
              </>
            )}
            </div>

            {/* Buttons area — fixed */}
            <div style={{ 
              position: 'fixed', 
              bottom: 0, 
              left: 0,
              right: 0,
              background: 'var(--v2-dark)', 
              borderTop: '1px solid var(--glass-border)', 
              padding: '16px',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
              display: 'flex', 
              gap: '12px', 
              zIndex: 110
            }}>
            {step === 1 && (
              <button onClick={() => setStep(2)} disabled={!form.title} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: form.title ? 'var(--v2-primary)' : 'var(--v2-gray-600)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: form.title ? 'pointer' : 'not-allowed' }}>המשך</button>
            )}
            {step === 2 && (
              <>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>חזור</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>המשך</button>
              </>
            )}
            {step === 3 && (
              <>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>חזור</button>
                <button onClick={() => setStep(4)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>המשך</button>
              </>
            )}
            {step === 4 && (
              <>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>חזור</button>
                <button onClick={() => setStep(5)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>המשך</button>
              </>
            )}
            {step === 5 && (
              <>
                <button onClick={() => setStep(4)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>חזור</button>
                <button onClick={() => setStep(6)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>המשך</button>
              </>
            )}
            {step === 6 && (
              <>
                <button onClick={() => setStep(5)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>חזור</button>
                <button onClick={() => setStep(7)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>המשך</button>
              </>
            )}
            {step === 7 && (
              <>
                <button onClick={() => setStep(6)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>חזור</button>
                <button onClick={() => setStep(8)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>המשך</button>
              </>
            )}
            {step === 8 && (
              <>
                <button onClick={() => setStep(7)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>חזור</button>
                <button onClick={() => handleCreate(true)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>שמור כטיוטה</button>
                <button onClick={() => handlePublish()} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>פרסם עכשיו</button>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Close wizard confirmation modal */}
      {closeWizardModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250 }} onClick={e => e.target === e.currentTarget && setCloseWizardModalOpen(false)}>
          <div style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()} dir="rtl">
            <button type="button" onClick={() => setCloseWizardModalOpen(false)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Save size={40} color="#00C37A" /></div>
            <h3 style={{ marginBottom: 8 }}>האירוע נשמר כטיוטה</h3>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 20 }}>תמצא אותו בקטע הטיוטות</p>
            <button onClick={doCloseWizard} style={{ padding: '12px 24px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: 'pointer' }}>סגור</button>
          </div>
        </div>
      )}

      {/* Draft delete confirm */}
      {draftDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => setDraftDeleteConfirm(null)}>
          <div style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 360 }} onClick={e => e.stopPropagation()} dir="rtl">
            <button type="button" onClick={() => setDraftDeleteConfirm(null)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: 12 }}>למחוק טיוטה זו?</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDraftDeleteConfirm(null)} style={{ flex: 1, padding: 14, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff', cursor: 'pointer' }}>ביטול</button>
              <button onClick={() => {
                const updated = drafts.filter(d => d.draftId !== draftDeleteConfirm.draftId)
                localStorage.setItem('axess_event_drafts', JSON.stringify(updated))
                setDrafts(updated)
                setDraftDeleteConfirm(null)
              }} style={{ flex: 1, padding: 14, background: '#ef4444', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>מחק</button>
            </div>
          </div>
        </div>
      )}

      {/* MenuBuilder Modal */}
      {menuBuilderOpen && (
        <MenuBuilderModal businessId={businessId} onClose={() => { setMenuBuilderOpen(false); fetch(`${API_BASE}/api/admin/menus?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setMenus) }} />
      )}

      {/* Layout/SeatingBuilder Modal */}
      {layoutBuilderOpen && (
        <LayoutBuilderModal businessId={businessId} onClose={() => { setLayoutBuilderOpen(false); fetch(`${API_BASE}/api/admin/layouts?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setLayouts) }} />
      )}

      {/* Publish success modal */}
      {publishSuccessEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => setPublishSuccessEvent(null)}>
          <div style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setPublishSuccessEvent(null)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Sparkles size={48} color="#00C37A" /></div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>האירוע פורסם!</h2>
            <div style={{ color: 'var(--v2-gray-400)', marginBottom: 16, fontSize: 14 }}>קישור לשיתוף:</div>
            <div style={{ padding: 12, background: 'var(--v2-dark-3)', borderRadius: 8, marginBottom: 16, wordBreak: 'break-all', fontSize: 14 }}>axess.me/e/{publishSuccessEvent.slug}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${FRONTEND_URL}/e/${publishSuccessEvent.slug}`)}`} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', background: '#25D366', color: '#fff', borderRadius: 'var(--radius-full)', textDecoration: 'none', fontWeight: 600 }}>WhatsApp</a>
              <button onClick={() => { copyToClipboard(`${FRONTEND_URL}/e/${publishSuccessEvent.slug}`) }} style={{ padding: '10px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Copy link</button>
            </div>
            <Link to="/dashboard/campaigns" style={{ display: 'block', padding: 12, color: 'var(--v2-primary)', textDecoration: 'none', fontWeight: 600 }}>צור קמפיין SMS לאירוע זה →</Link>
            <button onClick={() => setPublishSuccessEvent(null)} style={{ marginTop: 16, padding: '10px 24px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'var(--v2-gray-400)', cursor: 'pointer' }}>סגור</button>
          </div>
        </div>
      )}

      {/* Floor Status Modal */}
      {floorStatusEvent && (
        <FloorStatusModal event={floorStatusEvent} onClose={() => setFloorStatusEvent(null)} />
      )}

      {editModalEvent && (
        <EventEditModal
          event={editModalEvent}
          onClose={() => setEditModalEvent(null)}
          onSave={() => { loadEvents(); setEditModalEvent(null); }}
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
