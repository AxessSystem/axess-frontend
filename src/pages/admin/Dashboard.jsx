import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Users, UserCheck, Calendar, TrendingUp, ArrowUp, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function KPICard({ icon: Icon, label, value, sub, color = 'wa', loading }) {
  const colorMap = {
    wa: { bg: 'bg-wa/10', text: 'text-wa', border: 'border-wa/20' },
    accent: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  }
  const c = colorMap[color]

  return (
    <div className={`kpi-card border ${c.border}`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.text} />
        </div>
        {!loading && (
          <span className="badge-green text-xs">
            <ArrowUp size={10} /> פעיל
          </span>
        )}
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-20 bg-surface-50 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-black text-white">{value ?? '—'}</p>
        )}
        <p className="text-sm text-muted mt-0.5">{label}</p>
        {sub && <p className="text-xs text-subtle mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['admin-kpi'],
    queryFn: async () => {
      const [producers, users, events, commissions] = await Promise.all([
        supabase.from('producers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('transactions').select('axess_commission').eq('is_axess_lead', true),
      ])
      const totalCommission = commissions.data?.reduce((sum, t) => sum + (t.axess_commission || 0), 0) || 0
      return {
        producers: producers.count,
        users: users.count,
        events: events.count,
        commission: totalCommission,
      }
    },
  })

  const { data: recentEvents } = useQuery({
    queryKey: ['admin-recent-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name, event_date, venue, producers(name)')
        .order('event_date', { ascending: false })
        .limit(5)
      return data || []
    },
  })

  const kpiCards = [
    { icon: UserCheck, label: 'מפיקים פעילים', value: kpi?.producers, color: 'wa' },
    { icon: Users, label: 'קהל רשום', value: kpi?.users?.toLocaleString(), color: 'accent' },
    { icon: Calendar, label: 'אירועים פעילים', value: kpi?.events, color: 'yellow' },
    {
      icon: TrendingUp,
      label: 'עמלות Axess',
      value: kpi?.commission ? `₪${kpi.commission.toFixed(0)}` : '₪0',
      color: 'blue',
    },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">דשבורד אדמין</h1>
          <p className="text-muted text-sm mt-0.5">סקירה כללית של המערכת</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <KPICard key={card.label} {...card} loading={isLoading} />
        ))}
      </div>

      {/* Recent Events */}
      <div className="card">
        <h2 className="section-title mb-4">אירועים אחרונים</h2>
        {recentEvents?.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">אין אירועים עדיין</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-th">שם אירוע</th>
                  <th className="table-th">מפיק</th>
                  <th className="table-th">מקום</th>
                  <th className="table-th">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents?.map((ev) => (
                  <tr key={ev.id} className="table-row">
                    <td className="table-td font-medium text-white">{ev.name}</td>
                    <td className="table-td">{ev.producers?.name || '—'}</td>
                    <td className="table-td">{ev.venue || '—'}</td>
                    <td className="table-td">
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString('he-IL') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
