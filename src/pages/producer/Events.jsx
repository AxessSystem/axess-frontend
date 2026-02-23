import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import CSVUploadModal from '@/components/ui/CSVUploadModal'

export default function ProducerEvents() {
  const { producerId } = useAuth()
  const [showCSV, setShowCSV] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const qc = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['producer-events-full', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, slug, venue, genre, event_date,
          is_active, capacity, description,
          transactions(id, goout_status, total_income)
        `)
        .eq('producer_id', producerId)
        .order('event_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!producerId,
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">האירועים שלי</h1>
          <p className="text-muted text-sm mt-0.5">{events?.length || 0} אירועים</p>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-surface-50" />
            ))
          : events?.length === 0
          ? (
              <div className="card text-center py-16">
                <Calendar size={40} className="text-muted mx-auto mb-3" />
                <p className="text-white font-medium">אין אירועים עדיין</p>
                <p className="text-muted text-sm mt-1">פנה לאדמין ליצירת אירוע</p>
              </div>
            )
          : events?.map((ev) => {
              const paid = ev.transactions?.filter(t => ['Paid', 'Approved'].includes(t.goout_status)) || []
              const revenue = paid.reduce((s, t) => s + (t.total_income || 0), 0)

              return (
                <div key={ev.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-lg">{ev.name}</h3>
                        <span className={ev.is_active ? 'badge-green' : 'badge-gray'}>
                          {ev.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                        {ev.genre && (
                          <span className="badge-blue">{ev.genre}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted flex-wrap">
                        <span>{ev.venue || '—'}</span>
                        <span>
                          {ev.event_date ? new Date(ev.event_date).toLocaleDateString('he-IL') : '—'}
                        </span>
                        {ev.capacity && <span>קיבולת: {ev.capacity}</span>}
                      </div>
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <span>
                          <span className="text-white font-semibold">{paid.length}</span>
                          <span className="text-muted"> כרטיסים מכורים</span>
                        </span>
                        <span>
                          <span className="text-wa font-semibold">₪{revenue.toLocaleString()}</span>
                          <span className="text-muted"> הכנסות</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedEvent(ev.id); setShowCSV(true) }}
                      className="btn-secondary text-sm flex-shrink-0"
                    >
                      <Upload size={14} /> ייבוא CSV
                    </button>
                  </div>
                </div>
              )
            })}
      </div>

      {showCSV && (
        <CSVUploadModal
          eventId={selectedEvent}
          producerId={producerId}
          onClose={() => setShowCSV(false)}
          onSuccess={() => {
            setShowCSV(false)
            qc.invalidateQueries(['producer-events-full'])
            toast.success('הקובץ יובא בהצלחה')
          }}
        />
      )}
    </div>
  )
}
