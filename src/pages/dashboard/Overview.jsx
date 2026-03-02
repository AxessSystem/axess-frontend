import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'
import {
  MessageSquare, TrendingUp, CheckCircle, Target,
  Plus, ArrowLeft, RefreshCw
} from 'lucide-react'
import KPICard from '@/components/ui/KPICard'
import CampaignStatusBadge from '@/components/ui/CampaignStatusBadge'
import EmptyState from '@/components/ui/EmptyState'

/* ── Mock data ── */
const generateChartData = () => {
  const data = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    data.push({
      date: d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
      sent: Math.floor(Math.random() * 800 + 200),
      delivered: Math.floor(Math.random() * 700 + 150),
    })
  }
  return data
}

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'מבצע ראש חודש מרץ',  date: '01/03/2026', sent: 1240, delivered: 1198, clicked: 342, redeemed: 89,  status: 'sent' },
  { id: 2, name: 'הזמנה לאירוע פסח',    date: '28/02/2026', sent: 850,  delivered: 821,  clicked: 210, redeemed: 67,  status: 'sent' },
  { id: 3, name: 'קמפיין יום הולדת',    date: '25/02/2026', sent: 320,  delivered: 315,  clicked: 98,  redeemed: 45,  status: 'sent' },
  { id: 4, name: 'מבצע שישי',           date: '05/03/2026', sent: 0,    delivered: 0,    clicked: 0,   redeemed: 0,   status: 'scheduled' },
  { id: 5, name: 'ניוזלטר שבועי',       date: '—',          sent: 0,    delivered: 0,    clicked: 0,   redeemed: 0,   status: 'draft' },
]

const chartData = generateChartData()

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ color: 'var(--v2-gray-400)', marginBottom: 8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--v2-gray-400)' }}>{p.dataKey === 'sent' ? 'נשלח' : 'נמסר'}:</span>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>{p.value.toLocaleString('he-IL')}</span>
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  const kpis = [
    {
      title: 'יתרת הודעות',
      value: '4,820',
      subtitle: 'מתוך 10,000 (Basic)',
      icon: MessageSquare,
      color: 'primary',
      trend: 0,
    },
    {
      title: 'קמפיינים החודש',
      value: '7',
      subtitle: '+2 מהחודש שעבר',
      icon: TrendingUp,
      color: 'success',
      trend: 28,
    },
    {
      title: 'ממוצע Delivery Rate',
      value: '96.8%',
      subtitle: 'מעל הממוצע בתעשייה',
      icon: CheckCircle,
      color: 'success',
      trend: 2,
    },
    {
      title: 'ממוצע Redemption',
      value: '34.2%',
      subtitle: 'מהלחיצות',
      icon: Target,
      color: 'warning',
      trend: -1,
    },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff', letterSpacing: '-0.02em' }}>
            סקירה כללית
          </h1>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 2 }}>ברוך הבא, קפה רוטשילד 👋</p>
        </div>
        <Link
          to="/dashboard/new-campaign"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--v2-primary)',
            color: 'var(--v2-dark)',
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          className="hidden sm:inline-flex"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <Plus size={16} />
          קמפיין חדש
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <KPICard {...kpi} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Balance progress */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>שימוש בחבילה — Basic</div>
            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>4,820 / 10,000 הודעות</span>
          </div>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 9999, height: 8 }}>
            <div style={{ height: '100%', borderRadius: 9999, background: 'var(--v2-primary)', width: '48.2%', transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>
            <span>51.8% נותר</span>
            <Link to="/dashboard/settings" style={{ color: 'var(--v2-primary)', textDecoration: 'none', fontWeight: 600 }}>שדרג חבילה</Link>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 700, fontSize: 16, color: '#ffffff' }}>שליחות — 30 יום אחרונים</h2>
            <p style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>נשלח ונמסר לפי יום</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--v2-primary)' }} />
              <span style={{ color: 'var(--v2-gray-400)' }}>נשלח</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--v2-accent)' }} />
              <span style={{ color: 'var(--v2-gray-400)' }}>נמסר</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C37A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00C37A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sent"
              stroke="#00C37A"
              strokeWidth={2}
              fill="url(#sentGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#deliveredGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Campaigns Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 700, fontSize: 16, color: '#ffffff' }}>קמפיינים אחרונים</h2>
          <Link to="/dashboard/reports" style={{ fontSize: 13, color: 'var(--v2-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            כל הקמפיינים
            <ArrowLeft size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 44, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 -20px' }}>
            <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--v2-dark-2)' }}>
                  {['שם קמפיין', 'תאריך', 'נשלח', 'נמסר', 'הוקלק', 'מומש', 'סטטוס'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--v2-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_CAMPAIGNS.map(c => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{c.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--v2-gray-400)' }}>{c.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--v2-gray-400)' }}>{c.sent > 0 ? c.sent.toLocaleString('he-IL') : '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      {c.delivered > 0 ? (
                        <span style={{ color: 'var(--v2-accent)' }}>
                          {c.delivered.toLocaleString('he-IL')}
                          <span style={{ color: 'var(--v2-gray-400)', fontSize: 11, marginRight: 4 }}>
                            ({Math.round(c.delivered / c.sent * 100)}%)
                          </span>
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      {c.clicked > 0 ? (
                        <span style={{ color: 'var(--v2-primary)' }}>
                          {c.clicked.toLocaleString('he-IL')}
                          <span style={{ color: 'var(--v2-gray-400)', fontSize: 11, marginRight: 4 }}>
                            ({Math.round(c.clicked / c.sent * 100)}%)
                          </span>
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      {c.redeemed > 0 ? (
                        <span style={{ color: '#F59E0B' }}>
                          {c.redeemed.toLocaleString('he-IL')}
                          <span style={{ color: 'var(--v2-gray-400)', fontSize: 11, marginRight: 4 }}>
                            ({Math.round(c.redeemed / c.clicked * 100)}%)
                          </span>
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <CampaignStatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
