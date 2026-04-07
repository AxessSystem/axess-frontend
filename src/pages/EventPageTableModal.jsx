import { useState } from 'react'
import { Wine, ShoppingBag, CreditCard, Check, Users, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

function normIncludedExtras(x) {
  if (Array.isArray(x)) return x
  if (typeof x === 'string') {
    try {
      const p = JSON.parse(x)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}

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
  const freeRule = modalTicket?.metadata?.free_rule || {}
  const freePeopleRule = freeRule.people ?? 3
  const priceThresholdRule = freeRule.price_threshold ?? 1000

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

  const flatExtras = () =>
    Object.values(tableForm.extras_by_drink || {}).reduce((acc, arr) => acc.concat(arr || []), [])

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
    <>
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
            top: 16,
            left: 16,
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
      <div style={{ marginBottom: 20 }}>
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

          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,195,122,0.3) transparent',
            }}
          >
            {Object.entries(
              (event.table_menu || [])
                .filter((m) => m.category !== 'תוספות')
                .filter(
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
                  const incl = normIncludedExtras(item.included_extras)
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
                          {incl.length > 0 && (
                            <span style={{ color: 'rgba(0,195,122,0.6)', marginRight: 6 }}>
                              · {incl.length} תוספות כלולות
                            </span>
                          )}
                        </p>
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
                                included_extras: normIncludedExtras(item.included_extras),
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

          <button
            type="button"
            disabled={!canContinueStep1}
            onClick={() => setTableStep(2)}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 12,
              border: 'none',
              marginTop: 20,
              background: canContinueStep1 ? '#00C37A' : 'rgba(255,255,255,0.1)',
              color: canContinueStep1 ? '#000' : 'rgba(255,255,255,0.3)',
              fontWeight: 800,
              fontSize: 16,
              cursor: canContinueStep1 ? 'pointer' : 'not-allowed',
            }}
          >
            המשך
          </button>
        </div>
      )}

      {tableStep === 2 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={18} color="#00C37A" /> סיכום משקאות
          </h4>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            {`${freePeopleRule} אנשים חינם לכל בקבוק מעל ₪${priceThresholdRule}`}
          </p>
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
              onClick={() => setTableStep(4)}
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
        </div>
      )}

      {tableStep === 4 && (
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={18} color="#00C37A" /> תוספות לשולחן
          </h4>

          {Object.values(tableForm.selected_drinks || {}).map((drink) =>
            normIncludedExtras(drink.included_extras).length > 0 ? (
              <div key={drink.id} style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0 0 8px',
                  }}
                >
                  {drink.name} ×{drink.quantity} — בחר {drink.quantity} תוספות:
                </p>
                {normIncludedExtras(drink.included_extras).map((extra) => {
                  const current = [...(tableForm.extras_by_drink?.[drink.id] || [])]
                  const selectedCount = current.filter((e) => e === extra).length
                  const maxForDrink = drink.quantity
                  const totalSelected = current.length

                  return (
                    <div
                      key={`${drink.id}_${extra}`}
                      onClick={() => {
                        if (selectedCount === 0 && totalSelected >= maxForDrink) return
                        setTableForm((f) => {
                          const cur = [...(f.extras_by_drink?.[drink.id] || [])]
                          const idx = cur.indexOf(extra)
                          if (idx >= 0) cur.splice(idx, 1)
                          else cur.push(extra)
                          return { ...f, extras_by_drink: { ...(f.extras_by_drink || {}), [drink.id]: cur } }
                        })
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 10,
                        marginBottom: 6,
                        cursor: 'pointer',
                        border: `1px solid ${selectedCount > 0 ? '#00C37A' : 'rgba(255,255,255,0.1)'}`,
                        background: selectedCount > 0 ? 'rgba(0,195,122,0.1)' : 'rgba(255,255,255,0.04)',
                        opacity: selectedCount === 0 && totalSelected >= maxForDrink ? 0.4 : 1,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{extra}</span>
                      <span style={{ fontSize: 18 }}>{selectedCount > 0 ? '✅' : '⬜'}</span>
                    </div>
                  )
                })}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                  {(tableForm.extras_by_drink?.[drink.id] || []).length}/{drink.quantity} תוספות נבחרו
                </p>
              </div>
            ) : null,
          )}

          {Object.values(tableForm.selected_drinks || {}).every(
            (d) => normIncludedExtras(d.included_extras).length === 0,
          ) && (
            <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.4)' }}>
              <p>אין תוספות לבקבוקים שנבחרו</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => backTo(4)}
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
        </div>
      )}

      {tableStep === 7 && (
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} color="#00C37A" /> סיכום ותשלום
          </h4>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            {Object.values(tableForm.selected_drinks || {}).map((d) => (
              <div
                key={d.id}
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}
              >
                <span>
                  🍾 {d.name} ×{d.quantity}
                </span>
                <span>₪{(parseFloat(d.price) * d.quantity).toLocaleString()}</span>
              </div>
            ))}
            {extraPeople > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#F59E0B' }}>
                <span>🎫 כרטיס נוסף ×{extraPeople}</span>
                <span>₪{extraTicketsCost.toLocaleString()}</span>
              </div>
            )}
            {flatExtras().length > 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                🥤 תוספות: {flatExtras().join(', ')}
              </div>
            )}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 800,
                fontSize: 17,
              }}
            >
              <span>סה&quot;כ</span>
              <span style={{ color: '#00C37A' }}>₪{total.toLocaleString()}</span>
            </div>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>איך לשלם?</p>
          {[
            { value: 'full', label: 'אני משלם על הכולם', sub: `₪${total.toLocaleString()}` },
            {
              value: 'split_equal',
              label: 'נתחלק שווה',
              sub:
                tableForm.guests.length > 0
                  ? `₪${Math.ceil(total / (tableForm.guests.length + 1)).toLocaleString()} לאדם`
                  : 'הוסף חברים בשלב הקודם',
            },
            { value: 'split_custom', label: 'חלוקה מותאמת', sub: 'כל אחד קובע את חלקו' },
          ].map((opt) => (
            <div
              key={opt.value}
              onClick={() => setTableForm((f) => ({ ...f, payment_mode: opt.value }))}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                marginBottom: 8,
                cursor: 'pointer',
                border: `2px solid ${tableForm.payment_mode === opt.value ? '#00C37A' : 'rgba(255,255,255,0.1)'}`,
                background: tableForm.payment_mode === opt.value ? 'rgba(0,195,122,0.1)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{opt.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{opt.sub}</p>
            </div>
          ))}
          {tableForm.payment_mode === 'full' && (
            <div style={{ background: 'rgba(0,195,122,0.08)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#00C37A' }}>
                ✅ אתה משלם ₪{total.toLocaleString()} עבור כל השולחן
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                כל חבר יקבל QR אישי בWA לאחר התשלום
              </p>
            </div>
          )}
          {tableForm.payment_mode === 'split_equal' && (
            <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>חלוקה שווה:</p>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                אתה משלם: ₪{Math.ceil(total / (tableForm.guests.length + 1)).toLocaleString()}
              </p>
              {tableForm.guests.length > 0 ? (
                <>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    {tableForm.guests.length} חברים יקבלו לינק תשלום בWA:
                  </p>
                  {tableForm.guests.map((g, i) => (
                    <p key={i} style={{ margin: '2px 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      • {g.name || `חבר ${i + 1}`} — ₪
                      {Math.ceil(total / (tableForm.guests.length + 1)).toLocaleString()}
                    </p>
                  ))}
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: '#F59E0B' }}>
                  ⚠️ הוסף חברי שולחן בשלב הקודם לחלוקת תשלום
                </p>
              )}
            </div>
          )}
          {tableForm.payment_mode === 'split_custom' && (
            <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>הגדר כמה כל אחד משלם:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ flex: 1, fontSize: 13 }}>
                  אני ({tableForm.customer_name || 'ראש קבוצה'})
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13 }}>₪</span>
                  <input
                    value={tableForm.custom_split_amounts?.['main'] || ''}
                    onChange={(e) =>
                      setTableForm((f) => ({
                        ...f,
                        custom_split_amounts: { ...(f.custom_split_amounts || {}), main: e.target.value },
                      }))
                    }
                    type="number"
                    placeholder="0"
                    style={{
                      width: 80,
                      height: 34,
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      padding: '0 8px',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>
              {tableForm.guests.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{g.name || `חבר ${i + 1}`}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13 }}>₪</span>
                    <input
                      value={tableForm.custom_split_amounts?.[i] || ''}
                      onChange={(e) =>
                        setTableForm((f) => ({
                          ...f,
                          custom_split_amounts: { ...(f.custom_split_amounts || {}), [i]: e.target.value },
                        }))
                      }
                      type="number"
                      placeholder="0"
                      style={{
                        width: 80,
                        height: 34,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0 8px',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              ))}
              {(() => {
                const amounts = Object.values(tableForm.custom_split_amounts || {})
                const splitTotal = amounts.reduce((s, a) => s + parseFloat(a || 0), 0)
                const remaining = total - splitTotal
                return (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: remaining === 0 ? '#00C37A' : '#F59E0B' }}>
                      {remaining === 0
                        ? '✅ סכום מאוזן'
                        : `נותר לחלק: ₪${remaining.toLocaleString()}`}
                    </p>
                  </div>
                )
              })()}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => backTo(6)}
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
              disabled={paying}
              onClick={() => submitTableReserve()}
              style={{
                flex: 2,
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#00C37A',
                color: '#000',
                fontWeight: 800,
                fontSize: 16,
                cursor: paying ? 'wait' : 'pointer',
              }}
            >
              {paying ? 'מעבד...' : total === 0 ? 'שלח הזמנה' : `שלם ₪${total.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
