import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Users, UserCheck, Calendar, TrendingUp,
  CreditCard, LogIn, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { useQueryClient } from '@tanstack/react-query'

// ─── KPI Card ──────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, trend, color = 'wa', loading }) {
  const colorMap = {
    wa:     { bg: 'bg-wa/10',           text: 'text-wa',          border: 'border-wa/20' },
    accent: { bg: 'bg-accent/10',       text: 'text-accent',      border: 'border-accent/20' },
    yellow: { bg: 'bg-yellow-500/10',   text: 'text-yellow-400',  border: 'border-yellow-500/20' },
    blue:   { bg: 'bg-blue-500/10',     text: 'text-blue-400',    border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10',   text: 'text-purple-400',  border: 'border-purple-500/20' },
    pink:   { bg: 'bg-pink-500/10',     text: 'text-pink-400',    border: 'border-pink-500/20' },
  }
  const c = colorMap[color] ?? colorMap.wa

  return (
    <div className={`kpi-card border ${c.border} relative overflow-hidden`}>
      {/* subtle gradient bg */}
      <div className={`absolute inset-0 ${c.bg} opacity-30 pointer-events-none`} />

      <div className="relative flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={c.text} />
        </div>
        {!loading && trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-wa' : 'text-red-400'}`}>
            {trend >= 0
              ? <ArrowUpRight size={13} />
              : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="relative mt-4">
        {loading ? (
          <>
            <div className="h-9 w-24 bg-surface-50 rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-surface-50/60 rounded animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-3xl font-black text-white tabular-nums">{value ?? '—'}</p>
            <p className="text-sm text-muted mt-0.5">{label}</p>
            {sub && <p className="text-xs text-subtle mt-1">{sub}</p>}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Custom Tooltip ─────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-100 border border-border rounded-xl px-3 py-2.5 text-xs shadow-card min-w-[140px]">
      <p className="text-subtle font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{p.name}</span>
          </span>
          <span className="font-semibold text-white">
            {p.dataKey === 'revenue' || p.dataKey === 'commission'
              ? `₪${Number(p.value).toLocaleString('he-IL')}`
              : Number(p.value).toLocaleString('he-IL')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────
export default function AdminDashboard() {
  const qc = useQueryClient()

  // All KPIs in one RPC call
  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ['admin-kpi'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_kpi')
      if (error) {
        // Fallback: parallel queries if RPC not yet created
        const [producers, users, events, commissions, txCount, checkins] = await Promise.all([
          supabase.from('producers').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('transactions')
            .select('axess_commission')
            .eq('is_axess_lead', true)
            .in('goout_status', ['Paid', 'Approved']),
          supabase.from('transactions').select('*', { count: 'exact', head: true }).in('goout_status', ['Paid', 'Approved']),
          supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('status', 'checked_in'),
        ])
        const totalCommission = (commissions.data || []).reduce((s, t) => s + Number(t.axess_commission || 0), 0)
        return {
          producers: producers.count ?? 0,
          users: users.count ?? 0,
          events: events.count ?? 0,
          commission: totalCommission,
          transactions: txCount.count ?? 0,
          checkins_today: checkins.count ?? 0,
        }
      }
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  // Monthly chart data via RPC
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['admin-monthly-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_stats')
      if (error || !data?.length) {
        // Fallback: fetch raw and group client-side
        const { data: raw } = await supabase
          .from('transactions')
          .select('purchase_date, total_income, axess_commission')
          .in('goout_status', ['Paid', 'Approved'])
          .not('purchase_date', 'is', null)
          .gte('purchase_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
          .order('purchase_date', { ascending: true })

        if (!raw?.length) return []

        const byMonth = {}
        for (const t of raw) {
          const d = new Date(t.purchase_date)
          const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
          if (!byMonth[key]) byMonth[key] = { month: key, orders: 0, revenue: 0, commission: 0 }
          byMonth[key].orders += 1
          byMonth[key].revenue += Number(t.total_income || 0)
          byMonth[key].commission += Number(t.axess_commission || 0)
        }
        return Object.values(byMonth)
      }
      return data.map(r => ({
        month: r.month,
        orders: Number(r.orders),
        revenue: Number(r.revenue),
        commission: Number(r.commission),
      }))
    },
    staleTime: 1000 * 60 * 10,
  })

  // Top producers by events
  const { data: topProducers } = useQuery({
    queryKey: ['admin-top-producers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('producers')
        .select('id, name, business_name, events(id)')
        .eq('is_active', true)
        .limit(5)
      return (data || [])
        .map(p => ({ ...p, eventCount: p.events?.length || 0 }))
        .sort((a, b) => b.eventCount - a.eventCount)
    },
  })

  // Recent events
  const { data: recentEvents } = useQuery({
    queryKey: ['admin-recent-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select(`
          id, name, event_date, venue, genre, is_active,
          producers(name),
          transactions(id)
        `)
        .order('event_date', { ascending: false })
        .limit(6)
      return data || []
    },
  })

  const kpiCards = [
    {
      icon: UserCheck,
      label: 'מפיקים פעילים',
      value: kpi?.producers,
      sub: 'מפיקים ב-onboarding',
      color: 'wa',
    },
    {
      icon: Users,
      label: 'קהל רשום',
      value: Number(kpi?.users || 0).toLocaleString('he-IL'),
      sub: 'סה"כ משתמשים במאגר',
      color: 'accent',
    },
    {
      icon: Calendar,
      label: 'אירועים פעילים',
      value: kpi?.events,
      sub: 'אירועים בתאריך קרוב',
      color: 'yellow',
    },
    {
      icon: TrendingUp,
      label: 'עמלות Axess',
      value: kpi?.commission ? `₪${Number(kpi.commission).toLocaleString('he-IL', { maximumFractionDigits: 0 })}` : '₪0',
      sub: 'מ-leads מאושרים',
      color: 'blue',
    },
    {
      icon: CreditCard,
      label: 'עסקאות בתשלום',
      value: Number(kpi?.transactions || 0).toLocaleString('he-IL'),
      sub: 'Paid + Approved',
      color: 'purple',
    },
    {
      icon: LogIn,
      label: "צ'ק-אין היום",
      value: kpi?.checkins_today ?? 0,
      sub: 'כניסות אומתו היום',
      color: 'pink',
    },
  ]

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">דשבורד אדמין</h1>
          <p className="text-muted text-sm mt-0.5">סקירה כללית של המערכת בזמן אמת</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries()}
          className="btn-secondary text-sm"
        >
          <RefreshCw size={14} /> רענן
        </button>
      </div>

      {/* KPI Grid — 3 cols on lg, 2 on sm */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <KPICard key={card.label} {...card} loading={kpiLoading} />
        ))}
      </div>

      {/* Chart + Top Producers — 2 cols */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Monthly Chart — 2/3 width */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">פעילות חודשית</h2>
              <p className="text-xs text-muted mt-0.5">עסקאות בתשלום ועמלות — 12 חודשים אחרונים</p>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-56 bg-surface-300 rounded-xl animate-pulse" />
          ) : chartData?.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted text-sm">
              אין נתונים עדיין — ייבא עסקאות ב-CSV
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3ECF8E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3ECF8E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `₪${(v / 1000).toFixed(0)}k` : `₪${v}`}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="הכנסות"
                  stroke="#25D366"
                  strokeWidth={2}
                  fill="url(#gradRevenue)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#25D366' }}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="עמלה"
                  stroke="#3ECF8E"
                  strokeWidth={2}
                  fill="url(#gradCommission)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#3ECF8E' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Chart legend */}
          {!chartLoading && chartData?.length > 0 && (
            <div className="flex items-center gap-5 mt-3 justify-end">
              {[
                { color: '#25D366', label: 'הכנסות' },
                { color: '#3ECF8E', label: 'עמלת Axess' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Producers — 1/3 width */}
        <div className="card">
          <h2 className="section-title mb-4">מפיקים מובילים</h2>
          {!topProducers ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-surface-300 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topProducers.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">אין מפיקים עדיין</p>
          ) : (
            <div className="space-y-2">
              {topProducers.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <span className="text-lg font-black text-muted w-5 text-center">{i + 1}</span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-wa flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-white">
                      {p.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    {p.business_name && (
                      <p className="text-[11px] text-muted truncate">{p.business_name}</p>
                    )}
                  </div>
                  <span className="text-xs text-wa font-semibold flex-shrink-0">
                    {p.eventCount} אירועים
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders bar chart */}
      {chartData?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">הזמנות לפי חודש</h2>
              <p className="text-xs text-muted mt-0.5">כמות עסקאות Paid/Approved</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={18} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="orders" name="הזמנות" fill="#25D366" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Events */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="section-title">אירועים אחרונים</h2>
          <span className="text-xs text-muted">{recentEvents?.length || 0} מוצגים</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">שם אירוע</th>
                <th className="table-th">מפיק</th>
                <th className="table-th">מקום</th>
                <th className="table-th">ז'אנר</th>
                <th className="table-th">תאריך</th>
                <th className="table-th">עסקאות</th>
                <th className="table-th">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {!recentEvents
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="table-td">
                          <div className="h-4 bg-surface-50 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : recentEvents.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-10 text-sm">
                        אין אירועים עדיין
                      </td>
                    </tr>
                  )
                : recentEvents.map((ev) => (
                    <tr key={ev.id} className="table-row">
                      <td className="table-td font-medium text-white">{ev.name}</td>
                      <td className="table-td">{ev.producers?.name || '—'}</td>
                      <td className="table-td">{ev.venue || '—'}</td>
                      <td className="table-td">
                        {ev.genre
                          ? <span className="badge-blue text-[11px]">{ev.genre}</span>
                          : '—'}
                      </td>
                      <td className="table-td tabular-nums">
                        {ev.event_date
                          ? new Date(ev.event_date).toLocaleDateString('he-IL')
                          : '—'}
                      </td>
                      <td className="table-td tabular-nums">
                        {ev.transactions?.length ?? 0}
                      </td>
                      <td className="table-td">
                        <span className={ev.is_active ? 'badge-green' : 'badge-gray'}>
                          {ev.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
