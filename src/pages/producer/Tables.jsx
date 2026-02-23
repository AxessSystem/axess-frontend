import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProducerTables() {
  const { producerId } = useAuth()
  const qc = useQueryClient()

  const { data: upsells, isLoading } = useQuery({
    queryKey: ['producer-upsells', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsells')
        .select(`
          id, upsell_type, status, details, requested_at, redemption_code,
          events(name), users(first_name, last_name, phone)
        `)
        .eq('producer_id', producerId)
        .order('requested_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!producerId,
  })

  const approve = useMutation({
    mutationFn: async ({ id, approve: doApprove }) => {
      const { error } = await supabase
        .from('upsells')
        .update({ status: doApprove ? 'approved' : 'rejected' })
        .eq('id', id)
        .eq('producer_id', producerId)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      toast.success(vars.approve ? 'אושר' : 'נדחה')
      qc.invalidateQueries(['producer-upsells'])
    },
    onError: () => toast.error('שגיאה'),
  })

  const statusBadge = (s) => {
    const map = { requested: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', redeemed: 'badge-blue' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">שולחנות ומחירים</h1>
          <p className="text-muted text-sm mt-0.5">בקשות upsell לאירועים שלי</p>
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
                <th className="table-th">פרטים</th>
                <th className="table-th">סטטוס</th>
                <th className="table-th">תאריך</th>
                <th className="table-th">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
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
                        אין בקשות עדיין
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
                      <td className="table-td text-xs text-muted">
                        {JSON.stringify(u.details).slice(0, 50)}
                      </td>
                      <td className="table-td">{statusBadge(u.status)}</td>
                      <td className="table-td">
                        {u.requested_at ? new Date(u.requested_at).toLocaleDateString('he-IL') : '—'}
                      </td>
                      <td className="table-td">
                        {u.status === 'requested' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => approve.mutate({ id: u.id, approve: true })}
                              disabled={approve.isPending}
                              className="btn-ghost text-wa text-xs p-1.5"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => approve.mutate({ id: u.id, approve: false })}
                              disabled={approve.isPending}
                              className="btn-ghost text-red-400 text-xs p-1.5"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
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
