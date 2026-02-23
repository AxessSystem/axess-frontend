import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'
import ManualCheckinForm from '@/components/ui/ManualCheckinForm'

export default function AdminTransactions() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [tab, setTab] = useState('transactions')
  const PAGE_SIZE = 25
  const qc = useQueryClient()

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['admin-transactions', search, page],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select(`
          id, order_id, first_name, last_name, buyer_phone,
          item_name, ticket_price, total_income, goout_status,
          purchase_date, is_axess_lead, axess_commission,
          events(name), producers(name)
        `, { count: 'exact' })
        .order('purchase_date', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (search) {
        q = q.or(`buyer_phone.ilike.%${search}%,order_id.ilike.%${search}%,first_name.ilike.%${search}%`)
      }
      const { data, count, error } = await q
      if (error) throw error
      return { rows: data || [], total: count || 0 }
    },
  })

  const { data: checkins, isLoading: checkinsLoading } = useQuery({
    queryKey: ['admin-checkins', search],
    enabled: tab === 'checkins',
    queryFn: async () => {
      let q = supabase
        .from('checkins')
        .select(`
          id, phone_raw, status, checkin_at, created_at,
          events(name), producers(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      if (search) q = q.ilike('phone_raw', `%${search}%`)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
  })

  const statusBadge = (s) => {
    const map = { Paid: 'badge-green', Approved: 'badge-blue', Pending: 'badge-yellow', Cancelled: 'badge-red', Refunded: 'badge-gray' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
  }

  const checkinBadge = (s) => {
    const map = { checked_in: 'badge-green', pending: 'badge-yellow', denied: 'badge-red' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">עסקאות וצ'ק-אין</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface-100 p-1 rounded-xl w-fit border border-border">
        {['transactions', 'checkins'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-wa/10 text-wa border border-wa/20' : 'text-muted hover:text-white'
            }`}
          >
            {t === 'transactions' ? 'עסקאות' : "צ'ק-אין"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="חיפוש..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="input pr-9"
        />
      </div>

      {/* Transactions Table */}
      {tab === 'transactions' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-300">
                  <th className="table-th">שם</th>
                  <th className="table-th">טלפון</th>
                  <th className="table-th">אירוע</th>
                  <th className="table-th">פריט</th>
                  <th className="table-th">מחיר</th>
                  <th className="table-th">סטטוס</th>
                  <th className="table-th">Axess</th>
                  <th className="table-th">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {txLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="table-td">
                            <div className="h-4 bg-surface-50 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : txData?.rows?.map((t) => (
                      <tr key={t.id} className="table-row">
                        <td className="table-td text-white">{[t.first_name, t.last_name].filter(Boolean).join(' ') || '—'}</td>
                        <td className="table-td font-mono" dir="ltr">{t.buyer_phone}</td>
                        <td className="table-td">{t.events?.name || '—'}</td>
                        <td className="table-td">{t.item_name || '—'}</td>
                        <td className="table-td">
                          {t.total_income ? `₪${t.total_income}` : '—'}
                        </td>
                        <td className="table-td">{statusBadge(t.goout_status)}</td>
                        <td className="table-td">
                          {t.is_axess_lead ? (
                            <span className="badge-green">
                              ✓ ₪{t.axess_commission?.toFixed(0) || 0}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">לא</span>
                          )}
                        </td>
                        <td className="table-td">
                          {t.purchase_date ? new Date(t.purchase_date).toLocaleDateString('he-IL') : '—'}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {txData && txData.total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, txData.total)} מתוך {txData.total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">הקודם</button>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= txData.total} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">הבא</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkins Table */}
      {tab === 'checkins' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-300">
                  <th className="table-th">טלפון</th>
                  <th className="table-th">אירוע</th>
                  <th className="table-th">סטטוס</th>
                  <th className="table-th">זמן כניסה</th>
                </tr>
              </thead>
              <tbody>
                {checkinsLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="table-td"><div className="h-4 bg-surface-50 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  : checkins?.map((c) => (
                      <tr key={c.id} className="table-row">
                        <td className="table-td font-mono" dir="ltr">{c.phone_raw}</td>
                        <td className="table-td">{c.events?.name || '—'}</td>
                        <td className="table-td">{checkinBadge(c.status)}</td>
                        <td className="table-td">
                          {c.checkin_at ? new Date(c.checkin_at).toLocaleString('he-IL') : '—'}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
