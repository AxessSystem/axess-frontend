import { useState } from 'react'
import { Wine, ShoppingBag, Check, Users, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import PaymentModal from '@/components/PaymentModal'

export function TableBookingModalContent({
  modalTicket,
  event,
  tableStep,
  setTableStep,
  tableForm,
  setTableForm,
  totalFreePeople,
  maxExtras,
  totalBottles,
  drinksTotal,
  extraPeople,
  extraTicketsCost,
  total,
  paying,
  setPaying,
  setModalTicket,
  slug,
  promoRef,
  setSuccess,
  setPendingApproval,
  API_BASE,
  trackStep,
}) {
  const [drinkSearch, setDrinkSearch] = useState('')
  const isSmartTable = modalTicket?.metadata?.table_type === 'smart'
  const menuItems = (event.table_menu || []).filter((item) => item.category !== 'תוספות')
  const extrasOptions = (event.table_menu || []).filter((item) => item.category === 'תוספות')
  const hasExtras = Object.values(tableForm.selected_drinks || {}).some(
    (d) => (d.free_extras || 0) > 0 && d.quantity > 0,
  )

  const backTo = (nextStep) => {
    trackStep?.(tableStep)
    setTableStep(nextStep)
  }

  const resetAfterClose = () => {
    trackStep?.(tableStep)
    setModalTicket(null)
    setTableStep(1)
    setDrinkSearch('')
  }

  const getExtrasCounts = (raw) => {
    if (!raw) return {}
    if (Array.isArray(raw)) {
      return raw.reduce((acc, name) => {
        if (!name) return acc
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})
    }
    if (typeof raw === 'object') return { ...raw }
    return {}
  }

  const flatExtras = () =>
    Object.entries(tableForm.extras_by_drink || {}).flatMap(([drinkId, extras]) => {
      const counts = getExtrasCounts(extras)
      return Object.entries(counts).flatMap(([name, qty]) =>
        Array(Math.max(0, Number(qty) || 0)).fill(name),
      )
    })

  const calcTablePrice = () => ({ total })

  const submitTableReserve = async () => {
    setPaying(true)
    try {
      const drinks = Object.values(tableForm.selected_drinks || {})
      const drinkSummary = drinks.map((d) => `${d.name}×${d.quantity}`).join(', ')
      const ex = flatExtras()
      const payload = {
        ticket_type_id: modalTicket.id,
        quantity: 1,
        buyer_name: tableForm.customer_name.trim(),
        buyer_phone: tableForm.customer_phone.trim(),
        buyer_email: tableForm.customer_email.trim() || undefined,
        total_amount: total,
        table_data: {
          ...tableForm,
          guest_count: tableForm.guest_count,
          drink_summary: drinkSummary,
          drink_quantity: totalBottles,
          drink_name: drinkSummary || tableForm.drink_name,
        },
        custom_fields: {
          instagram: tableForm.customer_instagram || undefined,
          drink: drinkSummary,
          drink_quantity: totalBottles,
          extras: ex,
          extras_by_drink: tableForm.extras_by_drink,
          selected_drinks: tableForm.selected_drinks,
          guests: tableForm.guests,
          payment_mode: tableForm.payment_mode,
        },
        ...(promoRef ? { ref: promoRef } : {}),
      }
      const res = await fetch(`${API_BASE}/e/${slug}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'שגיאה')
      }
      if (data.status === 'pending_approval') {
        setPendingApproval(true)
        resetAfterClose()
        toast.success('הבקשה נשלחה לאישור')
        return
      }
      if (!data.order_id) {
        throw new Error('שגיאה ביצירת הזמנה')
      }
      if (data.total_amount === 0 || data.client_secret === 'free_order') {
        const conf = await fetch(`${API_BASE}/e/${slug}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id }),
        })
        const confData = await conf.json()
        if (!conf.ok) throw new Error(confData.error || 'שגיאה')
        setSuccess(true)
        resetAfterClose()
        toast.success('הכרטיס בדרך!')
        return
      }

      const payRes = await fetch(`${API_BASE}/e/${slug}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: data.order_id,
          customer_name: tableForm.customer_name,
          customer_phone: tableForm.customer_phone,
          customer_email: tableForm.customer_email,
        }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) {
        throw new Error(payData.error || payData.message || 'שגיאה ביצירת תשלום')
      }
      if (payData.payment_url) {
        window.location.href = payData.payment_url
      } else {
        throw new Error('שגיאה ביצירת לינק תשלום')
      }
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'שגיאה')
    } finally {
      setPaying(false)
    }
  }

  const canContinueStep1 =
    Object.keys(tableForm.selected_drinks || {}).length > 0 && totalBottles > 0
  const maxGuests = tableForm.guest_count - 1

  return (
    <div
      style={{
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--card)',
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              margin: '0 auto',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (!paying) resetAfterClose()
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: paying ? 'not-allowed' : 'pointer',
              color: '#fff',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>{modalTicket.name}</h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: s <= tableStep ? '#00C37A' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            שלב {tableStep} מתוך 7
          </p>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 20px',
        }}
      >
      {tableStep === 1 && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wine size={18} color="#00C37A" />
            {isSmartTable ? 'בחר משקאות לשולחן' : 'בחר חבילת שולחן'}
          </h3>

          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              value={drinkSearch}
              onChange={(e) => setDrinkSearch(e.target.value)}
              placeholder="חפש מוצר או קטגוריה..."
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                padding: '0 14px 0 40px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
              }}
            />
          </div>

          <div>
            {Object.entries(
              menuItems.filter(
                  (m) =>
                    !drinkSearch
                    || String(m.name || '')
                      .toLowerCase()
                      .includes(drinkSearch.toLowerCase())
                    || String(m.category || '')
                      .toLowerCase()
                      .includes(drinkSearch.toLowerCase()),
                )
                .reduce((acc, item) => {
                  const c = item.category || 'אחר'
                  if (!acc[c]) acc[c] = []
                  acc[c].push(item)
                  return acc
                }, {}),
            ).map(([category, items]) => (
              <div key={category}>
                <p
                  style={{
                    margin: '8px 0 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {category}
                </p>
                {items.map((item) => {
                  const qty = tableForm.selected_drinks?.[item.id]?.quantity || 0
                  const fe = Number(item.free_extras) || 0
                  const fent = Number(item.free_entries) || 0
                  const itemSub =
                    fe > 0
                      ? `· ${fe} תוספות לבחירה`
                      : fent > 0
                        ? `· ${fent} כניסות חינם`
                        : ''
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        marginBottom: 6,
                        border: `1px solid ${qty > 0 ? 'rgba(0,195,122,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        background: qty > 0 ? 'rgba(0,195,122,0.08)' : 'rgba(255,255,255,0.03)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: qty > 0 ? 700 : 400 }}>{item.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          {item.category}
                          {itemSub && (
                            <span style={{ color: 'rgba(0,195,122,0.6)', marginRight: 6 }}>{itemSub}</span>
                          )}
                        </p>
                        {item.description && (
                          <p
                            style={{
                              fontSize: 11,
                              color: 'var(--v2-gray-400)',
                              margin: '2px 0 0',
                            }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#00C37A',
                          minWidth: 60,
                          textAlign: 'left',
                        }}
                      >
                        ₪
                        {parseFloat(item.price).toLocaleString()}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = qty - 1
                              setTableForm((f) => {
                                const drinks = { ...(f.selected_drinks || {}) }
                                if (newQty === 0) {
                                  delete drinks[item.id]
                                  const eb = { ...(f.extras_by_drink || {}) }
                                  delete eb[item.id]
                                  return { ...f, selected_drinks: drinks, extras_by_drink: eb }
                                }
                                drinks[item.id] = { ...item, quantity: newQty }
                                return { ...f, selected_drinks: drinks }
                              })
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              border: '1px solid rgba(239,68,68,0.4)',
                              background: 'rgba(239,68,68,0.1)',
                              color: '#EF4444',
                              fontSize: 16,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            −
                          </button>
                        )}
                        {qty > 0 && (
                          <span style={{ fontSize: 15, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>
                            {qty}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setTableForm((f) => {
                              const drinks = { ...(f.selected_drinks || {}) }
                              drinks[item.id] = {
                                ...item,
                                quantity: (drinks[item.id]?.quantity || 0) + 1,
                              }
                              return { ...f, selected_drinks: drinks }
                            })
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '1px solid rgba(0,195,122,0.5)',
                            background: 'rgba(0,195,122,0.1)',
                            color: '#00C37A',
                            fontSize: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {Object.keys(tableForm.selected_drinks || {}).length > 0 && (
            <div style={{ background: 'rgba(0,195,122,0.08)', borderRadius: 10, padding: 12, marginTop: 12 }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#00C37A' }}>נבחרו:</p>
              {Object.values(tableForm.selected_drinks || {}).map((d) => (
                <p key={d.id} style={{ margin: '2px 0', fontSize: 13 }}>
                  {d.name} ×{d.quantity} — ₪{(parseFloat(d.price) * d.quantity).toLocaleString()}
                </p>
              ))}
              <p style={{ margin: '8px 0 0', fontWeight: 800, fontSize: 15, color: '#00C37A' }}>
                סה&quot;כ שתייה: ₪
                {Object.values(tableForm.selected_drinks || {})
                  .reduce((s, d) => s + parseFloat(d.price) * d.quantity, 0)
                  .toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {tableStep === 2 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={18} color="#00C37A" /> סיכום משקאות
          </h4>
          <div style={{ background: 'rgba(0,195,122,0.08)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            {Object.values(tableForm.selected_drinks || {}).map((d) => (
              <p key={d.id} style={{ margin: '4px 0', fontSize: 14 }}>
                {d.name} ×{d.quantity} — ₪{(parseFloat(d.price) * d.quantity).toLocaleString()}
              </p>
            ))}
            <p style={{ margin: '12px 0 0', fontSize: 14, color: '#00C37A', fontWeight: 600 }}>
              {totalBottles} בקבוקים = {totalFreePeople} אנשים חינם + עד {maxExtras} תוספות
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              סה&quot;כ שתייה: ₪{drinksTotal.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {tableStep === 3 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#00C37A" /> כמות אנשים בשולחן
          </h4>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            עד {totalFreePeople} אנשים כלולים במחיר
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setTableForm((f) => ({ ...f, guest_count: Math.max(1, f.guest_count - 1) }))}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'none',
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer',
              }}
            >
              −
            </button>
            <span style={{ fontSize: 36, fontWeight: 900 }}>{tableForm.guest_count}</span>
            <button
              type="button"
              onClick={() => setTableForm((f) => ({ ...f, guest_count: f.guest_count + 1 }))}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid #00C37A',
                background: 'rgba(0,195,122,0.1)',
                color: '#00C37A',
                fontSize: 24,
                cursor: 'pointer',
              }}
            >
              +
            </button>
          </div>
          {extraPeople > 0 && (
            <div
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
                ⚠️ {extraPeople} אנשים מעל המכסה החינמית
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                כרטיס נוסף: ₪{tableForm.extra_ticket_price} × {extraPeople} = ₪
                {extraTicketsCost.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {tableStep === 4 && (
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={18} color="#00C37A" /> תוספות לשולחן
          </h4>

          {extrasOptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.4)' }}>
              <p>אין אפשרויות תוספת בתפריט (הוסיפו פריטים לקטגוריית &quot;תוספות&quot;)</p>
            </div>
          ) : (
            Object.values(tableForm.selected_drinks || {}).map((drink) => {
              const maxForDrink = (drink.free_extras || 0) * drink.quantity
              if (maxForDrink <= 0) return null
              const counts = getExtrasCounts(tableForm.extras_by_drink?.[drink.id])
              const totalSelected = Object.values(counts).reduce((sum, qty) => sum + (Number(qty) || 0), 0)
              return (
                <div key={drink.id} style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.6)',
                      margin: '0 0 8px',
                    }}
                  >
                    {drink.name} ×{drink.quantity} — בחר עד {maxForDrink} תוספות:
                  </p>
                  {extrasOptions.map((extraItem) => {
                    const name = extraItem.name || ''
                    const qtyForExtra = counts[name] || 0

                    return (
                      <div
                        key={`${drink.id}_${extraItem.id || name}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 10,
                          marginBottom: 6,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (qtyForExtra <= 0) return
                            setTableForm((f) => {
                              const prev = getExtrasCounts(f.extras_by_drink?.[drink.id])
                              const next = { ...prev }
                              const nextQty = (next[name] || 0) - 1
                              if (nextQty <= 0) delete next[name]
                              else next[name] = nextQty
                              const eb = { ...(f.extras_by_drink || {}) }
                              if (Object.keys(next).length === 0) delete eb[drink.id]
                              else eb[drink.id] = next
                              return { ...f, extras_by_drink: eb }
                            })
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid rgba(239,68,68,0.4)',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#EF4444',
                            fontSize: 18,
                            cursor: qtyForExtra > 0 ? 'pointer' : 'not-allowed',
                            opacity: qtyForExtra > 0 ? 1 : 0.4,
                            lineHeight: 1,
                          }}
                        >
                          −
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                          {qtyForExtra}
                        </span>
                        <button
                          type="button"
                          disabled={totalSelected >= maxForDrink}
                          onClick={() => {
                            setTableForm((f) => {
                              const prev = getExtrasCounts(f.extras_by_drink?.[drink.id])
                              const curTotal = Object.values(prev).reduce((s, q) => s + (Number(q) || 0), 0)
                              if (curTotal >= maxForDrink) return f
                              return {
                                ...f,
                                extras_by_drink: {
                                  ...(f.extras_by_drink || {}),
                                  [drink.id]: {
                                    ...prev,
                                    [name]: (prev[name] || 0) + 1,
                                  },
                                },
                              }
                            })
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid rgba(0,195,122,0.5)',
                            background: 'rgba(0,195,122,0.1)',
                            color: '#00C37A',
                            fontSize: 18,
                            cursor: totalSelected >= maxForDrink ? 'not-allowed' : 'pointer',
                            opacity: totalSelected >= maxForDrink ? 0.4 : 1,
                            lineHeight: 1,
                          }}
                        >
                          +
                        </button>
                        <span style={{ fontSize: 14, flex: 1 }}>{name}</span>
                      </div>
                    )
                  })}
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                    {totalSelected} / {maxForDrink} תוספות נבחרו
                  </p>
                </div>
              )
            })
          )}
        </div>
      )}

      {tableStep === 5 && (
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#00C37A" /> פרטים אישיים
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { field: 'customer_name', placeholder: 'שם מלא *', type: 'text', required: true },
              { field: 'customer_phone', placeholder: 'טלפון * (לקבלת QR בWA)', type: 'tel', required: true },
              { field: 'customer_email', placeholder: 'מייל (אופציונלי)', type: 'email' },
              { field: 'customer_instagram', placeholder: 'אינסטגרם (אופציונלי)', type: 'text' },
            ].map((f) => (
              <input
                key={f.field}
                value={tableForm[f.field]}
                onChange={(e) => setTableForm((prev) => ({ ...prev, [f.field]: e.target.value }))}
                placeholder={f.placeholder}
                type={f.type}
                style={{
                  height: 48,
                  borderRadius: 10,
                  border: `1px solid ${f.required && !tableForm[f.field] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  padding: '0 14px',
                  fontSize: 15,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {tableStep === 6 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#00C37A" /> חברי שולחן
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            אופציונלי — כל חבר יקבל QR אישי בWA
          </p>
          {tableForm.guests.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                <input
                  value={g.name}
                  onChange={(e) =>
                    setTableForm((f) => ({
                      ...f,
                      guests: f.guests.map((gg, idx) => (idx === i ? { ...gg, name: e.target.value } : gg)),
                    }))
                  }
                  placeholder="שם"
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '0 10px',
                    fontSize: 14,
                  }}
                />
                <input
                  value={g.phone}
                  onChange={(e) =>
                    setTableForm((f) => ({
                      ...f,
                      guests: f.guests.map((gg, idx) => (idx === i ? { ...gg, phone: e.target.value } : gg)),
                    }))
                  }
                  placeholder="טלפון"
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '0 10px',
                    fontSize: 14,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setTableForm((f) => ({ ...f, guests: f.guests.filter((_, idx) => idx !== i) }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 20 }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={tableForm.guests.length >= maxGuests}
            onClick={() => setTableForm((f) => ({ ...f, guests: [...f.guests, { name: '', phone: '' }] }))}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 10,
              border: `2px dashed ${tableForm.guests.length >= maxGuests ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}`,
              background: 'none',
              color: tableForm.guests.length >= maxGuests ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
              cursor: tableForm.guests.length >= maxGuests ? 'not-allowed' : 'pointer',
              marginBottom: 16,
            }}
          >
            {tableForm.guests.length >= maxGuests
              ? `הגעת למקסימום (${maxGuests} חברים)`
              : '+ הוסף חבר שולחן'}
          </button>
        </div>
      )}

      {tableStep === 7 && (
        <PaymentModal
          orderId={tableForm.order_id}
          amount={calcTablePrice(modalTicket, tableForm).total}
          customerName={tableForm.full_name}
          customerPhone={tableForm.phone}
          customerEmail={tableForm.email}
          onSuccess={() => {
            setTableStep(8)
          }}
          onError={(err) => console.error(err)}
          onClose={() => setTableStep(6)}
        />
      )}
      </div>
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: 'var(--card)',
          padding: '16px 20px',
          borderTop: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}
      >
        {tableStep === 1 && (
          <button
            type="button"
            disabled={!canContinueStep1}
            onClick={() => setTableStep(2)}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 12,
              border: 'none',
              background: canContinueStep1 ? '#00C37A' : 'rgba(255,255,255,0.1)',
              color: canContinueStep1 ? '#000' : 'rgba(255,255,255,0.3)',
              fontWeight: 800,
              fontSize: 16,
              cursor: canContinueStep1 ? 'pointer' : 'not-allowed',
            }}
          >
            המשך
          </button>
        )}
        {tableStep === 2 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => backTo(1)}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              חזור
            </button>
            <button
              type="button"
              onClick={() => setTableStep(3)}
              style={{
                flex: 2,
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#00C37A',
                color: '#000',
                fontWeight: 800,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              המשך
            </button>
          </div>
        )}
        {tableStep === 3 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => backTo(2)}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              חזור
            </button>
            <button
              type="button"
              onClick={() => setTableStep(hasExtras ? 4 : 5)}
              style={{
                flex: 2,
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#00C37A',
                color: '#000',
                fontWeight: 800,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              המשך
            </button>
          </div>
        )}
        {tableStep === 4 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => backTo(3)}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              חזור
            </button>
            <button
              type="button"
              onClick={() => setTableStep(5)}
              style={{
                flex: 2,
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#00C37A',
                color: '#000',
                fontWeight: 800,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              המשך
            </button>
          </div>
        )}
        {tableStep === 5 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => backTo(hasExtras ? 4 : 3)}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              חזור
            </button>
            <button
              type="button"
              disabled={!tableForm.customer_name || !tableForm.customer_phone}
              onClick={() => setTableStep(6)}
              style={{
                flex: 2,
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: tableForm.customer_name && tableForm.customer_phone ? '#00C37A' : 'rgba(255,255,255,0.1)',
                color: tableForm.customer_name && tableForm.customer_phone ? '#000' : 'rgba(255,255,255,0.3)',
                fontWeight: 800,
                fontSize: 16,
                cursor: tableForm.customer_name && tableForm.customer_phone ? 'pointer' : 'not-allowed',
              }}
            >
              המשך
            </button>
          </div>
        )}
        {tableStep === 6 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => backTo(5)}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              חזור
            </button>
            <button
              type="button"
              onClick={() => setTableStep(7)}
              style={{
                flex: 2,
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#00C37A',
                color: '#000',
                fontWeight: 800,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              המשך לתשלום
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
