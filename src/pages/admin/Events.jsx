import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Plus, Upload, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import CSVUploadModal from '@/components/ui/CSVUploadModal'
import AddEventModal from '@/components/ui/AddEventModal'

export default function AdminEvents() {
  const [showCSV, setShowCSV] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedProducerId, setSelectedProducerId] = useState(null)
  const qc = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, producer_id, name, slug, venue, genre, event_date,
          is_active, capacity, created_at,
          producers(name),
          transactions(id)
        `)
        .order('event_date', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">אירועים</h1>
          <p className="text-muted text-sm mt-0.5">{events?.length || 0} אירועים</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedEvent(null); setSelectedProducerId(null); setShowCSV(true) }}
            className="btn-secondary"
          >
            <Upload size={16} /> ייבוא CSV
          </button>
          <button onClick={() => setShowAddEvent(true)} className="btn-primary">
            <Plus size={16} /> אירוע חדש
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">שם אירוע</th>
                <th className="table-th">מפיק</th>
                <th className="table-th">מקום</th>
                <th className="table-th">תאריך</th>
                <th className="table-th">עסקאות</th>
                <th className="table-th">סטטוס</th>
                <th className="table-th">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="table-td">
                          <div className="h-4 bg-surface-50 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : events?.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-12 text-sm">
                        אין אירועים עדיין
                      </td>
                    </tr>
                  )
                : events?.map((ev) => (
                    <tr key={ev.id} className="table-row">
                      <td className="table-td">
                        <div className="font-medium text-white">{ev.name}</div>
                        <div className="text-xs text-muted">{ev.genre || '—'}</div>
                      </td>
                      <td className="table-td">{ev.producers?.name || '—'}</td>
                      <td className="table-td">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-muted" />
                          {ev.venue || '—'}
                        </span>
                      </td>
                      <td className="table-td">
                        {ev.event_date
                          ? new Date(ev.event_date).toLocaleDateString('he-IL')
                          : '—'}
                      </td>
                      <td className="table-td">{ev.transactions?.length || 0}</td>
                      <td className="table-td">
                        <span className={ev.is_active ? 'badge-green' : 'badge-gray'}>
                          {ev.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="table-td">
                        <button
                          onClick={() => { setSelectedEvent(ev.id); setSelectedProducerId(ev.producer_id); setShowCSV(true) }}
                          className="btn-ghost text-xs"
                        >
                          <Upload size={13} /> CSV
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCSV && (
        <CSVUploadModal
          eventId={selectedEvent}
          producerId={selectedProducerId}
          onClose={() => setShowCSV(false)}
          onSuccess={() => {
            setShowCSV(false)
            qc.invalidateQueries(['admin-events'])
            toast.success('הקובץ יובא בהצלחה')
          }}
        />
      )}

      {showAddEvent && (
        <AddEventModal
          onClose={() => setShowAddEvent(false)}
          onSuccess={() => setShowAddEvent(false)}
        />
      )}
    </div>
  )
}
