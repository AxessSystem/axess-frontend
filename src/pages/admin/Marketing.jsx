import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Megaphone, Plus, Send, Eye } from 'lucide-react'

export default function AdminMarketing() {
  const [tab, setTab] = useState('campaigns')

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select(`
          id, name, status, total_recipients, sent_count,
          failed_count, created_at, started_at, completed_at,
          events(name), producers(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data || []
    },
  })

  const statusBadge = (s) => {
    const map = { draft: 'badge-gray', sending: 'badge-yellow', completed: 'badge-green', failed: 'badge-red' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">שיווק</h1>
          <p className="text-muted text-sm mt-0.5">קמפיינים ושליחת WhatsApp</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> קמפיין חדש
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'קמפיינים', value: campaigns?.length || 0 },
          { label: 'נשלחו', value: campaigns?.reduce((s, c) => s + (c.sent_count || 0), 0)?.toLocaleString() || 0 },
          { label: 'הצלחה %', value: (() => {
              const total = campaigns?.reduce((s, c) => s + (c.total_recipients || 0), 0) || 0
              const sent = campaigns?.reduce((s, c) => s + (c.sent_count || 0), 0) || 0
              return total > 0 ? `${Math.round(sent / total * 100)}%` : '—'
            })() },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-4">
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="section-title">קמפיינים</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">שם קמפיין</th>
                <th className="table-th">מפיק</th>
                <th className="table-th">אירוע</th>
                <th className="table-th">נמענים</th>
                <th className="table-th">נשלח</th>
                <th className="table-th">סטטוס</th>
                <th className="table-th">תאריך</th>
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
                : campaigns?.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-12 text-sm">
                        אין קמפיינים עדיין
                      </td>
                    </tr>
                  )
                : campaigns?.map((c) => (
                    <tr key={c.id} className="table-row">
                      <td className="table-td font-medium text-white">{c.name}</td>
                      <td className="table-td">{c.producers?.name || '—'}</td>
                      <td className="table-td">{c.events?.name || '—'}</td>
                      <td className="table-td">{c.total_recipients || 0}</td>
                      <td className="table-td">
                        <span className="text-wa">{c.sent_count || 0}</span>
                        {c.failed_count > 0 && (
                          <span className="text-red-400 mr-2">/ {c.failed_count} נכשל</span>
                        )}
                      </td>
                      <td className="table-td">{statusBadge(c.status)}</td>
                      <td className="table-td">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('he-IL') : '—'}
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
