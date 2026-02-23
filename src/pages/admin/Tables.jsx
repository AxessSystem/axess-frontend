import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Table2, DollarSign } from 'lucide-react'

export default function AdminTables() {
  const { data: upsells, isLoading } = useQuery({
    queryKey: ['admin-upsells'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsells')
        .select(`
          id, upsell_type, status, details, requested_at,
          events(name), producers(name), users(first_name, last_name, phone)
        `)
        .order('requested_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data || []
    },
  })

  const statusBadge = (s) => {
    const map = { requested: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', redeemed: 'badge-blue' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">שולחנות ומחירון</h1>
          <p className="text-muted text-sm mt-0.5">upsells וניהול שולחנות</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">לקוח</th>
                <th className="table-th">סוג</th>
                <th className="table-th">אירוע</th>
                <th className="table-th">מפיק</th>
                <th className="table-th">פרטים</th>
                <th className="table-th">סטטוס</th>
                <th className="table-th">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="table-td"><div className="h-4 bg-surface-50 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : upsells?.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-12 text-sm">
                        אין upsells עדיין
                      </td>
                    </tr>
                  )
                : upsells?.map((u) => (
                    <tr key={u.id} className="table-row">
                      <td className="table-td text-white">
                        {[u.users?.first_name, u.users?.last_name].filter(Boolean).join(' ') || u.users?.phone || '—'}
                      </td>
                      <td className="table-td">{u.upsell_type}</td>
                      <td className="table-td">{u.events?.name || '—'}</td>
                      <td className="table-td">{u.producers?.name || '—'}</td>
                      <td className="table-td">
                        <span className="text-xs text-muted">
                          {JSON.stringify(u.details).slice(0, 40)}
                        </span>
                      </td>
                      <td className="table-td">{statusBadge(u.status)}</td>
                      <td className="table-td">
                        {u.requested_at ? new Date(u.requested_at).toLocaleDateString('he-IL') : '—'}
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
