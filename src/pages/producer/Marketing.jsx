import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Megaphone, Plus, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

export default function ProducerMarketing() {
  const { producerId } = useAuth()
  const [composing, setComposing] = useState(false)
  const [template, setTemplate] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['producer-campaigns', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('id, name, status, total_recipients, sent_count, created_at, events(name)')
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!producerId,
  })

  const { data: events } = useQuery({
    queryKey: ['producer-events-list', producerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name')
        .eq('producer_id', producerId)
        .eq('is_active', true)
      return data || []
    },
    enabled: !!producerId,
  })

  const statusBadge = (s) => {
    const map = { draft: 'badge-gray', sending: 'badge-yellow', completed: 'badge-green', failed: 'badge-red' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
  }

  const handleSaveDraft = async () => {
    if (!template.trim()) return toast.error('נא להזין תבנית הודעה')
    if (!selectedEvent) return toast.error('נא לבחור אירוע')
    const { error } = await supabase.from('marketing_campaigns').insert({
      producer_id: producerId,
      event_id: selectedEvent,
      name: `קמפיין ${new Date().toLocaleDateString('he-IL')}`,
      message_template: template,
      status: 'draft',
    })
    if (error) {
      toast.error('שגיאה בשמירה')
    } else {
      toast.success('טיוטה נשמרה')
      setComposing(false)
      setTemplate('')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">שיווק WhatsApp</h1>
          <p className="text-muted text-sm mt-0.5">הכן ושלח הודעות לקהל שלך</p>
        </div>
        <button onClick={() => setComposing(!composing)} className="btn-primary">
          <Plus size={16} /> קמפיין חדש
        </button>
      </div>

      {/* Composer */}
      {composing && (
        <div className="card mb-6 border-wa/20 animate-slide-up">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Megaphone size={18} className="text-wa" /> הכנת הודעה
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">אירוע</label>
              <CustomSelect
                value={selectedEvent}
                onChange={(val) => setSelectedEvent(val)}
                className="input"
                options={[
                  { value: '', label: 'בחר אירוע...' },
                  ...(events?.map((ev) => ({ value: ev.id, label: ev.name })) || []),
                ]}
              />
            </div>
            <div>
              <label className="label">תבנית הודעה</label>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={5}
                placeholder={`שלום {{שם}},\n\nאנחנו שמחים להזמין אותך ל...\n\n🎵 {{{שם_אירוע}}}\n📅 {{תאריך}}\n📍 {{מקום}}`}
                className="input resize-none"
              />
              <p className="text-xs text-muted mt-1">
                ניתן להשתמש ב: {'{{שם}}'}, {'{{שם_אירוע}}'}, {'{{תאריך}}'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveDraft} className="btn-primary">
                שמור טיוטה
              </button>
              <button onClick={() => setComposing(false)} className="btn-secondary">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="section-title">הקמפיינים שלי</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">שם</th>
                <th className="table-th">אירוע</th>
                <th className="table-th">נמענים</th>
                <th className="table-th">נשלח</th>
                <th className="table-th">סטטוס</th>
                <th className="table-th">תאריך</th>
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
                : campaigns?.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-12 text-sm">
                        אין קמפיינים עדיין
                      </td>
                    </tr>
                  )
                : campaigns?.map((c) => (
                    <tr key={c.id} className="table-row">
                      <td className="table-td font-medium text-white">{c.name}</td>
                      <td className="table-td">{c.events?.name || '—'}</td>
                      <td className="table-td">{c.total_recipients || 0}</td>
                      <td className="table-td text-wa">{c.sent_count || 0}</td>
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
