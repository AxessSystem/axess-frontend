import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { X, Plus, Link2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function slugify(str) {
  if (!str) return ''
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0590-\u05FF-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

function formatDateForInput(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export default function AddEventModal({ onClose, onSuccess }) {
  const qc = useQueryClient()
  const [fetchUrl, setFetchUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [form, setForm] = useState({
    producer_id: '',
    name: '',
    slug: '',
    venue: '',
    genre: '',
    event_date: '',
    capacity: '',
  })

  const { data: producers } = useQuery({
    queryKey: ['admin-producers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data || []
    },
  })

  const handleFetchLink = async () => {
    if (!fetchUrl.trim()) {
      toast.error('הזן כתובת URL')
      return
    }
    setFetching(true)
    try {
      const res = await fetch(`${API_URL}/api/scrape-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה בשאיבה')
      if (data.success && data.title) {
        setForm((f) => ({
          ...f,
          name: data.title || f.name,
          venue: data.location || f.venue,
          event_date: formatDateForInput(data.startDate) || f.event_date,
          slug: slugify(data.title) || f.slug,
          genre: f.genre,
        }))
        toast.success('הנתונים נשאבו בהצלחה')
      } else {
        toast.error(data.error || 'לא נמצאו נתונים בעמוד')
      }
    } catch (err) {
      toast.error(err.message || 'שגיאה בשאיבת הלינק')
    } finally {
      setFetching(false)
    }
  }

  const addEvent = useMutation({
    mutationFn: async (data) => {
      if (!data.producer_id) throw new Error('נא לבחור מפיק')
      if (!data.name.trim()) throw new Error('נא להזין שם אירוע')
      if (!data.event_date) throw new Error('נא להזין תאריך')
      const slug = data.slug.trim() || slugify(data.name)
      if (!slug) throw new Error('לא ניתן ליצור slug')
      const { error } = await supabase.from('events').insert({
        producer_id: data.producer_id,
        name: data.name.trim(),
        slug,
        venue: data.venue?.trim() || null,
        genre: data.genre?.trim() || null,
        event_date: data.event_date,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('האירוע נוצר בהצלחה')
      qc.invalidateQueries(['admin-events'])
      onSuccess?.()
      onClose()
    },
    onError: (err) => toast.error(err.message || 'שגיאה ביצירת אירוע'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    addEvent.mutate(form)
  }

  const updateForm = (key, val) => {
    setForm((f) => {
      const next = { ...f, [key]: val }
      if (key === 'name' && !f.slug) next.slug = slugify(val)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-surface-100 border border-border rounded-2xl w-full max-w-lg shadow-card animate-slide-up my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-wa" />
            <h2 className="font-bold text-white">אירוע חדש</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        {/* שאיבת לינק */}
        <div className="px-5 py-4 border-b border-border bg-surface-50/50">
          <p className="text-sm font-medium text-white mb-2">שאיבת לינק</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
              className="input flex-1"
              placeholder="https://goout.net/..."
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleFetchLink}
              disabled={fetching}
              className="btn-secondary"
            >
              {fetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Link2 size={16} /> שאל לינק
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">מפיק *</label>
            <select
              value={form.producer_id}
              onChange={(e) => updateForm('producer_id', e.target.value)}
              className="input"
              required
            >
              <option value="">בחר מפיק</option>
              {(producers || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">שם אירוע *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              className="input"
              placeholder="שם האירוע"
              required
            />
          </div>
          <div>
            <label className="label">Slug (נתיב ייחודי)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateForm('slug', e.target.value)}
              className="input"
              placeholder="event-name"
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">מקום</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => updateForm('venue', e.target.value)}
              className="input"
              placeholder="המקום"
            />
          </div>
          <div>
            <label className="label">ז'אנר</label>
            <input
              type="text"
              value={form.genre}
              onChange={(e) => updateForm('genre', e.target.value)}
              className="input"
              placeholder="טכנו, האוס..."
            />
          </div>
          <div>
            <label className="label">תאריך ושעה *</label>
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => updateForm('event_date', e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">קיבולת</label>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => updateForm('capacity', e.target.value)}
              className="input"
              placeholder="500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={addEvent.isPending}
              className="btn-primary flex-1"
            >
              {addEvent.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>הוסף אירוע</>
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
