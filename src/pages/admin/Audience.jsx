import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Search, Filter, ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = ['הכל', 'lead', 'buyer', 'vip', 'blocked']

export default function AdminAudience() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('הכל')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-audience', search, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          id, phone, first_name, last_name, email,
          status, gender, created_at, auto_approve,
          user_tags(tags(name, color))
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (search) {
        query = query.or(
          `phone.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        )
      }
      if (statusFilter !== 'הכל') {
        query = query.eq('status', statusFilter)
      }

      const { data, count, error } = await query
      if (error) throw error
      return { rows: data || [], total: count || 0 }
    },
    keepPreviousData: true,
  })

  const statusBadge = (status) => {
    const map = {
      lead: 'badge-gray',
      buyer: 'badge-blue',
      vip: 'badge-yellow',
      blocked: 'badge-red',
    }
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">ניהול קהל</h1>
          <p className="text-muted text-sm mt-0.5">
            {data?.total?.toLocaleString() || 0} רשומות
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, טלפון, אימייל..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="input pr-9"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s
                  ? 'bg-wa/10 text-wa border border-wa/20'
                  : 'bg-surface-100 text-muted border border-border hover:border-border-light'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">שם</th>
                <th className="table-th">טלפון</th>
                <th className="table-th">אימייל</th>
                <th className="table-th">סטטוס</th>
                <th className="table-th">תגיות</th>
                <th className="table-th">נרשם</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="h-4 bg-surface-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.rows?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-12 text-sm">
                    לא נמצאו תוצאות
                  </td>
                </tr>
              ) : (
                data?.rows?.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="table-td font-medium text-white">
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      {u.auto_approve && (
                        <span className="mr-2 text-[10px] text-wa">✓ אוטו</span>
                      )}
                    </td>
                    <td className="table-td font-mono" dir="ltr">{u.phone}</td>
                    <td className="table-td">{u.email || '—'}</td>
                    <td className="table-td">{statusBadge(u.status)}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-1">
                        {u.user_tags?.slice(0, 3).map((ut) => (
                          <span
                            key={ut.tags?.name}
                            className="text-[10px] px-1.5 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: (ut.tags?.color || '#6366f1') + '20',
                              borderColor: (ut.tags?.color || '#6366f1') + '40',
                              color: ut.tags?.color || '#6366f1',
                            }}
                          >
                            {ut.tags?.name}
                          </span>
                        ))}
                        {(u.user_tags?.length || 0) > 3 && (
                          <span className="text-[10px] text-muted">
                            +{u.user_tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('he-IL') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted">
              מציג {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} מתוך {data.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
              >
                הקודם
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= data.total}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
