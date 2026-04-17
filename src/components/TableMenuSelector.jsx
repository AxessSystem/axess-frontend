import { Wine, Search, Check } from 'lucide-react'

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

export const flatExtras = (extrasByDrink = {}) =>
  Object.entries(extrasByDrink || {}).flatMap(([, extras]) => {
    const counts = getExtrasCounts(extras)
    return Object.entries(counts).flatMap(([name, qty]) =>
      Array(Math.max(0, Number(qty) || 0)).fill(name),
    )
  })

export default function TableMenuSelector({
  tableStep,
  isSmartTable,
  menuItems,
  extrasOptions,
  tableForm,
  setTableForm,
  drinkSearch,
  setDrinkSearch,
  totalBottles,
  drinksTotal,
  totalFreePeople,
  maxExtras,
}) {
  if (tableStep === 1) {
    return (
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
    )
  }

  if (tableStep === 4) {
    return (
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
    )
  }

  return null
}
