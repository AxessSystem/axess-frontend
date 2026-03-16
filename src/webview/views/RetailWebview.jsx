import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, ShoppingCart, Package } from 'lucide-react'
import { API_BASE } from '../config'
import { useWebview } from '../WebviewContext'

const TABS = [
  { id: 'catalog', label: 'קטלוג', icon: ShoppingBag },
  { id: 'cart', label: 'סל', icon: ShoppingCart },
  { id: 'orders', label: 'הזמנות שלי', icon: Package },
]

export default function RetailWebview({ business, items }) {
  const { recipient, trackEvent, business: ctxBiz } = useWebview()
  const effectiveBusiness = business || ctxBiz
  const slug = effectiveBusiness?.slug

  const [activeTab, setActiveTab] = useState('catalog')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [address, setAddress] = useState('')
  const [deliveryType, setDeliveryType] = useState('pickup') // 'pickup' | 'delivery'
  const [couponCode, setCouponCode] = useState('')
  const [couponInfo, setCouponInfo] = useState(null)
  const [couponError, setCouponError] = useState(null)
  const [couponBusy, setCouponBusy] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)

  const [cartItems, setCartItems] = useState(() => {
    const flat = []
    if (items?.retail?.length) flat.push(...items.retail)
    if (items?.general?.length) flat.push(...items.general)
    return flat.map((i) => ({ ...i, quantity: 0 }))
  })

  const categories = useMemo(() => {
    const set = new Set()
    for (const item of cartItems) {
      if (item.category) set.add(item.category)
    }
    return ['all', ...Array.from(set)]
  }, [cartItems])

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return cartItems.filter((i) => {
      if (selectedCategory !== 'all' && i.category !== selectedCategory) return false
      if (!term) return true
      const txt = `${i.name || ''} ${i.description || ''}`.toLowerCase()
      return txt.includes(term)
    })
  }, [cartItems, selectedCategory, search])

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) + delta) }
          : item,
      ),
    )
  }

  const itemsForOrder = useMemo(
    () => cartItems.filter((i) => Number(i.quantity || 0) > 0),
    [cartItems],
  )

  const cartTotal = useMemo(
    () =>
      itemsForOrder.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
        0,
      ),
    [itemsForOrder],
  )

  const discountedTotal = useMemo(() => {
    if (!couponInfo) return cartTotal
    const type = couponInfo.discount_type || 'amount'
    const value = Number(couponInfo.discount_value || 0)
    if (!value) return cartTotal
    if (type === 'percent') {
      return Math.max(0, cartTotal - (cartTotal * value) / 100)
    }
    return Math.max(0, cartTotal - value)
  }, [cartTotal, couponInfo])

  const handleValidateCoupon = async () => {
    if (!slug || !couponCode.trim()) return
    setCouponBusy(true)
    setCouponError(null)
    setCouponInfo(null)
    try {
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/retail/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'קוד קופון לא תקין')
      }
      setCouponInfo(data)
      trackEvent('retail_coupon_validated', {
        code: couponCode.trim(),
        discount_type: data.discount_type,
      })
    } catch (err) {
      setCouponError(err.message || 'קוד קופון לא תקין')
    } finally {
      setCouponBusy(false)
    }
  }

  const handleCheckout = async () => {
    if (!slug || !recipient?.phone || !itemsForOrder.length || !discountedTotal) return
    if (deliveryType === 'delivery' && !address.trim()) {
      setCheckoutError('נא למלא כתובת למשלוח.')
      return
    }
    setCheckoutBusy(true)
    setCheckoutError(null)
    try {
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
          total_amount: discountedTotal,
          notes:
            deliveryType === 'delivery'
              ? `משלוח לכתובת: ${address}`
              : 'איסוף מהחנות',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.payment_url) {
        throw new Error(data.error || 'שגיאה ביצירת הזמנה')
      }
      trackEvent('retail_order', {
        items: itemsForOrder.length,
        total: discountedTotal,
        delivery_type: deliveryType,
      })
      window.location.href = data.payment_url
    } catch (err) {
      setCheckoutError(err.message || 'שגיאה ביצירת הזמנה')
    } finally {
      setCheckoutBusy(false)
    }
  }

  const loadOrders = async () => {
    if (!slug || !recipient?.phone) return
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const url = `${API_BASE}/api/w/${encodeURIComponent(
        slug,
      )}/retail/orders?phone=${encodeURIComponent(recipient.phone)}`
      const res = await fetch(url)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בשליפת הזמנות')
      }
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (err) {
      setOrdersError(err.message || 'שגיאה בשליפת הזמנות')
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders()
    }
  }, [activeTab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="search"
              placeholder="חיפוש במוצרים..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
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
              padding: '4px 2px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
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
                  color: selectedCategory === cat ? '#000' : 'var(--wv-text, #fff)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {cat === 'all' ? 'הכל' : cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleItems.map((item) => (
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
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }}
                  />
                )}
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
                    {item.name}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
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
        </div>
      )}

      {activeTab === 'cart' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13 }}>בחירת סוג הזמנה</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setDeliveryType('pickup')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 999,
                  border: 'none',
                  background:
                    deliveryType === 'pickup' ? 'var(--wv-primary, #22C55E)' : 'rgba(15,23,42,0.9)',
                  color: deliveryType === 'pickup' ? '#020617' : 'var(--wv-text, #fff)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                איסוף עצמי
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 999,
                  border: 'none',
                  background:
                    deliveryType === 'delivery'
                      ? 'var(--wv-primary, #22C55E)'
                      : 'rgba(15,23,42,0.9)',
                  color: deliveryType === 'delivery' ? '#020617' : 'var(--wv-text, #fff)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                משלוח
              </button>
            </div>
          </div>

          {deliveryType === 'delivery' && (
            <div style={{ padding: '0 4px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13 }}>כתובת / פרטי משלוח</label>
              <textarea
                placeholder="כתובת מדויקת, קומה, הערות לשליח"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
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
          )}

          <div
            style={{
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <label style={{ fontSize: 13 }}>קופון</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="הכנס/י קוד קופון"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.5)',
                  background: 'rgba(15,23,42,0.7)',
                  color: 'var(--wv-text, #fff)',
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                onClick={handleValidateCoupon}
                disabled={couponBusy || !couponCode.trim()}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '8px 14px',
                  background: couponBusy ? 'rgba(148,163,184,0.5)' : 'var(--wv-primary, #22C55E)',
                  color: '#020617',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: couponBusy || !couponCode.trim() ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {couponBusy ? 'בודק...' : 'בדיקת קופון'}
              </button>
            </div>
            {couponError && (
              <div style={{ fontSize: 12, color: '#fecaca' }}>{couponError}</div>
            )}
            {couponInfo && (
              <div style={{ fontSize: 12, color: '#bbf7d0' }}>
                קופון הופעל: {couponInfo.title || couponCode}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '8px 4px',
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
              <span>סיכום הזמנה</span>
              <span style={{ fontWeight: 700 }}>
                ‎₪{cartTotal.toFixed(0)}
                {discountedTotal !== cartTotal && (
                  <span style={{ marginInlineStart: 6, fontSize: 12, opacity: 0.8 }}>
                    לאחר קופון: ‎₪{discountedTotal.toFixed(0)}
                  </span>
                )}
              </span>
            </div>
            {checkoutError && (
              <div style={{ fontSize: 12, color: '#fecaca' }}>{checkoutError}</div>
            )}
            <button
              type="button"
              disabled={!itemsForOrder.length || !recipient?.phone || checkoutBusy}
              onClick={handleCheckout}
              style={{
                marginTop: 2,
                width: '100%',
                border: 'none',
                borderRadius: 12,
                padding: '12px 10px',
                background:
                  !itemsForOrder.length || !recipient?.phone || checkoutBusy
                    ? 'rgba(148,163,184,0.4)'
                    : 'var(--wv-primary, #22C55E)',
                color:
                  !itemsForOrder.length || !recipient?.phone || checkoutBusy
                    ? 'rgba(226,232,240,0.9)'
                    : '#020617',
                fontSize: 15,
                fontWeight: 700,
                cursor:
                  !itemsForOrder.length || !recipient?.phone || checkoutBusy
                    ? 'default'
                    : 'pointer',
              }}
            >
              {checkoutBusy ? 'מנתב לתשלום…' : 'לתשלום'}
            </button>
            {!recipient?.phone && (
              <div style={{ fontSize: 12, color: '#fecaca' }}>
                יש להזין טלפון בחלק העליון לפני התשלום.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 4,
          }}
        >
          {!recipient?.phone && (
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              כדי לראות הזמנות קודמות, אנא הזינו טלפון בחלק העליון.
            </div>
          )}
          {recipient?.phone && (
            <>
              {ordersLoading && <div style={{ fontSize: 13 }}>טוען הזמנות…</div>}
              {ordersError && (
                <div style={{ fontSize: 13, color: '#fecaca' }}>{ordersError}</div>
              )}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.8 }}>לא נמצאו הזמנות קודמות.</div>
              )}
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    background: 'var(--wv-card, #111827)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    הזמנה {order.order_number || order.id}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    סטטוס: {order.status}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    סכום: ‎₪{Number(order.total_amount || 0).toFixed(0)}
                  </div>
                  {order.created_at && (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      תאריך: {new Date(order.created_at).toLocaleString('he-IL')}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

