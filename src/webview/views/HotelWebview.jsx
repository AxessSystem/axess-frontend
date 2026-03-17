import { useEffect, useMemo, useState } from 'react'
import { BellRing, Sparkles, DoorOpen, ClipboardList } from 'lucide-react'
import { API_BASE } from '../config'
import { useWebview } from '../WebviewContext'
import WebviewWhatsAppAccordion from '../components/WebviewWhatsAppAccordion'

const TABS = [
  { id: 'room_service', label: 'שירות חדרים', icon: BellRing },
  { id: 'spa', label: 'ספא / פנאי', icon: Sparkles },
  { id: 'late_checkout', label: 'Late Checkout', icon: DoorOpen },
  { id: 'requests', label: 'בקשות מיוחדות', icon: ClipboardList },
]

export default function HotelWebview({ business, items }) {
  const { recipient, trackEvent, business: ctxBiz } = useWebview()
  const effectiveBusiness = business || ctxBiz
  const slug = effectiveBusiness?.slug

  const [activeTab, setActiveTab] = useState('room_service')
  const [roomNumber, setRoomNumber] = useState('')
  const [callStatus, setCallStatus] = useState(null)
  const [callBusy, setCallBusy] = useState(false)

  const [spaDate, setSpaDate] = useState('')
  const [spaTime, setSpaTime] = useState('')
  const [spaNotes, setSpaNotes] = useState('')
  const [spaStatus, setSpaStatus] = useState(null)
  const [spaBusy, setSpaBusy] = useState(false)

  const [lateTime, setLateTime] = useState('')
  const [lateStatus, setLateStatus] = useState(null)
  const [lateBusy, setLateBusy] = useState(false)

  const [requestText, setRequestText] = useState('')
  const [requestStatus, setRequestStatus] = useState(null)
  const [requestBusy, setRequestBusy] = useState(false)

  const [roomItems, setRoomItems] = useState(() =>
    (items || []).map((i) => ({ ...i, quantity: 0 })),
  )

  const hotelItems = useMemo(
    () =>
      roomItems.filter((i) =>
        (i.category || '').toLowerCase().includes('hotel'),
      ),
    [roomItems],
  )

  const spaItems = useMemo(
    () =>
      (items || []).filter((i) =>
        (i.category || '').toLowerCase().includes('spa'),
      ),
    [items],
  )

  useEffect(() => {
    const key = slug ? `wv:${slug}:room` : null
    if (!key) return
    try {
      const saved = localStorage.getItem(key)
      if (saved) setRoomNumber(saved)
    } catch {
      // ignore
    }
  }, [slug])

  useEffect(() => {
    const key = slug ? `wv:${slug}:room` : null
    if (!key) return
    try {
      localStorage.setItem(key, roomNumber || '')
    } catch {
      // ignore
    }
  }, [slug, roomNumber])

  const updateQuantity = (id, delta) => {
    setRoomItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) + delta) }
          : item,
      ),
    )
  }

  const roomCart = useMemo(
    () => hotelItems.filter((i) => Number(i.quantity || 0) > 0),
    [hotelItems],
  )

  const roomTotal = useMemo(
    () =>
      roomCart.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
        0,
      ),
    [roomCart],
  )

  const handleRoomServiceOrder = async () => {
    if (!slug || !recipient?.phone || !roomCart.length) return
    if (!roomNumber.trim()) {
      setCallStatus({ type: 'error', message: 'נא למלא מספר חדר.' })
      return
    }
    setCallBusy(true)
    setCallStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: recipient.phone,
          order_type: 'room_service',
          items: roomCart.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          total_amount: roomTotal,
          room_number: roomNumber,
          notes: null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.order_id) {
        throw new Error(data.error || 'שגיאה ביצירת הזמנה')
      }
      setCallStatus({
        type: 'success',
        message: 'ההזמנה נשלחה. החיוב יתבצע בצ\'ק-אאוט.',
      })
      trackEvent('hotel_room_service_order', {
        room: roomNumber,
        items: roomCart.length,
        total: roomTotal,
      })
      setRoomItems((prev) =>
        prev.map((i) =>
          hotelItems.find((h) => h.id === i.id)
            ? { ...i, quantity: 0 }
            : i,
        ),
      )
    } catch (err) {
      setCallStatus({ type: 'error', message: err.message || 'שגיאה ביצירת הזמנה' })
    } finally {
      setCallBusy(false)
    }
  }

  const handleSpaBooking = async (e) => {
    e?.preventDefault()
    if (!slug || !recipient?.phone || !spaDate || !spaTime) return
    setSpaBusy(true)
    setSpaStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/restaurant/table-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: spaDate,
          time: spaTime,
          guests: 1,
          notes: spaNotes ? `spa: ${spaNotes}` : 'spa',
          customer_phone: recipient.phone,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאה בשליחת בקשה')
      }
      setSpaStatus({
        type: 'success',
        message: 'הבקשה נשלחה. נציג הספא יחזור אליך ב-WhatsApp.',
      })
      trackEvent('hotel_spa_booking', {
        date: spaDate,
        time: spaTime,
      })
    } catch (err) {
      setSpaStatus({ type: 'error', message: err.message || 'שגיאה בשליחת בקשה' })
    } finally {
      setSpaBusy(false)
    }
  }

  const handleLateCheckout = async (e) => {
    e?.preventDefault()
    if (!slug || !recipient?.phone || !lateTime) return
    setLateBusy(true)
    setLateStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/action/call-waiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: recipient.phone,
          message: `Late checkout עד ${lateTime}`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאה בשליחת בקשה')
      }
      setLateStatus({
        type: 'success',
        message: 'הבקשה ל-Late checkout נשלחה לקבלה.',
      })
      trackEvent('hotel_late_checkout', { time: lateTime })
    } catch (err) {
      setLateStatus({ type: 'error', message: err.message || 'שגיאה בשליחת בקשה' })
    } finally {
      setLateBusy(false)
    }
  }

  const handleSpecialRequest = async (e) => {
    e?.preventDefault()
    if (!slug || !recipient?.phone || !requestText.trim()) return
    setRequestBusy(true)
    setRequestStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/action/call-waiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: recipient.phone,
          message: requestText.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאה בשליחת בקשה')
      }
      setRequestStatus({
        type: 'success',
        message: 'הבקשה נשלחה לקבלה.',
      })
      trackEvent('hotel_special_request', {})
      setRequestText('')
    } catch (err) {
      setRequestStatus({ type: 'error', message: err.message || 'שגיאה בשליחת בקשה' })
    } finally {
      setRequestBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 90 }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '2px 2px 6px',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => {
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

      <div style={{ padding: '8px 4px' }}>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
          מספר חדר
        </label>
        <input
          type="text"
          placeholder="לדוגמה: 418"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.5)',
            background: 'rgba(15,23,42,0.7)',
            color: 'var(--wv-text, #fff)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {activeTab === 'room_service' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hotelItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: 'var(--wv-card, #111827)',
                }}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--wv-font, "Heebo", "Arial", sans-serif)',
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontFamily: 'var(--wv-font, "Heebo", "Arial", sans-serif)',
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: 4,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    ‎₪{Number(item.price || 0).toFixed(0)}
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
                    onClick={() => updateQuantity(item.id, -1)}
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
                  <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13 }}>
                    {Number(item.quantity || 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
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
            ))}
          </div>
          {callStatus && (
            <div
              style={{
                fontSize: 13,
                color: callStatus.type === 'success' ? '#bbf7d0' : '#fecaca',
              }}
            >
              {callStatus.message}
            </div>
          )}
          <button
            type="button"
            disabled={!roomCart.length || !recipient?.phone || callBusy}
            onClick={handleRoomServiceOrder}
            style={{
              marginTop: 4,
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '12px 10px',
              background:
                !roomCart.length || !recipient?.phone || callBusy
                  ? 'rgba(148,163,184,0.4)'
                  : 'var(--wv-primary, #22C55E)',
              color:
                !roomCart.length || !recipient?.phone || callBusy
                  ? 'rgba(226,232,240,0.9)'
                  : '#020617',
              fontSize: 15,
              fontWeight: 700,
              cursor:
                !roomCart.length || !recipient?.phone || callBusy ? 'default' : 'pointer',
            }}
          >
            {callBusy ? 'שולח...' : 'שלח הזמנה לחדר'}
          </button>
        </div>
      )}

      {activeTab === 'spa' && (
        <form
          onSubmit={handleSpaBooking}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
        >
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>תאריך</label>
            <input
              type="date"
              value={spaDate}
              onChange={(e) => setSpaDate(e.target.value)}
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
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>שעה</label>
            <input
              type="time"
              value={spaTime}
              onChange={(e) => setSpaTime(e.target.value)}
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
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              העדפות / הערות (אופציונלי)
            </label>
            <textarea
              rows={3}
              value={spaNotes}
              onChange={(e) => setSpaNotes(e.target.value)}
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
          {spaStatus && (
            <div
              style={{
                fontSize: 13,
                color: spaStatus.type === 'success' ? '#bbf7d0' : '#fecaca',
              }}
            >
              {spaStatus.message}
            </div>
          )}
          <button
            type="submit"
            disabled={spaBusy || !recipient?.phone}
            style={{
              marginTop: 4,
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '12px 10px',
              background:
                spaBusy || !recipient?.phone
                  ? 'rgba(148,163,184,0.4)'
                  : 'var(--wv-primary, #22C55E)',
              color:
                spaBusy || !recipient?.phone ? 'rgba(226,232,240,0.9)' : '#020617',
              fontSize: 15,
              fontWeight: 700,
              cursor: spaBusy || !recipient?.phone ? 'default' : 'pointer',
            }}
          >
            {spaBusy ? 'שולח...' : 'שלח בקשת ספא'}
          </button>
        </form>
      )}

      {activeTab === 'late_checkout' && (
        <form
          onSubmit={handleLateCheckout}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
        >
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              שעה מבוקשת (12:00–16:00)
            </label>
            <select
              value={lateTime}
              onChange={(e) => setLateTime(e.target.value)}
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
              <option value="">בחר שעה</option>
              {['12:00', '13:00', '14:00', '15:00', '16:00'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {lateStatus && (
            <div
              style={{
                fontSize: 13,
                color: lateStatus.type === 'success' ? '#bbf7d0' : '#fecaca',
              }}
            >
              {lateStatus.message}
            </div>
          )}
          <button
            type="submit"
            disabled={lateBusy || !lateTime || !recipient?.phone}
            style={{
              marginTop: 4,
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '12px 10px',
              background:
                lateBusy || !lateTime || !recipient?.phone
                  ? 'rgba(148,163,184,0.4)'
                  : 'var(--wv-primary, #22C55E)',
              color:
                lateBusy || !lateTime || !recipient?.phone
                  ? 'rgba(226,232,240,0.9)'
                  : '#020617',
              fontSize: 15,
              fontWeight: 700,
              cursor:
                lateBusy || !lateTime || !recipient?.phone ? 'default' : 'pointer',
            }}
          >
            {lateBusy ? 'שולח...' : 'בקש Late Checkout'}
          </button>
        </form>
      )}

      {activeTab === 'requests' && (
        <form
          onSubmit={handleSpecialRequest}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
        >
          <label style={{ fontSize: 13, marginBottom: 2 }}>בקשה מיוחדת</label>
          <textarea
            rows={3}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="כתוב/י כאן כל בקשה או הערה שתרצה להעביר לקבלה"
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
          {requestStatus && (
            <div
              style={{
                fontSize: 13,
                color: requestStatus.type === 'success' ? '#bbf7d0' : '#fecaca',
              }}
            >
              {requestStatus.message}
            </div>
          )}
          <button
            type="submit"
            disabled={requestBusy || !requestText.trim() || !recipient?.phone}
            style={{
              marginTop: 4,
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '12px 10px',
              background:
                requestBusy || !requestText.trim() || !recipient?.phone
                  ? 'rgba(148,163,184,0.4)'
                  : 'var(--wv-primary, #22C55E)',
              color:
                requestBusy || !requestText.trim() || !recipient?.phone
                  ? 'rgba(226,232,240,0.9)'
                  : '#020617',
              fontSize: 15,
              fontWeight: 700,
              cursor:
                requestBusy || !requestText.trim() || !recipient?.phone
                  ? 'default'
                  : 'pointer',
            }}
          >
            {requestBusy ? 'שולח...' : 'שלח בקשה'}
          </button>
        </form>
      )}
      {effectiveBusiness && <WebviewWhatsAppAccordion business={effectiveBusiness} />}
    </div>
  )
}

