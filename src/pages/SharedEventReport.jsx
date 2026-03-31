import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
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

  useEffect(() => {
    fetch(`${API_BASE}/shared/event/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError('שגיאה בטעינה'); setLoading(false) })
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
        {share.permission === 'view' && (
          <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.2)', color: '#3B82F6', padding: '2px 10px', borderRadius: 20 }}>
            👁 צפייה בלבד
          </span>
        )}
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
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>הכנסות</h3>
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
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>הוצאות</h3>
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
    </div>
  )
}
