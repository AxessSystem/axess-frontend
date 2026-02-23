import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart3, TrendingUp, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-100 border border-border rounded-xl px-3 py-2 text-xs shadow-card">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name.includes('₪')
            ? `₪${p.value.toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function ProducerReports() {
  const { producerId } = useAuth()

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['producer-commission-summary', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_commission_summary')
        .select('*')
        .eq('producer_id', producerId)
        .order('event_name')
      if (error) throw error
      return data || []
    },
    enabled: !!producerId,
  })

  const { data: salesperson } = useQuery({
    queryKey: ['producer-salesperson', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_salesperson_report')
        .select('*')
        .eq('producer_id', producerId)
      if (error) throw error
      return data || []
    },
    enabled: !!producerId,
  })

  const chartData = commissions?.map(c => ({
    name: c.event_name?.slice(0, 15) + (c.event_name?.length > 15 ? '...' : ''),
    'הכנסות ₪': Number(c.gross_revenue || 0),
    'עמלה ₪': Number(c.total_commission || 0),
    הזמנות: Number(c.total_orders || 0),
  }))

  const totals = commissions?.reduce((acc, c) => ({
    revenue: acc.revenue + Number(c.gross_revenue || 0),
    commission: acc.commission + Number(c.total_commission || 0),
    orders: acc.orders + Number(c.total_orders || 0),
    axessOrders: acc.axessOrders + Number(c.axess_paid_orders || 0),
  }), { revenue: 0, commission: 0, orders: 0, axessOrders: 0 })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">דוחות מכירות</h1>
          <p className="text-muted text-sm mt-0.5">ניתוח הכנסות ועמלות</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'הכנסות כולל', value: `₪${(totals?.revenue || 0).toLocaleString()}`, color: 'text-wa' },
          { label: 'עמלת Axess', value: `₪${(totals?.commission || 0).toFixed(0)}`, color: 'text-accent' },
          { label: 'הזמנות', value: totals?.orders || 0, color: 'text-white' },
          {
            label: 'ייחוס Axess',
            value: totals?.orders > 0
              ? `${Math.round((totals.axessOrders / totals.orders) * 100)}%`
              : '0%',
            color: 'text-yellow-400',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-5">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData?.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title mb-5">הכנסות לפי אירוע</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="הכנסות ₪" fill="#25D366" radius={[4, 4, 0, 0]} />
              <Bar dataKey="עמלה ₪" fill="#3ECF8E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Commission table */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="section-title">ניתוח לפי אירוע</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">אירוע</th>
                <th className="table-th">הזמנות</th>
                <th className="table-th">הכנסות</th>
                <th className="table-th">Axess הזמנות</th>
                <th className="table-th">עמלה</th>
                <th className="table-th">% ייחוס</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="table-td"><div className="h-4 bg-surface-50 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : commissions?.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-12 text-sm">
                        אין נתונים
                      </td>
                    </tr>
                  )
                : commissions?.map((c) => (
                    <tr key={c.event_id} className="table-row">
                      <td className="table-td font-medium text-white">{c.event_name}</td>
                      <td className="table-td">{c.total_orders}</td>
                      <td className="table-td text-wa">₪{Number(c.gross_revenue || 0).toLocaleString()}</td>
                      <td className="table-td">{c.axess_paid_orders}</td>
                      <td className="table-td text-accent">₪{Number(c.total_commission || 0).toFixed(0)}</td>
                      <td className="table-td">{c.attribution_pct}%</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salesperson */}
      {salesperson?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="section-title">דוח אנשי מכירות</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-300">
                  <th className="table-th">איש מכירות</th>
                  <th className="table-th">קונים ייחודיים</th>
                  <th className="table-th">הזמנות</th>
                  <th className="table-th">הכנסות</th>
                </tr>
              </thead>
              <tbody>
                {salesperson.map((s) => (
                  <tr key={s.salesperson} className="table-row">
                    <td className="table-td font-medium text-white">{s.salesperson}</td>
                    <td className="table-td">{s.unique_buyers}</td>
                    <td className="table-td">{s.total_orders}</td>
                    <td className="table-td text-wa">₪{Number(s.total_revenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
