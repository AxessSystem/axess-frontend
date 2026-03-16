import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../config'
import { useWebview } from '../WebviewContext'
import { Ticket, Armchair, Calendar, CheckCircle, MapPin } from 'lucide-react'

const TABS = [
  { id: 'tickets', label: 'כרטיסים', icon: Ticket },
  { id: 'table', label: 'שולחן / בקבוק', icon: Armchair },
  { id: 'schedule', label: 'לו"ז', icon: Calendar },
  { id: 'checkin', label: 'צ\'ק-אין', icon: CheckCircle },
]

export default function EventWebview({ business, event }) {
  const { items, recipient, trackEvent, business: ctxBiz } = useWebview()
  const effectiveBusiness = business || ctxBiz

  const [activeTab, setActiveTab] = useState('tickets')
  const [ticketTypes, setTicketTypes] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [ticketQuantities, setTicketQuantities] = useState({})
  const [ticketBusy, setTicketBusy] = useState(false)
  const [ticketError, setTicketError] = useState(null)

  const [tableDate, setTableDate] = useState('')
  const [tableTime, setTableTime] = useState('')
  const [tableGuests, setTableGuests] = useState(4)
  const [tableNotes, setTableNotes] = useState('')
  const [tableStatus, setTableStatus] = useState(null)
  const [tableBusy, setTableBusy] = useState(false)
  const [upsellQuantities, setUpsellQuantities] = useState({})

  const [checkinCode, setCheckinCode] = useState('')
  const [checkinResult, setCheckinResult] = useState(null)
  const [checkinError, setCheckinError] = useState(null)
  const [checkinBusy, setCheckinBusy] = useState(false)

  const slug = effectiveBusiness?.slug

  useEffect(() => {
    if (!slug) return
    setLoadingTickets(true)
    fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/event/tickets`)
      .then((res) => res.json())
      .then((data) => {
        setTicketTypes(Array.isArray(data.ticket_types) ? data.ticket_types : [])
      })
      .catch(() => {
        setTicketTypes([])
      })
      .finally(() => setLoadingTickets(false))
  }, [slug])

  useEffect(() => {
    if (!slug) return
    setLoadingSchedule(true)
    fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/event/schedule`)
      .then((res) => res.json())
      .then((data) => {
        setSchedule(Array.isArray(data.schedule) ? data.schedule : [])
      })
      .catch(() => {
        setSchedule([])
      })
      .finally(() => setLoadingSchedule(false))
  }, [slug])

  useEffect(() => {
    if (schedule.length === 0 && activeTab === 'schedule') {
      setActiveTab('tickets')
    }
  }, [schedule, activeTab])

  const eventUpsellItems = useMemo(
    () =>
      (items || []).filter((i) =>
        (i.category || '').toLowerCase().includes('event'),
      ),
    [items],
  )

  const handleChangeUpsellQty = (id, delta) => {
    setUpsellQuantities((prev) => {
      const next = { ...prev }
      const current = Number(next[id] || 0)
      const updated = Math.max(0, current + delta)
      if (!updated) delete next[id]
      else next[id] = updated
      return next
    })
  }

  const handleChangeTicketQty = (id, delta) => {
    setTicketQuantities((prev) => {
      const next = { ...prev }
      const current = Number(next[id] || 0)
      const updated = Math.max(0, current + delta)
      if (!updated) delete next[id]
      else next[id] = updated
      return next
    })
  }

  const ticketCart = useMemo(
    () =>
      ticketTypes
        .map((t) => ({
          ...t,
          quantity: Number(ticketQuantities[t.id] || 0),
        }))
        .filter((t) => t.quantity > 0),
    [ticketTypes, ticketQuantities],
  )

  const ticketTotal = useMemo(
    () =>
      ticketCart.reduce(
        (sum, t) => sum + Number(t.price || 0) * Number(t.quantity || 0),
        0,
      ),
    [ticketCart],
  )

  const handleTicketCheckout = async () => {
    if (!slug || !recipient?.phone || !ticketCart.length || !ticketTotal) return
    setTicketBusy(true)
    setTicketError(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: recipient.phone,
          order_type: 'ticket',
          items: ticketCart.map((t) => ({
            id: t.id,
            name: t.name,
            price: t.price,
            quantity: t.quantity,
          })),
          total_amount: ticketTotal,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.payment_url) {
        throw new Error(data.error || 'שגיאה ביצירת הזמנה')
      }
      trackEvent('event_ticket_order', {
        items: ticketCart.length,
        total: ticketTotal,
      })
      window.location.href = data.payment_url
    } catch (err) {
      setTicketError(err.message || 'שגיאה ביצירת הזמנה')
    } finally {
      setTicketBusy(false)
    }
  }

  const handleTableBooking = async (e) => {
    e?.preventDefault()
    if (!slug || !recipient?.phone || !tableDate || !tableTime || !tableGuests) return
    setTableBusy(true)
    setTableStatus(null)
    const selectedUpsells = eventUpsellItems
      .filter((u) => Number(upsellQuantities[u.id] || 0) > 0)
      .map((u) => `${upsellQuantities[u.id]}× ${u.name}`)
    const upsellSummary = selectedUpsells.length ? ` | תוספות: ${selectedUpsells.join(', ')}` : ''
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/restaurant/table-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tableDate,
          time: tableTime,
          guests: tableGuests,
          notes: (tableNotes || '') + upsellSummary,
          customer_phone: recipient.phone,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאה ביצירת הזמנה')
      }
      setTableStatus({ type: 'success', message: 'הבקשה נשלחה. תקבל/י אישור ב-WhatsApp.' })
      trackEvent('event_table_booking', {
        date: tableDate,
        time: tableTime,
        guests: tableGuests,
      })
    } catch (err) {
      setTableStatus({ type: 'error', message: err.message || 'שגיאה ביצירת הזמנה' })
    } finally {
      setTableBusy(false)
    }
  }

  const handleCheckin = async (e) => {
    e?.preventDefault()
    if (!slug || !checkinCode.trim()) return
    setCheckinBusy(true)
    setCheckinResult(null)
    setCheckinError(null)
    try {
      const res = await fetch(
        `${API_BASE}/api/w/${encodeURIComponent(slug)}/event/checkin?code=${encodeURIComponent(
          checkinCode.trim(),
        )}`,
        {
          method: 'POST',
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'קוד לא תקין')
      }
      setCheckinResult({
        name: data.name || 'אורח',
        order_number: data.order_number || null,
      })
    } catch (err) {
      setCheckinError(err.message || 'קוד לא תקין')
    } finally {
      setCheckinBusy(false)
    }
  }

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'schedule' && schedule.length === 0) return false
    return true
  })

  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, direction: 'rtl' }}>
      {event && (
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            background: 'var(--wv-card, #0f172a)',
            boxShadow: '0 20px 50px rgba(15,23,42,0.75)',
          }}
        >
          <div style={{ position: 'relative', height: 200, width: '100%', background: '#020617' }}>
            {event.cover_image_url && (
              <img
                src={event.cover_image_url}
                alt={event.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.9)',
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.3), transparent)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                insetInline: 16,
                bottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#f9fafb',
                  textShadow: '0 10px 30px rgba(0,0,0,0.8)',
                }}
              >
                {event.title}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                fontSize: 13,
                color: 'rgba(226,232,240,0.9)',
              }}
            >
              {event.date && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} />
                  <span>{new Date(event.date).toLocaleString('he-IL', { dateStyle: 'medium' })}</span>
                </div>
              )}
              {(event.location || event.venue_name) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} />
                  <span>{event.venue_name || event.location}</span>
                </div>
              )}
            </div>
            {event.description && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: 'rgba(148,163,184,0.95)',
                  lineHeight: 1.6,
                }}
              >
                {event.description}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '2px 2px 6px',
          overflowX: 'auto',
        }}
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '6px 12px',
                background:
                  activeTab === tab.id ? 'var(--wv-primary, #22C55E)' : 'rgba(15,23,42,0.9)',
                color: activeTab === tab.id ? '#020617' : 'var(--wv-text, #fff)',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loadingTickets && <div style={{ fontSize: 13 }}>טוען כרטיסים…</div>}
          {!loadingTickets && ticketTypes.length === 0 && (
            <div style={{ fontSize: 13, opacity: 0.8 }}>אין כרטיסים זמינים כרגע.</div>
          )}
          {ticketTypes.map((t) => {
            const qty = Number(ticketQuantities[t.id] || 0)
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 16,
                  background: 'rgba(15,23,42,0.85)',
                  border: qty > 0 ? '1px solid rgba(34,197,94,0.9)' : '1px solid rgba(148,163,184,0.35)',
                  boxShadow: qty > 0 ? '0 18px 45px rgba(22,163,74,0.5)' : '0 16px 40px rgba(15,23,42,0.85)',
                  backdropFilter: 'blur(18px)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.name}
                  </div>
                  {t.description && (
                    <div
                      style={{
                        fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
                        fontSize: 13,
                        color: 'rgba(148,163,184,0.9)',
                        marginBottom: 4,
                      }}
                    >
                      {t.description}
                    </div>
                  )}
                  <div style={{ fontSize: 14, opacity: 0.9 }}>
                    {typeof t.inventory === 'number' && t.inventory >= 0 && (
                      <span>נשארו {t.inventory} כרטיסים</span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 6,
                    minWidth: 90,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--wv-primary, #22C55E)',
                    }}
                  >
                    ‎₪{Number(t.price || 0).toFixed(0)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(15,23,42,0.9)',
                      borderRadius: 999,
                      padding: '4px 6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleChangeTicketQty(t.id, -1)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(148,163,184,0.35)',
                        color: '#f9fafb',
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13 }}>{qty}</span>
                    <button
                      type="button"
                      onClick={() => handleChangeTicketQty(t.id, 1)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'var(--wv-primary, #22C55E)',
                        color: '#020617',
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {ticketCart.length > 0 && (
            <div
              style={{
                marginTop: 4,
                padding: 10,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(148,163,184,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 14,
                }}
              >
                <span>סה״כ</span>
                <span style={{ fontWeight: 700 }}>‎₪{ticketTotal.toFixed(0)}</span>
              </div>
              {ticketError && (
                <div style={{ fontSize: 12, color: '#fecaca' }}>
                  {ticketError}
                </div>
              )}
              <button
                type="button"
                disabled={ticketBusy}
                onClick={handleTicketCheckout}
                style={{
                  marginTop: 2,
                  width: '100%',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 10px',
                  background: 'var(--wv-primary, #22C55E)',
                  color: '#020617',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: ticketBusy ? 'default' : 'pointer',
                }}
              >
                {ticketBusy ? 'מנתב לתשלום…' : 'לרכישה'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'table' && (
        <form
          onSubmit={handleTableBooking}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}
        >
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>תאריך</label>
            <input
              type="date"
              min={todayStr}
              value={tableDate}
              onChange={(e) => setTableDate(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '100%',
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.5)',
                background: 'rgba(15,23,42,0.7)',
                color: 'var(--wv-text, #fff)',
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>שעה</label>
            <input
              type="time"
              value={tableTime}
              onChange={(e) => setTableTime(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.5)',
                background: 'rgba(15,23,42,0.7)',
                color: 'var(--wv-text, #fff)',
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>מספר אנשים</label>
            <select
              value={tableGuests}
              onChange={(e) => setTableGuests(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.5)',
                background: 'rgba(15,23,42,0.7)',
                color: 'var(--wv-text, #fff)',
                fontSize: 13,
              }}
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>הערות (אופציונלי)</label>
            <textarea
              rows={3}
              value={tableNotes}
              onChange={(e) => setTableNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.5)',
                background: 'rgba(15,23,42,0.7)',
                color: 'var(--wv-text, #fff)',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
          </div>
          {tableStatus && (
            <div
              style={{
                fontSize: 13,
                color: tableStatus.type === 'success' ? '#bbf7d0' : '#fecaca',
              }}
            >
              {tableStatus.message}
            </div>
          )}
          <button
            type="submit"
            disabled={tableBusy}
            style={{
              marginTop: 4,
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '12px 10px',
              background: 'var(--wv-primary, #22C55E)',
              color: '#020617',
              fontSize: 15,
              fontWeight: 700,
              cursor: tableBusy ? 'default' : 'pointer',
            }}
          >
            {tableBusy ? 'שולח...' : 'שלח בקשת שולחן'}
          </button>
          {eventUpsellItems.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>תוספות לשולחן</div>
              {eventUpsellItems.map((u) => {
                const qty = Number(upsellQuantities[u.id] || 0)
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      borderRadius: 10,
                      background: 'var(--wv-card, #111827)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          marginBottom: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {u.name}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        ‎₪{Number(u.price || 0).toFixed(0)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(15,23,42,0.9)',
                        borderRadius: 999,
                        padding: '4px 6px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleChangeUpsellQty(u.id, -1)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(148,163,184,0.3)',
                          color: '#fff',
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13 }}>{qty}</span>
                      <button
                        type="button"
                        onClick={() => handleChangeUpsellQty(u.id, 1)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'var(--wv-primary, #22C55E)',
                          color: '#000',
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </form>
      )}

      {activeTab === 'schedule' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 4,
          }}
        >
          {loadingSchedule && <div style={{ fontSize: 13 }}>טוען לו"ז…</div>}
          {!loadingSchedule && schedule.length === 0 && (
            <div style={{ fontSize: 13, opacity: 0.8 }}>טרם הוגדר לו"ז לאירוע.</div>
          )}
          {schedule.map((s) => (
            <div
              key={s.id}
              style={{
                padding: 10,
                borderRadius: 12,
                background: 'var(--wv-card, #111827)',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  minWidth: 64,
                }}
              >
                {s.starts_at
                  ? new Date(s.starts_at).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </div>
              <div style={{ fontSize: 14 }}>{s.label || s.description}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'checkin' && (
        <form
          onSubmit={handleCheckin}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
        >
          <label style={{ fontSize: 13, marginBottom: 2 }}>קוד כרטיס / קופון</label>
          <input
            type="text"
            value={checkinCode}
            onChange={(e) => setCheckinCode(e.target.value)}
            placeholder="הקלד/י את הקוד המופיע בכרטיס"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.5)',
              background: 'rgba(15,23,42,0.7)',
              color: 'var(--wv-text, #fff)',
              fontSize: 13,
            }}
          />
          {checkinError && (
            <div style={{ fontSize: 13, color: '#fecaca' }}>
              ❌ {checkinError}
            </div>
          )}
          {checkinResult && (
            <div style={{ fontSize: 13, color: '#bbf7d0' }}>
              כניסה אושרה!<br />
              {checkinResult.name && <span>שם: {checkinResult.name}</span>}
              {checkinResult.order_number && (
                <>
                  <br />
                  <span>מספר הזמנה: {checkinResult.order_number}</span>
                </>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={checkinBusy}
            style={{
              marginTop: 4,
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '12px 10px',
              background: 'var(--wv-primary, #22C55E)',
              color: '#020617',
              fontSize: 15,
              fontWeight: 700,
              cursor: checkinBusy ? 'default' : 'pointer',
            }}
          >
            {checkinBusy ? 'בודק...' : 'צ\'ק-אין'}
          </button>
        </form>
      )}
    </div>
  )
}

