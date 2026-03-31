import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Download, X } from 'lucide-react'
import { exportEventReport } from '@/utils/exportExcel'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

function calcExpenseVat(exp) {
  const total = parseFloat(exp.amount || 0) * parseInt(exp.quantity || 1, 10)
  if (exp.vat_mode === 'included') {
    const vat = Math.round((total / 1.18) * 0.18)
    return { total, vat, beforeVat: total - vat }
  }
  if (exp.vat_mode === 'excluded') {
    const vat = Math.round(total * 0.18)
    return { total: total + vat, vat, beforeVat: total }
  }
  return { total, vat: 0, beforeVat: total }
}

function calcVatIncluded(amount) {
  if (amount == null || Number.isNaN(amount)) return 0
  return amount / 1.18 * 0.18
}

export default function SharedEventReport() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [revForm, setRevForm] = useState({ source: 'other', label: '', amount: '' })
  const [expForm, setExpForm] = useState({
    category: 'other', item_name: '', amount: '', quantity: '1', payment_status: 'pending',
  })

  const loadReport = useCallback(() => {
    setError(null)
    setLoading(true)
    fetch(`${API_BASE}/shared/event/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError('שגיאה בטעינה'); setLoading(false) })
  }, [token])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const refetchData = useCallback(() => {
    fetch(`${API_BASE}/shared/event/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
      })
      .catch(() => {})
  }, [token])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1628', color: '#fff' }}>
      טוען...
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1628', color: '#fff', gap: 12 }}>
      <p style={{ fontSize: 20, fontWeight: 700 }}>❌ {error}</p>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>הלינק אינו תקין או שפג תוקפו</p>
    </div>
  )

  const { share, event, financials } = data
  const canEditRevenues = ['edit_all', 'edit_revenues'].includes(share.permission)
  const canEditExpenses = ['edit_all', 'edit_expenses'].includes(share.permission)

  const permissionLabel = {
    view: '👁 צפייה בלבד',
    edit_all: '✏️ עריכה מלאה',
    edit_revenues: '💰 עריכת הכנסות',
    edit_expenses: '📋 עריכת הוצאות',
    edit_tables: '📋 שולחנות',
    edit_checkin: '✅ צ\'ק אין',
  }[share.permission] || '👁 צפייה'

  const totalRevenue = parseFloat(financials.axess_revenue?.total_digital || 0)
    + financials.revenues.reduce((s, r) => s + parseFloat(r.amount || 0), 0)
  const totalExpenses = financials.expenses.reduce((s, e) => s + parseFloat(e.amount || 0) * parseInt(e.quantity || 1, 10), 0)
  const netProfit = totalRevenue - totalExpenses

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', color: '#fff', padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>
          דוח שותף — {share.name}
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{event.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          {event.date ? new Date(event.date).toLocaleDateString('he-IL') : ''} · {event.location}
        </p>
        <span style={{
          fontSize: 11,
          background: share.permission === 'view' ? 'rgba(59,130,246,0.2)' : 'rgba(0,195,122,0.15)',
          color: share.permission === 'view' ? '#3B82F6' : '#00C37A',
          padding: '2px 10px',
          borderRadius: 20,
          display: 'inline-block',
          marginTop: 8,
        }}
        >
          {permissionLabel}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'סה"כ הכנסות', value: `₪${Math.round(totalRevenue).toLocaleString()}`, color: '#00C37A' },
          { label: 'סה"כ הוצאות', value: `₪${Math.round(totalExpenses).toLocaleString()}`, color: '#EF4444' },
          { label: netProfit >= 0 ? 'רווח נקי' : 'הפסד', value: `₪${Math.abs(Math.round(netProfit)).toLocaleString()}`, color: netProfit >= 0 ? '#00C37A' : '#EF4444' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* הכנסות */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>הכנסות</h3>
          {canEditRevenues && (
            <button
              type="button"
              onClick={() => setShowAddRevenue(true)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: '#00C37A', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              + הוסף הכנסה
            </button>
          )}
        </div>
        {[
          { label: 'AXESS — מכירות דיגיטל', amount: financials.axess_revenue?.total_digital || 0 },
          ...financials.revenues.map((r) => ({ label: r.label || r.source, amount: r.amount })),
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
            <span>{item.label}</span>
            <span style={{ fontWeight: 600 }}>₪{parseFloat(item.amount || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* הוצאות */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>הוצאות</h3>
          {canEditExpenses && (
            <button
              type="button"
              onClick={() => setShowAddExpense(true)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 13, cursor: 'pointer',
              }}
            >
              + הוסף הוצאה
            </button>
          )}
        </div>
        {financials.expenses.map((exp, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{exp.vendor_name || exp.item_name}</span>
            <span>₪{(parseFloat(exp.amount || 0) * parseInt(exp.quantity || 1, 10)).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* כפתור ייצוא */}
      <button
        type="button"
        onClick={() => exportEventReport(event, data.orders || [], financials, { food_cost_pct: 20, vat_mode: 'included' }, calcExpenseVat, calcVatIncluded)}
        style={{
          width: '100%', height: 48, borderRadius: 10, border: 'none',
          background: '#00C37A', color: '#000', fontWeight: 700,
          fontSize: 15, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Download size={18} />
        {' '}
        הורד דוח Excel
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
        AXESS · דוח זה שותף ב-
        {new Date().toLocaleDateString('he-IL')}
      </p>

      {showAddRevenue && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
        >
          <div style={{ background: '#152238', borderRadius: 12, padding: 20, width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.12)', position: 'relative' }}>
            <button type="button" onClick={() => setShowAddRevenue(false)} style={{ position: 'absolute', top: 10, left: 10, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h4 style={{ margin: '0 0 16px', fontSize: 15 }}>הוסף הכנסה</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={revForm.source}
                onChange={(e) => setRevForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="מקור (למשל other, bar)"
                style={{ height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '0 12px' }}
              />
              <input
                value={revForm.label}
                onChange={(e) => setRevForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="תיאור"
                style={{ height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '0 12px' }}
              />
              <input
                value={revForm.amount}
                onChange={(e) => setRevForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="סכום"
                type="number"
                style={{ height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '0 12px' }}
              />
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`${API_BASE}/shared/event/${token}/revenues`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      source: revForm.source,
                      label: revForm.label || null,
                      amount: revForm.amount,
                    }),
                  })
                  if (!res.ok) return
                  setShowAddRevenue(false)
                  setRevForm({ source: 'other', label: '', amount: '' })
                  refetchData()
                }}
                style={{
                  height: 44, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer', marginTop: 8,
                }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddExpense && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
        >
          <div style={{ background: '#152238', borderRadius: 12, padding: 20, width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.12)', position: 'relative' }}>
            <button type="button" onClick={() => setShowAddExpense(false)} style={{ position: 'absolute', top: 10, left: 10, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h4 style={{ margin: '0 0 16px', fontSize: 15 }}>הוסף הוצאה</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={expForm.category}
                onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="קטגוריה"
                style={{ height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '0 12px' }}
              />
              <input
                value={expForm.item_name}
                onChange={(e) => setExpForm((f) => ({ ...f, item_name: e.target.value }))}
                placeholder="פריט / ספק"
                style={{ height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '0 12px' }}
              />
              <input
                value={expForm.amount}
                onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="סכום"
                type="number"
                style={{ height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '0 12px' }}
              />
              <input
                value={expForm.quantity}
                onChange={(e) => setExpForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="כמות"
                type="number"
                style={{ height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '0 12px' }}
              />
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`${API_BASE}/shared/event/${token}/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      category: expForm.category,
                      item_name: expForm.item_name,
                      amount: expForm.amount,
                      quantity: expForm.quantity,
                      payment_status: expForm.payment_status,
                    }),
                  })
                  if (!res.ok) return
                  setShowAddExpense(false)
                  setExpForm({
                    category: 'other', item_name: '', amount: '', quantity: '1', payment_status: 'pending',
                  })
                  refetchData()
                }}
                style={{
                  height: 44, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer', marginTop: 8,
                }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
