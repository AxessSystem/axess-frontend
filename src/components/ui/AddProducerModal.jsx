import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { X, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

function normalizePhone(raw) {
  if (!raw) return null
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('972') && digits.length >= 12) return `+${digits}`
  if (digits.startsWith('05') && digits.length === 10) return `+972${digits.slice(1)}`
  if (digits.startsWith('5') && digits.length === 9) return `+972${digits}`
  return `+${digits}`.length >= 12 ? `+${digits}` : null
}

export default function AddProducerModal({ onClose, onSuccess }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    business_name: '',
    producer_phone: '',
    email: '',
    commission_rate: '',
  })

  const addProducer = useMutation({
    mutationFn: async (data) => {
      const phone = normalizePhone(data.producer_phone)
      if (!phone) throw new Error('מספר טלפון לא תקין')
      const { error } = await supabase.from('producers').insert({
        name: data.name.trim(),
        business_name: data.business_name?.trim() || null,
        producer_phone: phone,
        email: data.email?.trim() || null,
        commission_rate: data.commission_rate ? parseFloat(data.commission_rate) / 100 : null,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('המפיק נוצר בהצלחה')
      qc.invalidateQueries(['admin-producers'])
      onSuccess?.()
      onClose()
    },
    onError: (err) => toast.error(err.message || 'שגיאה ביצירת מפיק'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('נא להזין שם')
      return
    }
    addProducer.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-100 border border-border rounded-2xl w-full max-w-md shadow-card animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-wa" />
            <h2 className="font-bold text-white">מפיק חדש</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">שם מלא *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="ישראל ישראלי"
              required
            />
          </div>
          <div>
            <label className="label">שם העסק</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
              className="input"
              placeholder="TLV Nights"
            />
          </div>
          <div>
            <label className="label">טלפון *</label>
            <input
              type="tel"
              value={form.producer_phone}
              onChange={(e) => setForm((f) => ({ ...f, producer_phone: e.target.value }))}
              className="input"
              placeholder="050-1234567"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">אימייל</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input"
              placeholder="producer@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">אחוז עמלה (למשל 10)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.commission_rate}
              onChange={(e) => setForm((f) => ({ ...f, commission_rate: e.target.value }))}
              className="input"
              placeholder="10"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={addProducer.isPending}
              className="btn-primary flex-1"
            >
              {addProducer.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>הוסף מפיק</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
