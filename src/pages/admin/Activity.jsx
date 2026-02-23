import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Activity, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export default function AdminActivity() {
  const qc = useQueryClient()

  const { data: logs, isLoading, isFetching } = useQuery({
    queryKey: ['admin-webhook-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_log')
        .select('id, received_at, from_phone, to_phone, bot_used, body, processed, process_ms, error, producers(name)')
        .order('received_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data || []
    },
    refetchInterval: 30000,
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">פעילות מערכת</h1>
          <p className="text-muted text-sm mt-0.5">Webhook log — 100 הרשומות האחרונות</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['admin-webhook-log'])}
          className="btn-secondary"
          disabled={isFetching}
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          רענון
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">זמן</th>
                <th className="table-th">מספר שולח</th>
                <th className="table-th">מספר מקבל</th>
                <th className="table-th">בוט</th>
                <th className="table-th">מפיק</th>
                <th className="table-th">הודעה</th>
                <th className="table-th">עיבוד</th>
                <th className="table-th">ms</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="table-td">
                          <div className="h-4 bg-surface-50 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : logs?.length === 0
                ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-12 text-sm">
                        אין פעילות עדיין
                      </td>
                    </tr>
                  )
                : logs?.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-td text-xs">
                        {new Date(log.received_at).toLocaleString('he-IL')}
                      </td>
                      <td className="table-td font-mono text-xs" dir="ltr">{log.from_phone || '—'}</td>
                      <td className="table-td font-mono text-xs" dir="ltr">{log.to_phone || '—'}</td>
                      <td className="table-td">
                        <span className={log.bot_used === 'producer' ? 'badge-blue' : 'badge-green'}>
                          {log.bot_used || '—'}
                        </span>
                      </td>
                      <td className="table-td">{log.producers?.name || '—'}</td>
                      <td className="table-td max-w-xs">
                        <span className="text-xs text-muted truncate block max-w-[200px]">
                          {log.body || '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        {log.error ? (
                          <span className="badge-red">שגיאה</span>
                        ) : log.processed ? (
                          <span className="badge-green">✓</span>
                        ) : (
                          <span className="badge-yellow">ממתין</span>
                        )}
                      </td>
                      <td className="table-td text-xs">{log.process_ms ?? '—'}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
