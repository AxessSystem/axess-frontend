import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, ChevronLeft, ExternalLink, Download, Edit,
  CheckCircle, Clock, XCircle, DollarSign, Users, QrCode, Eye, Ticket,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

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

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId,
  }), [session, businessId])

  const loadData = useCallback(() => {
    if (!id || !businessId) return Promise.resolve()
    return Promise.all([
      fetch(`${API_BASE}/api/admin/events/${id}`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/api/admin/events/${id}/orders`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([ev, ord]) => {
      setEvent(ev && !ev.error ? ev : null)
      setOrders(Array.isArray(ord) ? ord : ord.orders || [])
    })
  }, [id, businessId, authHeaders])

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
          { icon: <CheckCircle size={20} />, value: approved.length, label: 'מאושרים', color: '#00C37A' },
          { icon: <Clock size={20} />, value: pending.length, label: 'ממתינים', color: '#F59E0B' },
          { icon: <XCircle size={20} />, value: cancelled.length, label: 'מבוטלים', color: '#EF4444' },
          { icon: <DollarSign size={20} />, value: `₪${totalRevenue.toLocaleString()}`, label: 'הכנסה', color: '#3B82F6' },
          { icon: <Users size={20} />, value: orders.length, label: 'סה"כ רשומים', color: '#8B5CF6' },
          { icon: <QrCode size={20} />, value: checkedIn.length, label: 'צ\'ק אין', color: '#00C37A' },
          { icon: <Eye size={20} />, value: event.views_count || 0, label: 'צפיות', color: '#06B6D4' },
          { icon: <Ticket size={20} />, value: event.max_capacity || 0, label: 'קיבולת', color: '#F97316' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: 'var(--card)', borderRadius: 12, padding: '16px',
              border: '1px solid var(--glass-border)', textAlign: 'center',
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
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>
              {event.description}
            </p>
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: 20, border: '1px solid var(--glass-border)', marginTop: 16 }}>
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
          </div>
        )}

        {activeTab === 'audience' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'approved', label: `מאושרים (${approved.length})` },
                { id: 'pending', label: `ממתינים (${pending.length})` },
                { id: 'cancelled', label: `מבוטלים (${cancelled.length})` },
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
            </div>

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
                          background: order.status === 'approved' || order.status === 'confirmed' ? 'rgba(0,195,122,0.15)'
                            : order.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          color: order.status === 'approved' || order.status === 'confirmed' ? '#00C37A'
                            : order.status === 'pending' ? '#F59E0B' : '#EF4444',
                        }}
                        >
                          {order.status === 'approved' || order.status === 'confirmed' ? 'מאושר'
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
                          {order.status !== 'cancelled' && (
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
