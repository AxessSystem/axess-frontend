import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, CheckCircle, XCircle, Phone, Building2, Users, MessageCircle, UserPlus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import AddProducerModal from '@/components/ui/AddProducerModal'
import CustomSelect from '@/components/ui/CustomSelect'

const LEAD_STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'new', label: 'חדש' },
  { value: 'contacted', label: 'נוצר קשר' },
  { value: 'interested', label: 'מעוניין' },
  { value: 'converted', label: 'הומר' },
]

export default function AdminProducers() {
  const [activeTab, setActiveTab] = useState('producers') // 'producers' | 'leads'
  const [showAddProducer, setShowAddProducer] = useState(false)
  const [leadStatusFilter, setLeadStatusFilter] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  const [convertLeadId, setConvertLeadId] = useState(null)
  const qc = useQueryClient()

  const { data: producers, isLoading } = useQuery({
    queryKey: ['admin-producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producers')
        .select(`
          id, name, business_name, producer_phone, email,
          is_active, commission_rate, created_at,
          events(id)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['admin-producer-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producer_leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: activeTab === 'leads',
  })

  const filteredLeads = useMemo(() => {
    let list = leads
    if (leadStatusFilter) list = list.filter((l) => l.status === leadStatusFilter)
    if (leadSearch.trim()) {
      const q = leadSearch.trim().toLowerCase()
      list = list.filter(
        (l) =>
          (l.phone && l.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))) ||
          (l.first_name && l.first_name.toLowerCase().includes(q)) ||
          (l.last_name && l.last_name.toLowerCase().includes(q)) ||
          (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q)) ||
          (l.source_url && l.source_url.toLowerCase().includes(q))
      )
    }
    return list
  }, [leads, leadStatusFilter, leadSearch])

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('producer_leads').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('סטטוס עודכן')
      qc.invalidateQueries(['admin-producer-leads'])
      setConvertLeadId(null)
    },
    onError: () => toast.error('שגיאה בעדכון'),
  })

  const openWhatsApp = (phone) => {
    const num = (phone || '').replace(/\D/g, '')
    const waNum = num.startsWith('972') ? num : `972${num.replace(/^0/, '')}`
    window.open(`https://wa.me/${waNum}`, '_blank', 'noopener,noreferrer')
  }

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('producers')
        .update({ is_active: !is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? 'מפיק הושבת' : 'מפיק אושר')
      qc.invalidateQueries(['admin-producers'])
    },
    onError: () => toast.error('שגיאה בעדכון'),
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">מפיקים</h1>
          <p className="text-muted text-sm mt-0.5">
            {activeTab === 'producers' ? `${producers?.length || 0} מפיקים במערכת` : `${filteredLeads.length} לידים`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-border bg-surface-50">
            <button
              onClick={() => setActiveTab('producers')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'producers' ? 'bg-primary text-white' : 'text-muted hover:bg-surface-100'}`}
            >
              <Building2 size={14} className="inline mr-1" /> מפיקים
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'leads' ? 'bg-primary text-white' : 'text-muted hover:bg-surface-100'}`}
            >
              <Users size={14} className="inline mr-1" /> לידים פוטנציאליים
            </button>
          </div>
          {activeTab === 'producers' && (
            <button onClick={() => setShowAddProducer(true)} className="btn-primary">
              <Plus size={16} /> הוסף מפיק
            </button>
          )}
        </div>
      </div>

      {activeTab === 'leads' && (
        <div className="card mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="חיפוש לפי שם, טלפון, אירוע..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="input pl-9 w-full"
              />
            </div>
            <CustomSelect
              value={leadStatusFilter}
              onChange={(val) => setLeadStatusFilter(val)}
              className="input w-auto"
              options={LEAD_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="card overflow-x-auto">
          {leadsLoading ? (
            <div className="animate-pulse h-48 bg-surface-50 rounded" />
          ) : (
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-th">טלפון</th>
                  <th className="table-th">שם</th>
                  <th className="table-th">אימייל</th>
                  <th className="table-th">מקור</th>
                  <th className="table-th">סטטוס</th>
                  <th className="table-th">הערות</th>
                  <th className="table-th">תאריך</th>
                  <th className="table-th">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr><td colSpan={8} className="table-td text-muted text-center py-8">אין לידים להצגה</td></tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-surface-50/50">
                      <td className="table-td font-mono" dir="ltr">{l.phone || '—'}</td>
                      <td className="table-td">{[l.first_name, l.last_name, l.contact_name].filter(Boolean).join(' ') || '—'}</td>
                      <td className="table-td">{l.contact_email || '—'}</td>
                      <td className="table-td">
                        {l.source_url ? (
                          <a href={l.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[120px] inline-block" title={l.source_url}>{l.source || 'קישור'}</a>
                        ) : (l.source || '—')}
                      </td>
                      <td className="table-td">
                        <span className={`badge ${l.status === 'converted' ? 'badge-green' : l.status === 'interested' ? 'badge-blue' : 'badge-gray'}`}>
                          {l.status || 'new'}
                        </span>
                      </td>
                      <td className="table-td text-muted max-w-[140px] truncate" title={l.notes}>{l.notes || '—'}</td>
                      <td className="table-td text-muted">{l.created_at ? new Date(l.created_at).toLocaleDateString('he-IL') : '—'}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          {l.phone && (
                            <button
                              type="button"
                              onClick={() => openWhatsApp(l.phone)}
                              className="btn-secondary text-xs"
                              title="פנה אליו בוואטסאפ"
                            >
                              <MessageCircle size={14} /> פנה
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setConvertLeadId(l.id)
                              updateLeadStatus.mutate({ id: l.id, status: 'converted' })
                            }}
                            disabled={updateLeadStatus.isPending && convertLeadId === l.id}
                            className="btn-primary text-xs"
                            title="העבר למפיק פעיל"
                          >
                            <UserPlus size={14} /> העבר למפיק
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'producers' && (
      <div className="grid gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-surface-50" />
            ))
          : producers?.map((p) => (
              <div key={p.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-wa flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-black text-white">
                    {p.name[0]?.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white">{p.name}</h3>
                    {p.business_name && (
                      <span className="text-xs text-muted">({p.business_name})</span>
                    )}
                    <span className={p.is_active ? 'badge-green' : 'badge-red'}>
                      {p.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted flex-wrap">
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone size={12} /> {p.producer_phone}
                    </span>
                    {p.email && <span>{p.email}</span>}
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {p.events?.length || 0} אירועים
                    </span>
                    {p.commission_rate && (
                      <span>עמלה: {(p.commission_rate * 100).toFixed(0)}%</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive.mutate({ id: p.id, is_active: p.is_active })}
                    disabled={toggleActive.isPending}
                    className={p.is_active ? 'btn-danger text-xs' : 'btn-primary text-xs'}
                  >
                    {p.is_active ? (
                      <><XCircle size={14} /> השבת</>
                    ) : (
                      <><CheckCircle size={14} /> אשר</>
                    )}
                  </button>
                </div>
              </div>
            ))}
      </div>
      )}

      {showAddProducer && (
        <AddProducerModal
          onClose={() => setShowAddProducer(false)}
          onSuccess={() => setShowAddProducer(false)}
        />
      )}
    </div>
  )
}
