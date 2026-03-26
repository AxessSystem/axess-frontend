import { useState } from 'react'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Download } from 'lucide-react'
import CampaignStatusBadge from '@/components/ui/CampaignStatusBadge'

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'מבצע ראש חודש מרץ',  date: '01/03/2026', sent: 1240, delivered: 1198, clicked: 342, redeemed: 89,  status: 'sent' },
  { id: 2, name: 'הזמנה לאירוע פסח',    date: '28/02/2026', sent: 850,  delivered: 821,  clicked: 210, redeemed: 67,  status: 'sent' },
  { id: 3, name: 'קמפיין יום הולדת',    date: '25/02/2026', sent: 320,  delivered: 315,  clicked: 98,  redeemed: 45,  status: 'sent' },
  { id: 4, name: 'ניוזלטר שבועי',       date: '18/02/2026', sent: 620,  delivered: 601,  clicked: 145, redeemed: 32,  status: 'sent' },
  { id: 5, name: 'מבצע שישי',           date: '05/03/2026', sent: 0,    delivered: 0,    clicked: 0,   redeemed: 0,   status: 'scheduled' },
]

const chartData = MOCK_CAMPAIGNS.filter(c => c.sent > 0).map(c => ({
  name: c.name.substring(0, 8) + '...',
  נשלח: c.sent,
  נמסר: c.delivered,
  הוקלק: c.clicked,
  מומש: c.redeemed,
}))

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ color: 'var(--v2-gray-400)', marginBottom: 8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill }} />
          <span style={{ color: 'var(--v2-gray-400)' }}>{p.dataKey}:</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{p.value.toLocaleString('he-IL')}</span>
        </div>
      ))}
    </div>
  )
}

const cardStyle = { background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }

export default function Reports() {
  const reportsAllowed = useRequirePermission('can_view_reports')
  const [period, setPeriod] = useState('30d')

  const totalSent      = MOCK_CAMPAIGNS.reduce((s, c) => s + c.sent, 0)
  const totalDelivered = MOCK_CAMPAIGNS.reduce((s, c) => s + c.delivered, 0)
  const totalClicked   = MOCK_CAMPAIGNS.reduce((s, c) => s + c.clicked, 0)
  const totalRedeemed  = MOCK_CAMPAIGNS.reduce((s, c) => s + c.redeemed, 0)

  if (!reportsAllowed) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>דוחות</h1>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>ניתוח ביצועי קמפיינים</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '30d', '90d'].map(p => {
            const isActive = period === p
            return (
              <button key={p} onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500,
                  background: isActive ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                  border: isActive ? 'none' : '1px solid var(--glass-border)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {p === '7d' ? '7 ימים' : p === '30d' ? '30 ימים' : '90 ימים'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {[
          { label: 'סה"כ נשלח',       value: totalSent.toLocaleString('he-IL'),                                   color: '#ffffff' },
          { label: 'Delivery Rate',    value: `${Math.round(totalDelivered / totalSent * 100)}%`,                  color: 'var(--v2-accent)' },
          { label: 'Click Rate',       value: `${Math.round(totalClicked / totalSent * 100)}%`,                    color: 'var(--v2-primary)' },
          { label: 'Redemption Rate',  value: `${Math.round(totalRedeemed / totalClicked * 100)}%`,                color: '#F59E0B' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ ...cardStyle, textAlign: 'center', transition: 'border-color 0.3s, box-shadow 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v2-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 32, color, marginBottom: 4, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={cardStyle}>
        <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: '#ffffff', marginBottom: 20 }}>השוואת קמפיינים</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="נשלח" fill="var(--v2-primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="נמסר" fill="var(--v2-accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="הוקלק" fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="מומש" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: '#ffffff' }}>כל הקמפיינים</h2>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Download size={14} /> ייצוא
          </button>
        </div>

        <div style={{ overflowX: 'auto', margin: '0 -24px' }}>
          <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--v2-dark-2)' }}>
                {['שם קמפיין', 'תאריך', 'נשלח', 'נמסר %', 'הוקלק %', 'מומש %', 'סטטוס'].map(th => (
                  <th key={th} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CAMPAIGNS.map(c => (
                <TableRow key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

function TableRow({ c }) {
  const [hovered, setHovered] = useState(false)
  return (
    <tr
      style={{ borderBottom: '1px solid var(--glass-border)', background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.15s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap' }}>{c.name}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--v2-gray-400)' }}>{c.date}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--v2-gray-400)' }}>{c.sent > 0 ? c.sent.toLocaleString('he-IL') : '—'}</td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        {c.sent > 0 ? <span style={{ color: 'var(--v2-accent)', fontWeight: 600 }}>{Math.round(c.delivered / c.sent * 100)}%</span> : '—'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        {c.sent > 0 ? <span style={{ color: 'var(--v2-primary)', fontWeight: 600 }}>{Math.round(c.clicked / c.sent * 100)}%</span> : '—'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        {c.clicked > 0 ? <span style={{ color: '#F59E0B', fontWeight: 600 }}>{Math.round(c.redeemed / c.clicked * 100)}%</span> : '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <CampaignStatusBadge status={c.status} />
      </td>
    </tr>
  )
}
