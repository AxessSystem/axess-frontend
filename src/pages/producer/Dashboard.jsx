import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, CreditCard, Users, TrendingUp } from 'lucide-react'

function ProducerKPI({ icon: Icon, label, value, sub, loading }) {
  return (
    <div className="kpi-card border border-wa/10">
      <div className="w-10 h-10 rounded-xl bg-wa/10 flex items-center justify-center">
        <Icon size={20} className="text-wa" />
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

export default function ProducerDashboard() {
  const { producerId, profile } = useAuth()

  const { data: events, isLoading: evLoading } = useQuery({
    queryKey: ['producer-events', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date, venue, is_active')
        .eq('producer_id', producerId)
        .order('event_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!producerId,
  })

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['producer-summary', producerId],
    queryFn: async () => {
      const [txRes, checkinRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, total_income, axess_commission, is_axess_lead, goout_status', { count: 'exact' })
          .eq('producer_id', producerId),
        supabase
          .from('checkins')
          .select('id, status', { count: 'exact' })
          .eq('producer_id', producerId),
      ])
      const txs = txRes.data || []
      const paid = txs.filter(t => ['Paid', 'Approved'].includes(t.goout_status))
      return {
        totalEvents: events?.length || 0,
        totalRevenue: paid.reduce((s, t) => s + (t.total_income || 0), 0),
        totalCommission: paid.reduce((s, t) => s + (t.axess_commission || 0), 0),
        totalCheckins: checkinRes.count || 0,
      }
    },
    enabled: !!producerId && !evLoading,
  })

  const kpiCards = [
    { icon: Calendar, label: 'אירועים', value: events?.length },
    {
      icon: CreditCard,
      label: 'הכנסות כולל',
      value: summary?.totalRevenue ? `₪${summary.totalRevenue.toLocaleString()}` : '₪0',
    },
    { icon: Users, label: "צ'ק-אין", value: summary?.totalCheckins },
    {
      icon: TrendingUp,
      label: 'עמלת Axess',
      value: summary?.totalCommission ? `₪${summary.totalCommission.toFixed(0)}` : '₪0',
    },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">
            שלום, {profile?.full_name || 'מפיק'} 👋
          </h1>
          <p className="text-muted text-sm mt-0.5">
            {profile?.producers?.name || 'הדשבורד שלי'}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <ProducerKPI key={card.label} {...card} loading={evLoading || sumLoading} />
        ))}
      </div>

      {/* My Events */}
      <div className="card">
        <h2 className="section-title mb-4">האירועים שלי</h2>
        {events?.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">אין אירועים עדיין</p>
        ) : (
          <div className="space-y-2">
            {events?.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-200 hover:bg-surface-50 transition-colors">
                <div>
                  <p className="font-medium text-white">{ev.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {ev.venue} · {ev.event_date ? new Date(ev.event_date).toLocaleDateString('he-IL') : '—'}
                  </p>
                </div>
                <span className={ev.is_active ? 'badge-green' : 'badge-gray'}>
                  {ev.is_active ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
