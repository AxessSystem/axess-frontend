import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, ChevronLeft, ExternalLink, Download, Edit,
  CheckCircle, Clock, XCircle, DollarSign, Users, QrCode, Eye, Ticket,
  Upload, Plus, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const PUBLIC_WEBVIEW_ORIGIN = 'https://axess.pro'

function formatDate(dateVal) {
  if (!dateVal) return '—'
  try {
    return new Date(dateVal).toLocaleDateString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function downloadReport(orders, event) {
  const esc = (v) => {
    if (v == null || v === '') return ''
    const s = String(v)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const headers = ['מספר עסקה', 'שם', 'שם משפחה', 'טלפון', 'ת.לידה', 'מין', 'סוג כרטיס', 'סכום', 'סטטוס', 'דיוור', 'אינסטגרם', 'ת"ז', 'יחצ"ן', 'תאריך']
  const rows = orders.map((o) => [
    o.id?.slice(0, 8),
    o.first_name,
    o.last_name,
    o.phone,
    o.birth_date || '',
    o.gender || '',
    o.ticket_type || 'רגיל',
    o.total_price || o.amount || 0,
    o.status,
    o.allow_marketing ? 'כן' : 'לא',
    o.instagram || '',
    o.id_number || '',
    o.promoter_name || '',
    o.created_at ? new Date(o.created_at).toLocaleDateString('he-IL') : '',
  ])
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.title}-${new Date().toLocaleDateString('he-IL')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function EventDetailPage() {
  const { id } = useParams()
  const { session, businessId } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [ordersTab, setOrdersTab] = useState('approved')
  const [loading, setLoading] = useState(true)
  const [interests, setInterests] = useState([])
  const [webviewAnalyticsRows, setWebviewAnalyticsRows] = useState([])
  const [webviewBusinessSlug, setWebviewBusinessSlug] = useState('')
  const [channels, setChannels] = useState([])
  const [showImportChannel, setShowImportChannel] = useState(false)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [importChannelLabel, setImportChannelLabel] = useState('')
  const [importHeaders, setImportHeaders] = useState([])
  const [importRows, setImportRows] = useState([])
  const [columnMap, setColumnMap] = useState({})
  const [manualChannelLabel, setManualChannelLabel] = useState('')
  const [manualChannelSold, setManualChannelSold] = useState('')
  const [manualChannelRevenue, setManualChannelRevenue] = useState('')

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId,
  }), [session, businessId])

  const loadData = useCallback(() => {
    if (!id || !businessId) return Promise.resolve()
    const hdrs = authHeaders()
    return Promise.all([
      fetch(`${API_BASE}/api/admin/events/${id}`, { headers: hdrs }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/api/admin/events/${id}/orders`, { headers: hdrs }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/w/analytics-by-business`, { headers: hdrs }).then((r) => (r.ok ? r.json() : { stats: [] })),
      fetch(`${API_BASE}/api/webview/settings`, { headers: hdrs }).then((r) => (r.ok ? r.json() : {})),
      fetch(`${API_BASE}/api/admin/events/${id}/interests`, { headers: hdrs }).then((r) => (r.ok ? r.json() : { interests: [] })),
      fetch(`${API_BASE}/api/admin/events/${id}/channels`, { headers: hdrs }).then((r) => (r.ok ? r.json() : { channels: [] })),
    ]).then(([ev, ord, waData, webSettings, intData, chData]) => {
      setEvent(ev && !ev.error ? ev : null)
      setOrders(Array.isArray(ord) ? ord : ord.orders || [])
      setWebviewAnalyticsRows(waData?.stats || [])
      setWebviewBusinessSlug(webSettings?.business?.slug || '')
      setInterests(intData?.interests || [])
      setChannels(Array.isArray(chData?.channels) ? chData.channels : [])
    })
  }, [id, businessId, authHeaders])

  const eventWebStats = useMemo(() => {
    const slug = (event?.slug || '').toLowerCase()
    if (!slug || !webviewAnalyticsRows.length) return { sessions: 0, conversions: 0 }
    const rows = webviewAnalyticsRows.filter((r) => {
      const camp = (r.utm_campaign || '').toLowerCase()
      const src = (r.utm_source || '').toLowerCase()
      return camp.includes(slug) || src.includes(slug)
    })
    return {
      sessions: rows.reduce((s, r) => s + (Number(r.sessions) || 0), 0),
      conversions: rows.reduce((s, r) => s + (Number(r.conversions) || 0), 0),
    }
  }, [event?.slug, webviewAnalyticsRows])

  useEffect(() => {
    if (!id || !businessId) return
      let cancelled = false
    setLoading(true)
    loadData()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, businessId, loadData])

  const approveOrder = async (orderId) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: JSON.stringify({ approved_by: 'dashboard' }),
      })
      if (!r.ok) throw new Error()
      toast.success('אושר')
      await loadData()
    } catch {
      toast.error('שגיאה באישור')
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/orders/${orderId}/reject`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!r.ok) throw new Error()
      toast.success('בוטל')
      await loadData()
    } catch {
      toast.error('שגיאה בביטול')
    }
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>טוען...</div>
  if (!event) return <div style={{ padding: 32 }}>אירוע לא נמצא</div>

  const approved = orders.filter((o) => o.status === 'approved' || o.status === 'confirmed')
  const pending = orders.filter((o) => o.status === 'pending')
  const cancelled = orders.filter((o) => o.status === 'cancelled')
  const checkedIn = orders.filter((o) => o.checked_in)

  const filteredOrders = ordersTab === 'approved' ? approved
    : ordersTab === 'pending' ? pending
      : ordersTab === 'cancelled' ? cancelled
        : ordersTab === 'checkin' ? checkedIn : orders

  const totalRevenue = approved.reduce((sum, o) => sum + (o.total_price || o.amount || 0), 0)

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: 20,
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard/events')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--v2-gray-400)', display: 'flex', alignItems: 'center',
            }}
          >
            <ChevronLeft size={20} color="#00C37A" />
          </button>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>{event.title}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--v2-gray-400)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} color="#00C37A" />
                {formatDate(event.date)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} color="#00C37A" />
                {event.location || event.venue_name || '—'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={`https://axess.pro/e/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ExternalLink size={14} color="#00C37A" />
            צפה
          </a>
          <button
            type="button"
            onClick={() => downloadReport(orders, event)}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              color: 'var(--text)', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Download size={14} color="#00C37A" />
            הורד דוח
          </button>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/events?edit=${id}`)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: '#00C37A', color: '#000',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Edit size={14} />
            ערוך
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '0 24px', marginBottom: 24 }}>
        {[
          { icon: <CheckCircle size={20} />, value: approved.length, label: 'מאושרים', color: '#00C37A', onNav: () => { setActiveTab('audience'); setOrdersTab('approved') } },
          { icon: <Clock size={20} />, value: pending.length, label: 'ממתינים', color: '#F59E0B', onNav: () => { setActiveTab('audience'); setOrdersTab('pending') } },
          { icon: <XCircle size={20} />, value: cancelled.length, label: 'מבוטלים', color: '#EF4444', onNav: () => { setActiveTab('audience'); setOrdersTab('cancelled') } },
          { icon: <DollarSign size={20} />, value: `₪${totalRevenue.toLocaleString()}`, label: 'הכנסה', color: '#3B82F6', onNav: () => { setActiveTab('finance') } },
          { icon: <Users size={20} />, value: orders.length, label: 'סה"כ רשומים', color: '#8B5CF6', onNav: () => { setActiveTab('audience'); setOrdersTab('all') } },
          { icon: <QrCode size={20} />, value: checkedIn.length, label: 'צ\'ק אין', color: '#00C37A', onNav: () => { setActiveTab('audience'); setOrdersTab('checkin') } },
          { icon: <Eye size={20} />, value: event.views_count || 0, label: 'צפיות', color: '#06B6D4' },
          { icon: <Ticket size={20} />, value: event.max_capacity || 0, label: 'קיבולת', color: '#F97316' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            role={kpi.onNav ? 'button' : undefined}
            tabIndex={kpi.onNav ? 0 : undefined}
            onClick={kpi.onNav}
            onKeyDown={kpi.onNav ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kpi.onNav() } } : undefined}
            style={{
              background: 'var(--card)', borderRadius: 12, padding: '16px',
              border: '1px solid var(--glass-border)', textAlign: 'center',
              cursor: kpi.onNav ? 'pointer' : 'default',
            }}
          >
            <div style={{ color: kpi.color, marginBottom: 6 }}>{kpi.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 24px', marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'סקירה' },
          { id: 'audience', label: 'קהל' },
          { id: 'finance', label: 'כספים' },
          { id: 'campaigns', label: 'קמפיינים' },
          { id: 'channels', label: 'ערוצי מכירה' },
          { id: 'webview', label: 'Webview' },
          { id: 'checkin', label: 'צ\'ק אין' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px', borderRadius: 10,
              border: activeTab === tab.id ? 'none' : '1px solid var(--glass-border)',
              background: activeTab === tab.id ? 'rgba(0,195,122,0.12)' : 'transparent',
              color: activeTab === tab.id ? '#00C37A' : 'var(--text)',
              fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', fontSize: 14,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 24px' }}>

        {activeTab === 'overview' && (
          <div>
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: 20, border: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>פילוח רשומים</h3>
              {[
                { label: 'מאושרים', count: approved.length, color: '#00C37A' },
                { label: 'ממתינים', count: pending.length, color: '#F59E0B' },
                { label: 'מבוטלים', count: cancelled.length, color: '#EF4444' },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 700 }}>{item.count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--glass)' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: item.color,
                      width: orders.length > 0 ? `${(item.count / orders.length) * 100}%` : '0%',
                      transition: 'width 0.5s ease',
                    }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>פילוח מגדר</h4>
                {['זכר', 'נקבה', 'לא ידוע'].map((gender) => {
                  const count = orders.filter((o) => o.gender === gender || (!o.gender && gender === 'לא ידוע')).length
                  return (
                    <div key={gender} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                        <span>{gender}</span>
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--glass)' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: '#00C37A',
                          width: orders.length > 0 ? `${(count / orders.length) * 100}%` : '0%',
                        }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>פילוח גיל</h4>
                {[
                  { label: '18-24', min: 18, max: 24 },
                  { label: '25-34', min: 25, max: 34 },
                  { label: '35-44', min: 35, max: 44 },
                  { label: '45+', min: 45, max: 120 },
                ].map((group) => {
                  const count = orders.filter((o) => {
                    if (!o.birth_date) return false
                    const age = new Date().getFullYear() - new Date(o.birth_date).getFullYear()
                    return age >= group.min && age <= group.max
                  }).length
                  return (
                    <div key={group.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                        <span>{group.label}</span>
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--glass)' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: '#3B82F6',
                          width: orders.length > 0 ? `${(count / orders.length) * 100}%` : '0%',
                        }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audience' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'approved', label: `מאושרים (${approved.length})` },
                { id: 'pending', label: `ממתינים (${pending.length})` },
                { id: 'cancelled', label: `מבוטלים (${cancelled.length})` },
                { id: 'interested', label: `מתעניינים (${interests.length})` },
                { id: 'checkin', label: `נסרקו (${checkedIn.length})` },
                { id: 'all', label: `כולם (${orders.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOrdersTab(t.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    border: ordersTab === t.id ? 'none' : '1px solid var(--glass-border)',
                    background: ordersTab === t.id ? 'var(--primary)' : 'transparent',
                    color: ordersTab === t.id ? '#fff' : 'var(--text)',
                    cursor: 'pointer', fontSize: 13, fontWeight: ordersTab === t.id ? 700 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
              {ordersTab !== 'interested' && (
                <button
                  type="button"
                  onClick={() => downloadReport(filteredOrders, event)}
                  style={{
                    marginRight: 'auto', padding: '6px 14px', borderRadius: 8,
                    border: '1px solid var(--glass-border)', background: 'var(--glass)',
                    color: '#00C37A', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Download size={13} />
                  Excel
                </button>
              )}
            </div>

            {ordersTab === 'interested' && (
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
                {interests.map((interest) => (
                  <div
                    key={interest.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--glass-border)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                        {interest.first_name
                          ? `${interest.first_name} ${interest.last_name || ''}`.trim()
                          : interest.phone}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--v2-gray-400)' }}>{interest.phone}</p>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 11,
                      background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 600,
                    }}
                    >
                      {interest.source === 'pixel' ? 'ביקר בדף'
                        : interest.source === 'whatsapp' ? 'WA'
                          : interest.source === 'sms' ? 'SMS' : 'מתעניין'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {interest.created_at ? new Date(interest.created_at).toLocaleDateString('he-IL') : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(`${window.location.origin}/dashboard/audiences?search=${encodeURIComponent(interest.phone || '')}`, '_blank')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 12,
                      }}
                    >
                      צפה בפרופיל →
                    </button>
                  </div>
                ))}
                {interests.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--v2-gray-400)', padding: 24, margin: 0 }}>
                    אין מתעניינים עדיין
                  </p>
                )}
              </div>
            )}

            {ordersTab !== 'interested' && (
            <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--glass)', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                    {['שם', 'טלפון', 'סוג כרטיס', 'סכום', 'יחצ"ן', 'סטטוס', 'פעולות'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      style={{
                        borderTop: '1px solid var(--glass-border)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>
                        {order.first_name}
                        {' '}
                        {order.last_name}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13, direction: 'ltr' }}>
                        {order.phone}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>
                        {order.ticket_type || 'רגיל'}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>
                        ₪
                        {order.total_price || order.amount || 0}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>
                        {order.promoter_name || '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: order.status === 'interested' ? 'rgba(6,182,212,0.15)'
                            : order.status === 'approved' || order.status === 'confirmed' ? 'rgba(0,195,122,0.15)'
                              : order.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          color: order.status === 'interested' ? '#06B6D4'
                            : order.status === 'approved' || order.status === 'confirmed' ? '#00C37A'
                              : order.status === 'pending' ? '#F59E0B' : '#EF4444',
                        }}
                        >
                          {order.status === 'interested' ? 'מתעניין'
                            : order.status === 'approved' || order.status === 'confirmed' ? 'מאושר'
                              : order.status === 'pending' ? 'ממתין' : 'בוטל'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => approveOrder(order.id)}
                              style={{
                                background: 'rgba(0,195,122,0.1)', border: 'none', borderRadius: 6,
                                padding: '4px 10px', cursor: 'pointer', color: '#00C37A', fontSize: 12,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <CheckCircle size={12} />
                              אשר
                            </button>
                          )}
                          {order.status !== 'cancelled' && order.status !== 'interested' && (
                            <button
                              type="button"
                              onClick={() => cancelOrder(order.id)}
                              style={{
                                background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6,
                                padding: '4px 10px', cursor: 'pointer', color: '#EF4444', fontSize: 12,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <XCircle size={12} />
                              בטל
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 14 }}>
                        אין רשומים בקטגוריה זו
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'הכנסה כוללת', value: `₪${totalRevenue.toLocaleString()}`, color: '#00C37A' },
                { label: 'ממוצע לכרטיס', value: `₪${approved.length > 0 ? Math.round(totalRevenue / approved.length) : 0}`, color: '#3B82F6' },
                { label: 'סה"כ עסקאות', value: approved.length, color: '#8B5CF6' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: 'var(--card)', borderRadius: 12, padding: 20,
                    border: '1px solid var(--glass-border)', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => downloadReport(approved, event)}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: '#00C37A', color: '#000',
                fontWeight: 700, cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Download size={16} />
              הורד דוח Excel מלא
            </button>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>ניהול קמפיינים — בקרוב.</p>
        )}

        {activeTab === 'channels' && (() => {
          const totalSoldAll = channels.reduce((s, c) => s + (Number(c.total_sold) || 0), 0)
          const totalRevAll = channels.reduce((s, c) => s + (Number(c.total_revenue) || 0), 0)
          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#00C37A' }}>{totalSoldAll}</div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>סה"כ נמכרו</div>
                </div>
                <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#3B82F6' }}>
                    ₪
                    {totalRevAll.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>סה"כ הכנסה</div>
                </div>
                <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#8B5CF6' }}>{channels.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>ערוצים פעילים</div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--glass)', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {['ערוץ', 'נמכרו', 'הכנסה', '% מהסה"כ', 'עדכון אחרון'].map((h) => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((ch) => {
                      const pct = totalSoldAll > 0 ? Math.round(((Number(ch.total_sold) || 0) / totalSoldAll) * 100) : 0
                      return (
                        <tr key={String(ch.id)} style={{ borderTop: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px', fontSize: 14, fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {ch.channel_name === 'axess' ? '🟢' : '🔵'}
                              {' '}
                              {ch.channel_label}
                              {ch.is_native && (
                                <span style={{
                                  fontSize: 10, color: '#00C37A', background: 'rgba(0,195,122,0.1)',
                                  padding: '2px 6px', borderRadius: 8,
                                }}
                                >
                                  ישיר
                                </span>
                              )}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: 14 }}>{ch.total_sold || 0}</td>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            ₪
                            {(Number(ch.total_revenue) || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--glass)' }}>
                                <div style={{
                                  height: '100%', borderRadius: 3, background: '#00C37A', width: `${pct}%`,
                                }}
                                />
                              </div>
                              <span>
                                {pct}
                                %
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                            {ch.last_sync_at ? new Date(ch.last_sync_at).toLocaleDateString('he-IL') : 'עכשיו'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setImportChannelLabel('')
                    setImportHeaders([])
                    setImportRows([])
                    setColumnMap({})
                    setShowImportChannel(true)
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: 'none',
                    background: '#00C37A', color: '#000', fontWeight: 700,
                    cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Upload size={16} />
                  ייבוא מפלטפורמה חיצונית
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualChannelLabel('')
                    setManualChannelSold('')
                    setManualChannelRevenue('')
                    setShowAddChannel(true)
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: '1px solid var(--glass-border)',
                    background: 'var(--glass)', color: 'var(--text)',
                    cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={16} />
                  הוסף ערוץ ידני
                </button>
              </div>

              {showImportChannel && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 500, width: '100%',
                    position: 'relative', border: '1px solid var(--glass-border)',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowImportChannel(false)}
                      style={{
                        position: 'absolute', top: 12, left: 12, background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--v2-gray-400)',
                      }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>ייבוא מפלטפורמה חיצונית</h3>

                    <input
                      value={importChannelLabel}
                      onChange={(e) => setImportChannelLabel(e.target.value)}
                      placeholder="שם הפלטפורמה (למשל: Eventbrite)"
                      style={{
                        width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)',
                        background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14,
                        marginBottom: 12, boxSizing: 'border-box',
                      }}
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('channel-import-file')?.click() }}
                      onClick={() => document.getElementById('channel-import-file')?.click()}
                      style={{
                        border: '2px dashed var(--glass-border)', borderRadius: 8, padding: 20, textAlign: 'center',
                        cursor: 'pointer', marginBottom: 12,
                      }}
                    >
                      <input
                        id="channel-import-file"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        hidden
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const text = await file.text()
                          const lines = text.split('\n').filter((l) => l.trim())
                          const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
                          const rows = lines.slice(1).map((l) => {
                            const vals = l.split(',').map((v) => v.trim().replace(/"/g, ''))
                            return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] || '' }), {})
                          })
                          setImportHeaders(headers)
                          setImportRows(rows)
                        }}
                      />
                      <Upload size={20} style={{ color: 'var(--v2-gray-400)', marginBottom: 8 }} />
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                        {importRows.length > 0 ? `${importRows.length} שורות נטענו` : 'גרור CSV/Excel או לחץ לבחירה'}
                      </p>
                    </div>

                    {importHeaders.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>מפה עמודות:</p>
                        {[
                          { field: 'phone', label: 'טלפון *' },
                          { field: 'first_name', label: 'שם פרטי' },
                          { field: 'last_name', label: 'שם משפחה' },
                          { field: 'price', label: 'מחיר' },
                          { field: 'ticket_type', label: 'סוג כרטיס' },
                          { field: 'external_order_id', label: 'מזהה הזמנה חיצוני' },
                        ].map((f) => (
                          <div key={f.field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ width: 140, fontSize: 13, flexShrink: 0 }}>{f.label}</span>
                            <CustomSelect
                              value={columnMap[f.field] || ''}
                              onChange={(val) => setColumnMap((prev) => ({ ...prev, [f.field]: val }))}
                              placeholder="בחר עמודה"
                              options={[
                                { value: '', label: '— לא ממופה —' },
                                ...importHeaders.map((h) => ({ value: h, label: h })),
                              ]}
                              style={{ flex: 1, minWidth: 0 }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!importChannelLabel || importRows.length === 0 || !columnMap.phone}
                      onClick={async () => {
                        const res = await fetch(`${API_BASE}/api/admin/events/${id}/channels/import`, {
                          method: 'POST',
                          headers: authHeaders(),
                          body: JSON.stringify({
                            channel_label: importChannelLabel,
                            channel_name: 'import',
                            orders: importRows,
                            column_map: columnMap,
                          }),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          toast.error(data.error || 'ייבוא נכשל')
                          return
                        }
                        toast.success(`יובאו ${data.imported} רשומות!`)
                        setShowImportChannel(false)
                        setImportChannelLabel('')
                        setImportHeaders([])
                        setImportRows([])
                        setColumnMap({})
                        await loadData()
                      }}
                      style={{
                        width: '100%', height: 44, borderRadius: 8, border: 'none',
                        background: '#00C37A', color: '#000', fontWeight: 700,
                        fontSize: 15, cursor: 'pointer',
                      }}
                    >
                      ייבא רשומות
                    </button>
                  </div>
                </div>
              )}

              {showAddChannel && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%',
                    border: '1px solid var(--glass-border)', position: 'relative',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAddChannel(false)}
                      style={{
                        position: 'absolute', top: 12, left: 12, background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--v2-gray-400)',
                      }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>הוסף ערוץ ידני</h3>
                    <input
                      value={manualChannelLabel}
                      onChange={(e) => setManualChannelLabel(e.target.value)}
                      placeholder="שם הערוץ"
                      style={{
                        width: '100%', padding: 10, marginBottom: 10, borderRadius: 8,
                        border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={manualChannelSold}
                      onChange={(e) => setManualChannelSold(e.target.value)}
                      placeholder="נמכרו (מספר)"
                      style={{
                        width: '100%', padding: 10, marginBottom: 10, borderRadius: 8,
                        border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={manualChannelRevenue}
                      onChange={(e) => setManualChannelRevenue(e.target.value)}
                      placeholder="הכנסה (₪)"
                      style={{
                        width: '100%', padding: 10, marginBottom: 16, borderRadius: 8,
                        border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      disabled={!manualChannelLabel.trim()}
                      onClick={async () => {
                        const res = await fetch(`${API_BASE}/api/admin/events/${id}/channels`, {
                          method: 'POST',
                          headers: authHeaders(),
                          body: JSON.stringify({
                            channel_label: manualChannelLabel.trim(),
                            channel_name: 'custom',
                            total_sold: parseInt(manualChannelSold, 10) || 0,
                            total_revenue: parseFloat(manualChannelRevenue) || 0,
                          }),
                        })
                        if (!res.ok) {
                          toast.error('שגיאה בשמירה')
                          return
                        }
                        toast.success('נשמר')
                        setShowAddChannel(false)
                        await loadData()
                      }}
                      style={{
                          width: '100%', padding: 12, borderRadius: 8, border: 'none',
                          background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      שמור
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {activeTab === 'webview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--v2-gray-400)' }}>
              Webview של העסק — מדידה לפי שורות אנליטיקה שבהן
              {' '}
              <strong>utm_campaign</strong>
              {' '}
              או
              {' '}
              <strong>utm_source</strong>
              {' '}
              מכילים את slug האירוע (
              <code style={{ fontSize: 13 }}>{event.slug}</code>
              ).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>צפיות</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#06B6D4' }}>{eventWebStats.sessions}</div>
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>הזמנות דרך Webview</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#00C37A' }}>{eventWebStats.conversions}</div>
              </div>
            </div>
            {webviewBusinessSlug ? (
              <a
                href={`${PUBLIC_WEBVIEW_ORIGIN}/w/${encodeURIComponent(webviewBusinessSlug)}?utm_campaign=${encodeURIComponent(event.slug || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 14, color: '#00C37A', textDecoration: 'underline', width: 'fit-content',
                }}
              >
                פתח Webview עם UTM לאירוע
              </a>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                לא מוגדר slug ל-Webview בעסק — הגדר בהגדרות Webview.
              </p>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard/webview')}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', width: 'fit-content',
                background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14,
              }}
            >
              קשר Webview
            </button>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 15 }}>
                <strong style={{ color: '#00C37A' }}>{checkedIn.length}</strong>
                {' '}
                נסרקו מתוך
                {' '}
                <strong>{approved.length}</strong>
                {' '}
                מאושרים
              </p>
              <div style={{ background: 'var(--glass)', borderRadius: 8, padding: '8px 16px', fontSize: 13 }}>
                {approved.length > 0 ? Math.round((checkedIn.length / approved.length) * 100) : 0}
                % הגיעו
              </div>
            </div>
            <div style={{ height: 12, borderRadius: 6, background: 'var(--glass)', marginBottom: 20 }}>
              <div style={{
                height: '100%', borderRadius: 6, background: '#00C37A',
                width: approved.length > 0 ? `${(checkedIn.length / approved.length) * 100}%` : '0%',
                transition: 'width 0.5s ease',
              }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
