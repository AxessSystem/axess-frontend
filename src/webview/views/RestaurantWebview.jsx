import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE } from '../config'
import { useWebview } from '../WebviewContext'
import ProductCard from '../components/ProductCard'
import WebviewCart from '../components/WebviewCart'
import { UtensilsCrossed, Calendar, ShoppingCart, Bell } from 'lucide-react'

const TABS = [
  { id: 'menu', label: 'תפריט', icon: UtensilsCrossed },
  { id: 'table', label: 'הזמנת שולחן', icon: Calendar },
  { id: 'preorder', label: 'Pre-order', icon: ShoppingCart },
  { id: 'call', label: 'קרא למלצר', icon: Bell },
]

export default function RestaurantWebview() {
  const { slug } = useParams()
  const { items, cart, addItem, updateQty, recipient, trackEvent } = useWebview()
  const [activeTab, setActiveTab] = useState('menu')
  const [search, setSearch] = useState('')

  const [tableDate, setTableDate] = useState('')
  const [tableTime, setTableTime] = useState('')
  const [tableGuests, setTableGuests] = useState(2)
  const [tableNotes, setTableNotes] = useState('')
  const [tableStatus, setTableStatus] = useState(null)

  const [preorderTime, setPreorderTime] = useState('')
  const [callMessage, setCallMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [callStatus, setCallStatus] = useState(null)

  const allItems = Array.isArray(items) ? items : items?.retail || items?.general || []

  const categories = useMemo(() => {
    const set = new Set()
    for (const item of allItems || []) {
      if (item.category) set.add(item.category)
    }
    return ['all', ...Array.from(set)]
  }, [allItems])

  const [selectedCategory, setSelectedCategory] = useState('all')

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (allItems || []).filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (!term) return true
      const txt = `${item.name || ''} ${item.description || ''}`.toLowerCase()
      return txt.includes(term)
    })
  }, [allItems, selectedCategory, search])

  const timeOptions = useMemo(() => {
    const opts = []
    for (let h = 12; h <= 23; h++) {
      for (const m of [0, 30]) {
        const label = `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`
        opts.push(label)
      }
    }
    return opts
  }, [])

  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const qtyForItem = (id) => cart.find((i) => i.id === id)?.quantity || 0

  async function handleTableBooking(e) {
    e?.preventDefault()
    if (!tableDate || !tableTime || !tableGuests) return
    if (!recipient?.phone) {
      setTableStatus({ type: 'error', message: 'יש להזין טלפון לפני הזמנה.' })
      return
    }
    setBusy(true)
    setTableStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/restaurant/table-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tableDate,
          time: tableTime,
          guests: tableGuests,
          notes: tableNotes || null,
          customer_phone: recipient.phone,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאה בשליחת הזמנה')
      }
      setTableStatus({ type: 'success', message: 'הזמנת השולחן נשלחה. תקבל/י אישור ב-WhatsApp.' })
      trackEvent('restaurant_table_booking', {
        date: tableDate,
        time: tableTime,
        guests: tableGuests,
      })
    } catch (err) {
      setTableStatus({ type: 'error', message: err.message || 'שגיאה בשליחת הזמנה' })
    } finally {
      setBusy(false)
    }
  }

  async function handlePreorder(e) {
    e?.preventDefault()
    if (!preorderTime) return
    if (!recipient?.phone) {
      setCallStatus({ type: 'error', message: 'יש להזין טלפון לפני Pre-order.' })
      return
    }
    const itemsForOrder = cart.filter((i) => Number(i.quantity || 0) > 0)
    if (!itemsForOrder.length) {
      setCallStatus({ type: 'error', message: 'סל הקניות ריק.' })
      return
    }
    setBusy(true)
    setCallStatus(null)
    try {
      const total = itemsForOrder.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
        0,
      )
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: recipient.phone,
          order_type: 'retail',
          items: itemsForOrder.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          total_amount: total,
          notes: `Pre-order | ETA: ${preorderTime}`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.order_id) {
        throw new Error(data.error || 'שגיאה ביצירת Pre-order')
      }
      setCallStatus({ type: 'success', message: 'ההזמנה נשמרה. התשלום יתבצע בהגעה.' })
      trackEvent('restaurant_preorder', {
        time: preorderTime,
        items: itemsForOrder.length,
      })
    } catch (err) {
      setCallStatus({ type: 'error', message: err.message || 'שגיאה ביצירת Pre-order' })
    } finally {
      setBusy(false)
    }
  }

  async function handleCallWaiter(e) {
    e?.preventDefault()
    if (!recipient?.phone) {
      setCallStatus({ type: 'error', message: 'יש להזין טלפון לפני קריאה למלצר.' })
      return
    }
    setBusy(true)
    setCallStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/action/call-waiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: recipient.phone,
          message: callMessage || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'שגיאה בקריאה למלצר')
      }
      setCallStatus({ type: 'success', message: '✅ המלצר בדרך אליך!' })
      trackEvent('restaurant_call_waiter', {
        message: callMessage || null,
      })
    } catch (err) {
      setCallStatus({ type: 'error', message: err.message || 'שגיאה בקריאה למלצר' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="search"
              placeholder="חיפוש בתפריט..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.5)',
                background: 'rgba(15,23,42,0.8)',
                color: 'var(--wv-text, #fff)',
                fontSize: 13,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '4px 0',
              overflowX: 'auto',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: 'none',
                  whiteSpace: 'nowrap',
                  background:
                    selectedCategory === cat ? 'var(--wv-primary, #22C55E)' : 'rgba(15,23,42,0.9)',
                  color: selectedCategory === cat ? '#020617' : 'var(--wv-text, #fff)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {cat === 'all' ? 'הכל' : cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                quantity={qtyForItem(item.id)}
                onAdd={() => addItem(item)}
                onRemove={() => updateQty(item.id, qtyForItem(item.id) - 1)}
              />
            ))}
          </div>
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
            <select
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
            >
              <option value="">בחר שעה</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
              {Array.from({ length: 12 }).map((_, i) => (
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
            disabled={busy}
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
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'שולח...' : 'שלח הזמנת שולחן'}
          </button>
        </form>
      )}

      {activeTab === 'preorder' && (
        <form
          onSubmit={handlePreorder}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
        >
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              שעת הגעה משוערת
            </label>
            <input
              type="time"
              value={preorderTime}
              onChange={(e) => setPreorderTime(e.target.value)}
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
            type="submit"
            disabled={busy}
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
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'שומר...' : 'שמור Pre-order'}
          </button>
        </form>
      )}

      {activeTab === 'call' && (
        <form
          onSubmit={handleCallWaiter}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
        >
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              מה תרצה לבקש? (אופציונלי)
            </label>
            <textarea
              rows={3}
              value={callMessage}
              onChange={(e) => setCallMessage(e.target.value)}
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
            type="submit"
            disabled={busy}
            style={{
              marginTop: 4,
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '14px 10px',
              background: 'var(--wv-primary, #22C55E)',
              color: '#020617',
              fontSize: 16,
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'שולח...' : 'קרא למלצר'}
          </button>
        </form>
      )}
      {(activeTab === 'menu' || activeTab === 'preorder') && <WebviewCart items={cart} />}
    </div>
  )
}

