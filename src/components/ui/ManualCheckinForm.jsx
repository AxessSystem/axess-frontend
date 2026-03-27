import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

function normalizePhone(raw) {
  if (!raw) return null
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('972') && digits.length >= 12) return `+${digits}`
  if (digits.startsWith('05') && digits.length === 10) return `+972${digits.slice(1)}`
  if (digits.startsWith('5') && digits.length === 9) return `+972${digits}`
  if (digits.length >= 9) return `+972${digits}`.replace(/^\+9720/, '+972')
  return null
}

export default function ManualCheckinForm({ onSuccess }) {
  const qc = useQueryClient()
  const [eventId, setEventId] = useState('')
  const [phone, setPhone] = useState('')

  const { data: events } = useQuery({
    queryKey: ['admin-events-checkin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, producer_id, name, event_date')
        .eq('is_active', true)
        .order('event_date', { ascending: false })
        .limit(50)
      if (error) throw error
      return data || []
    },
  })

  const addCheckin = useMutation({
    mutationFn: async ({ eventId, producerId, phoneRaw }) => {
      const { error } = await supabase.from('checkins').insert({
        producer_id: producerId,
        event_id: eventId,
        phone_raw: phoneRaw,
        status: 'checked_in',
        checkin_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("צ'ק-אין נרשם בהצלחה")
      qc.invalidateQueries(['admin-checkins'])
      setPhone('')
      onSuccess?.()
    },
    onError: (err) => toast.error(err.message || 'שגיאה'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const phoneRaw = normalizePhone(phone)
    if (!phoneRaw) {
      toast.error('מספר טלפון לא תקין')
      return
    }
    const ev = events?.find((e) => e.id === eventId)
    if (!ev) {
      toast.error('נא לבחור אירוע')
      return
    }
    addCheckin.mutate({
      eventId,
      producerId: ev.producer_id,
      phoneRaw,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-4 mb-5">
      <h3 className="section-title w-full flex items-center gap-2">
        <LogIn size={18} className="text-wa" />
        צ'ק-אין ידני
      </h3>
      <div className="flex-1 min-w-[200px]">
        <label className="label">אירוע</label>
        <CustomSelect
          value={eventId}
          onChange={(val) => setEventId(val)}
          className="input"
          style={{ width: '100%' }}
          options={[
            { value: '', label: 'בחר אירוע' },
            ...(events || []).map((ev) => ({
              value: ev.id,
              label: `${ev.name} — ${ev.event_date ? new Date(ev.event_date).toLocaleDateString('he-IL') : ''}`,
            })),
          ]}
        />
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="label">טלפון</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input"
          placeholder="050-1234567"
          dir="ltr"
        />
      </div>
      <button
        type="submit"
        disabled={addCheckin.isPending}
        className="btn-primary"
      >
        {addCheckin.isPending ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>אשר צ'ק-אין</>
        )}
      </button>
    </form>
  )
}
