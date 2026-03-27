import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const CONTACT_ROLES = [
  { value: 'מורה', label: 'מורה' },
  { value: 'מדריך', label: 'מדריך' },
  { value: 'הורה', label: 'הורה' },
  { value: 'אחר', label: 'אחר' },
]

export default function GroupRegistrationPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({
    group_name: '',
    contact_role: '',
    contact_name: '',
    contact_phone: '',
    participant_count: 1,
    notes: '',
    addParticipantsNow: false,
    participants: [],
  })

  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE}/e/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('לא נמצא')))
      .then(data => { setEvent(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  const updateForm = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const updateParticipant = (i, key, value) => {
    setForm(f => ({
      ...f,
      participants: f.participants.map((p, j) => j === i ? { ...p, [key]: value } : p),
    }))
  }

  useEffect(() => {
    const n = Math.max(0, parseInt(form.participant_count, 10) || 1)
    setForm(f => ({
      ...f,
      participants: Array(n).fill(null).map((_, i) => f.participants[i] || { name: '', phone: '', parent_phone: '' }),
    }))
  }, [form.participant_count])

  const handleSubmit = async () => {
    if (!form.group_name.trim() || !form.contact_name.trim() || !form.contact_phone.trim()) {
      toast.error('מלא שם קבוצה, איש קשר וטלפון')
      return
    }
    setSubmitting(true)
    try {
      const body = {
        group_name: form.group_name.trim(),
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
        contact_role: form.contact_role || null,
        participant_count: Math.max(1, parseInt(form.participant_count, 10) || 1),
        notes: form.notes.trim() || null,
      }
      if (form.addParticipantsNow && form.participants?.length) {
        body.participants = form.participants.map(p => ({
          name: p?.name || '',
          phone: p?.phone || '',
          parent_phone: p?.parent_phone || '',
        }))
      }
      const res = await fetch(`${API_BASE}/api/events/${slug}/groups/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      setSuccess({ group_code: data.group_code })
      toast.success('הקבוצה נרשמה בהצלחה!')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} style={{ color: 'var(--v2-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }
  if (!event) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <h1>האירוע לא נמצא</h1>
      </div>
    )
  }

  const eventDate = event.date || event.doors_open

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{event.title}</h1>
        {eventDate && <div style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>{new Date(eventDate).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short' })}</div>}
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>הרשמת קבוצה</h2>

        {success ? (
          <div style={{ textAlign: 'center', padding: 32, background: 'var(--v2-dark-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>נרשם</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>הקבוצה נרשמה בהצלחה!</h3>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, color: 'var(--v2-primary)' }}>{success.group_code}</div>
            <Link to={`/group/${success.group_code}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, textDecoration: 'none' }}>
              נהל קבוצה <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>שם הקבוצה *</label>
                  <input value={form.group_name} onChange={e => updateForm('group_name', e.target.value)} placeholder="כיתה ז'2 / קבוצת נוער" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>תפקיד</label>
                  <CustomSelect
                    light
                    value={form.contact_role}
                    onChange={(val) => updateForm('contact_role', val)}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                    placeholder="בחר תפקיד"
                    options={[{ value: '', label: 'בחר תפקיד' }, ...CONTACT_ROLES]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>שם איש קשר *</label>
                  <input value={form.contact_name} onChange={e => updateForm('contact_name', e.target.value)} placeholder="שם מלא" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>נייד *</label>
                  <input type="tel" value={form.contact_phone} onChange={e => updateForm('contact_phone', e.target.value)} placeholder="05XXXXXXXX" dir="ltr" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>מספר משתתפים *</label>
                  <input type="number" min={1} max={200} value={form.participant_count} onChange={e => updateForm('participant_count', e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>הערות</label>
                  <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} rows={3} placeholder="הערות נוספות" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff', resize: 'vertical' }} />
                </div>
                <button onClick={() => setStep(2)} style={{ padding: 16, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>המשך</button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input type="checkbox" id="addPart" checked={form.addParticipantsNow} onChange={e => updateForm('addParticipantsNow', e.target.checked)} />
                  <label htmlFor="addPart" style={{ cursor: 'pointer' }}>הוסף פרטי משתתפים עכשיו</label>
                </div>
                {form.addParticipantsNow && form.participants?.map((p, i) => (
                  <div key={i} style={{ padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>משתתף {i + 1}</div>
                    <input value={p?.name || ''} onChange={e => updateParticipant(i, 'name', e.target.value)} placeholder="שם" style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    <input value={p?.phone || ''} onChange={e => updateParticipant(i, 'phone', e.target.value)} placeholder="נייד (אופציונלי)" dir="ltr" style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                    <input value={p?.parent_phone || ''} onChange={e => updateParticipant(i, 'parent_phone', e.target.value)} placeholder="נייד הורה (אופציונלי)" dir="ltr" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }} />
                  </div>
                ))}
                {!form.addParticipantsNow && <p style={{ color: 'var(--v2-gray-400)', marginBottom: 16 }}>תוכל להוסיף פרטים מאוחר יותר</p>}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: 16, borderRadius: 'var(--radius-full)', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}>חזור</button>
                  <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: 16, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'שולח...' : 'שלח'}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
