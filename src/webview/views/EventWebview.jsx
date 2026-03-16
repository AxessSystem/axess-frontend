import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../config'
import { useWebview } from '../WebviewContext'
import { Ticket, Armchair, Calendar, CheckCircle } from 'lucide-react'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {event && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'var(--wv-card, #111827)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>{event.title}</div>
          {event.date && (
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              תאריך:{' '}
              {new Date(event.date).toLocaleDateString('he-IL')}
            </div>
          )}
          {(event.location || event.venue_name) && (
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              מיקום: {event.venue_name || event.location}
            </div>
          )}
          {event.description && (
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              {event.description}
            </div>
          )}
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
                  gap: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: 'var(--wv-card, #111827)',
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
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    ‎₪{Number(t.price || 0).toFixed(0)}{' '}
                    {typeof t.inventory === 'number' && t.inventory >= 0 && (
                      <span style={{ marginInlineStart: 4 }}>· נשארו {t.inventory}</span>
                    )}
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
                    onClick={() => handleChangeTicketQty(t.id, -1)}
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
                    onClick={() => handleChangeTicketQty(t.id, 1)}
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
                {ticketBusy ? 'מנתב לתשלום…' : 'לתשלום'}
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

