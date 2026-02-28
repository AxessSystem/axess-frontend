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
    <div className="bg-surface-100 border border-border rounded-xl p-3 text-xs shadow-lg">
      <div className="text-muted mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-subtle">{p.dataKey === 'sent' ? 'נשלח' : 'נמסר'}:</span>
          <span className="text-white font-semibold">{p.value.toLocaleString('he-IL')}</span>
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
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            סקירה כללית
          </h1>
          <p className="text-muted text-sm mt-0.5">ברוך הבא, קפה רוטשילד 👋</p>
        </div>
        <Link
          to="/dashboard/new-campaign"
          className="btn-primary gap-2 hidden sm:flex"
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
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">שימוש בחבילה — Basic</div>
            <span className="text-xs text-muted">4,820 / 10,000 הודעות</span>
          </div>
          <div className="w-full bg-surface-50 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-primary transition-all duration-1000"
              style={{ width: '48.2%' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted">
            <span>51.8% נותר</span>
            <Link to="/dashboard/settings" className="text-primary hover:underline">שדרג חבילה</Link>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">שליחות — 30 יום אחרונים</h2>
            <p className="text-xs text-muted mt-0.5">נשלח ונמסר לפי יום</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted">נשלח</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted">נמסר</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sent"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#sentGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="#10B981"
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
        className="card"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">קמפיינים אחרונים</h2>
          <Link to="/dashboard/reports" className="text-sm text-primary hover:underline flex items-center gap-1">
            כל הקמפיינים
            <ArrowLeft size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-surface-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-th">שם קמפיין</th>
                  <th className="table-th">תאריך</th>
                  <th className="table-th">נשלח</th>
                  <th className="table-th">נמסר</th>
                  <th className="table-th">הוקלק</th>
                  <th className="table-th">מומש</th>
                  <th className="table-th">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CAMPAIGNS.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-td font-medium text-white px-4 py-3">{c.name}</td>
                    <td className="table-td">{c.date}</td>
                    <td className="table-td">{c.sent > 0 ? c.sent.toLocaleString('he-IL') : '—'}</td>
                    <td className="table-td">
                      {c.delivered > 0 ? (
                        <span className="text-accent">
                          {c.delivered.toLocaleString('he-IL')}
                          <span className="text-muted text-xs mr-1">
                            ({Math.round(c.delivered / c.sent * 100)}%)
                          </span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-td">
                      {c.clicked > 0 ? (
                        <span className="text-primary">
                          {c.clicked.toLocaleString('he-IL')}
                          <span className="text-muted text-xs mr-1">
                            ({Math.round(c.clicked / c.sent * 100)}%)
                          </span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-td">
                      {c.redeemed > 0 ? (
                        <span className="text-yellow-400">
                          {c.redeemed.toLocaleString('he-IL')}
                          <span className="text-muted text-xs mr-1">
                            ({Math.round(c.redeemed / c.clicked * 100)}%)
                          </span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-td">
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
