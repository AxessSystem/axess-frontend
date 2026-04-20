import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import EventEditModal from './EventEditModal'

export default function EventEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { businessId } = useAuth()
  const allowed = useRequirePermission('can_view_events')

  if (!allowed) return null

  const isCreate = !id
  const mode = isCreate ? 'create' : 'edit'

  return (
    <EventEditModal
      presentation="page"
      isOpen
      mode={mode}
      eventId={id || null}
      businessId={businessId}
      onClose={(options) => {
        if (options?.navigateTo === 'campaigns' && id) {
          navigate(`/dashboard/events/${id}?tab=campaigns`)
        } else if (id) {
          navigate(`/dashboard/events/${id}`) // חזרה לדף האירוע
        } else {
          navigate('/dashboard/events') // יצירה חדשה
        }
      }}
      onEventCreated={(ev) => {
        if (ev?.id) navigate(`/dashboard/events/${ev.id}`)
      }}
      onSave={() => {
        // רענן נתוני האירוע בלי לסגור
        // אל תנווט ואל תסגור
      }}
    />
  )
}
