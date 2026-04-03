import { Wine, ShoppingBag, CreditCard, ChevronLeft, Check, Users } from 'lucide-react'
import toast from 'react-hot-toast'

/* Smart table booking sheet (used from EventPage) */
export function TableBookingModalContent({
  modalTicket,
  event,
  tableStep,
  setTableStep,
  tableForm,
  setTableForm,
  selectedCategory,
  setSelectedCategory,
  categories,
  totalFreePeople,
  maxExtras,
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
}) {
  const genTt =
    event.ticket_types?.find((t) => String(t.ticket_category || '') === 'general')
    || event.ticket_types?.find((t) => String(t.ticket_category || '') !== 'table')

  const pickDrinkItem = (item) => {
    const freePpl = item.price > 1000 ? 3 : 2
    setTableForm((f) => ({
      ...f,
      drink_item_id: item.id,
      drink_name: item.name,
      drink_price: parseFloat(item.price),
      free_rule: {
        ...f.free_rule,
        people: freePpl,
        per_liter: item.free_extras ?? 1,
        price_threshold: 1000,
      },
      extra_ticket_price: Number(genTt?.price || 0),
    }))
  }

  const drinkCard = (item) => (
    <div
      key={item.id}
      onClick={() => pickDrinkItem(item)}
      style={{
        padding: 14,
        borderRadius: 12,
        cursor: 'pointer',
        border: `2px solid ${tableForm.drink_item_id === item.id ? '#00C37A' : 'rgba(255,255,255,0.1)'}`,
        background: tableForm.drink_item_id === item.id ? 'rgba(0,195,122,0.1)' : 'rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{item.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          {item.price > 1000 ? '3 אנשים חינם' : '2 אנשים חינם'} + {item.free_extras ?? 1} תוספת לבקבוק
        </p>
      </div>
      <span style={{ fontWeight: 800, fontSize: 18, color: '#00C37A' }}>₪{item.price}</span>
    </div>
  )

  const canContinueStep1 =
    !!tableForm.drink_item_id && (categories.length === 0 || !!selectedCategory)

  const submitTableReserve = async () => {
    setPaying(true)
    try {
      const payload = {
        ticket_type_id: modalTicket.id,
        quantity: 1,
        buyer_name: tableForm.customer_name.trim(),
        buyer_phone: tableForm.customer_phone.trim(),
        buyer_email: tableForm.customer_email.trim() || undefined,
        total_amount: total,
        table_data: { ...tableForm, guest_count: tableForm.guest_count },
        custom_fields: {
          instagram: tableForm.customer_instagram || undefined,
          drink: tableForm.drink_name,
          drink_quantity: tableForm.drink_quantity,
          extras: tableForm.extras,
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
        setModalTicket(null)
        setTableStep(1)
        setSelectedCategory(null)
        toast.success('הבקשה נשלחה לאישור')
        return
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
        setModalTicket(null)
        setTableStep(1)
        setSelectedCategory(null)
        toast.success('הכרטיס בדרך!')
      } else if (data.client_secret) {
        setSuccess(true)
        setModalTicket(null)
        setTableStep(1)
        setSelectedCategory(null)
        toast.success('המשך לתשלום — הכרטיס בדרך!')
      }
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'שגיאה')
    } finally {
      setPaying(false)
    }
  }

  return (
    <>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
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
          <h4 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wine size={18} color="#00C37A" /> בחר משקה
          </h4>
          {categories.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(event.table_menu || [])
                .filter((m) => m.category !== 'תוספות')
                .map((item) => drinkCard(item))}
            </div>
          ) : !selectedCategory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '16px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{cat}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    {(event.table_menu || []).filter((m) => m.category === cat).length} מוצרים ›
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00C37A',
                  cursor: 'pointer',
                  fontSize: 14,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ChevronLeft size={16} /> חזור לקטגוריות
              </button>
              <h5 style={{ margin: '0 0 12px', fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>{selectedCategory}</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(event.table_menu || [])
                  .filter((m) => m.category === selectedCategory)
                  .map((item) => drinkCard(item))}
              </div>
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
            <ShoppingBag size={18} color="#00C37A" /> כמות בקבוקים
          </h4>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {tableForm.drink_name} — ₪{tableForm.drink_price} לבקבוק
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setTableForm((f) => ({ ...f, drink_quantity: Math.max(1, f.drink_quantity - 1) }))}
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
            <span style={{ fontSize: 36, fontWeight: 900 }}>{tableForm.drink_quantity}</span>
            <button
              type="button"
              onClick={() => setTableForm((f) => ({ ...f, drink_quantity: f.drink_quantity + 1 }))}
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
          <div style={{ background: 'rgba(0,195,122,0.08)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#00C37A', fontWeight: 600 }}>
              {tableForm.drink_quantity} בקבוקים = {totalFreePeople} אנשים חינם + {maxExtras} תוספות
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              סה&quot;כ שתייה: ₪{(tableForm.drink_price * tableForm.drink_quantity).toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setTableStep(1)}
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
                כרטיס נוסף: ₪{tableForm.extra_ticket_price} × {extraPeople} = ₪{extraTicketsCost.toLocaleString()}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setTableStep(2)}
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
          <h4 style={{ margin: '0 0 8px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={18} color="#00C37A" /> בחר תוספות
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            בחר עד {maxExtras} תוספות ({tableForm.extras.length}/{maxExtras} נבחרו)
          </p>
          <div
            style={{
              background: '#0f1624',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              overflowY: 'auto',
              maxHeight: 280,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,195,122,0.3) transparent',
              padding: 8,
            }}
          >
            {(event.table_menu || [])
              .filter((m) => m.category === 'תוספות')
              .map((item) => {
                const isSelected = tableForm.extras.includes(item.name)
                const canAdd = !isSelected && tableForm.extras.length < maxExtras
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isSelected && !canAdd) return
                      setTableForm((f) => ({
                        ...f,
                        extras: isSelected ? f.extras.filter((e) => e !== item.name) : [...f.extras, item.name],
                      }))
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 10,
                      marginBottom: 8,
                      cursor: canAdd || isSelected ? 'pointer' : 'not-allowed',
                      border: `1px solid ${isSelected ? '#00C37A' : 'rgba(255,255,255,0.1)'}`,
                      background: isSelected ? 'rgba(0,195,122,0.1)' : 'rgba(255,255,255,0.05)',
                      opacity: !isSelected && !canAdd ? 0.4 : 1,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{item.name}</span>
                    <span style={{ fontSize: 18 }}>{isSelected ? '✅' : '⬜'}</span>
                  </div>
                )
              })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setTableStep(3)}
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
              onClick={() => setTableStep(4)}
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
            onClick={() => setTableForm((f) => ({ ...f, guests: [...f.guests, { name: '', phone: '' }] }))}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 10,
              border: '2px dashed rgba(255,255,255,0.2)',
              background: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            + הוסף חבר שולחן
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setTableStep(5)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span>
                🍾 {tableForm.drink_name} ×{tableForm.drink_quantity}
              </span>
              <span>₪{(tableForm.drink_price * tableForm.drink_quantity).toLocaleString()}</span>
            </div>
            {extraPeople > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#F59E0B' }}>
                <span>🎫 כרטיס נוסף ×{extraPeople}</span>
                <span>₪{extraTicketsCost.toLocaleString()}</span>
              </div>
            )}
            {tableForm.extras.length > 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                🥤 תוספות: {tableForm.extras.join(', ')}
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setTableStep(6)}
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
