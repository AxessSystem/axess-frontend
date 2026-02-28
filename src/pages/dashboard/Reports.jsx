import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { Download, Calendar, TrendingUp } from 'lucide-react'
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
    <div className="bg-surface-100 border border-border rounded-xl p-3 text-xs shadow-lg">
      <div className="text-muted mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-subtle">{p.dataKey}:</span>
          <span className="text-white font-semibold">{p.value.toLocaleString('he-IL')}</span>
        </div>
      ))}
    </div>
  )
}

export default function Reports() {
  const [period, setPeriod] = useState('30d')

  const totalSent = MOCK_CAMPAIGNS.reduce((s, c) => s + c.sent, 0)
  const totalDelivered = MOCK_CAMPAIGNS.reduce((s, c) => s + c.delivered, 0)
  const totalClicked = MOCK_CAMPAIGNS.reduce((s, c) => s + c.clicked, 0)
  const totalRedeemed = MOCK_CAMPAIGNS.reduce((s, c) => s + c.redeemed, 0)

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            דוחות
          </h1>
          <p className="text-muted text-sm mt-0.5">ניתוח ביצועי קמפיינים</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                period === p ? 'bg-primary text-white' : 'bg-surface-50 text-subtle border border-border hover:border-border-light'
              }`}
            >
              {p === '7d' ? '7 ימים' : p === '30d' ? '30 ימים' : '90 ימים'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'סה"כ נשלח', value: totalSent.toLocaleString('he-IL'), color: 'text-white' },
          { label: 'Delivery Rate', value: `${Math.round(totalDelivered / totalSent * 100)}%`, color: 'text-accent' },
          { label: 'Click Rate', value: `${Math.round(totalClicked / totalSent * 100)}%`, color: 'text-primary' },
          { label: 'Redemption Rate', value: `${Math.round(totalRedeemed / totalClicked * 100)}%`, color: 'text-yellow-400' },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card text-center"
          >
            <div className={`text-3xl font-black mb-1 ${color}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              {value}
            </div>
            <div className="text-xs text-muted">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="text-base font-bold text-white mb-5">השוואת קמפיינים</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="נשלח" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="נמסר" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="הוקלק" fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="מומש" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">כל הקמפיינים</h2>
          <button className="btn-secondary gap-2 text-xs">
            <Download size={14} />
            ייצוא
          </button>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="table-th">שם קמפיין</th>
                <th className="table-th">תאריך</th>
                <th className="table-th">נשלח</th>
                <th className="table-th">נמסר %</th>
                <th className="table-th">הוקלק %</th>
                <th className="table-th">מומש %</th>
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
                    {c.sent > 0 ? (
                      <span className="text-accent font-medium">
                        {Math.round(c.delivered / c.sent * 100)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="table-td">
                    {c.sent > 0 ? (
                      <span className="text-primary font-medium">
                        {Math.round(c.clicked / c.sent * 100)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="table-td">
                    {c.clicked > 0 ? (
                      <span className="text-yellow-400 font-medium">
                        {Math.round(c.redeemed / c.clicked * 100)}%
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
      </motion.div>
    </div>
  )
}
