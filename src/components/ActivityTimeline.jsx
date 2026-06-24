import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Phone, Users, FileText, MessageSquare, Mail, CheckSquare, ExternalLink, Pencil, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/supabase'
import CustomSelect from '@/components/ui/CustomSelect'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ActivityLogModal from '@/components/ActivityLogModal'
import { linkifyText } from '@/utils/linkify'

const ACCENT = '#00C37A'

const TYPE_OPTIONS = [
  { value: '', label: 'כל הסוגים' },
  { value: 'meeting', label: 'פגישה' },
  { value: 'call', label: 'שיחה' },
  { value: 'note', label: 'הערה' },
  { value: 'email', label: 'אימייל' },
  { value: 'document_sent', label: 'מסמך נשלח' },
  { value: 'document_received', label: 'מסמך התקבל' },
  { value: 'task', label: 'משימה' },
  { value: 'message', label: 'הודעה' },
  { value: 'checkin', label: "צ'ק-אין" },
  { value: 'interest', label: 'עניין' },
]

const DIRECTION_OPTIONS = [
  { value: '', label: 'כל הכיוונים' },
  { value: 'inbound', label: 'נכנס' },
  { value: 'outbound', label: 'יצא' },
]

const TYPE_LABELS = {
  meeting: 'פגישה',
  call: 'שיחה',
  note: 'הערה',
  email: 'אימייל',
  document_sent: 'מסמך נשלח',
  document_received: 'מסמך התקבל',
  task: 'משימה',
  message: 'הודעה',
  checkin: "צ'ק-אין",
  interest: 'עניין',
  sms_reply: 'SMS נכנס',
  lead_captured: 'ליד נקלט',
}

function TypeIcon({ type }) {
  const props = { size: 18, color: ACCENT }
  switch (type) {
    case 'call': return <Phone {...props} />
    case 'meeting': return <Users {...props} />
    case 'document_sent':
    case 'document_received': return <FileText {...props} />
    case 'email': return <Mail {...props} />
    case 'task': return <CheckSquare {...props} />
    case 'message':
    case 'note':
    default: return <MessageSquare {...props} />
  }
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function ActivityTimeline({ recipientId, projectId, showFilters = false, onActivityAdded }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterDirection, setFilterDirection] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [deleteId, setDeleteId] = useState(null)
  const [editItem, setEditItem] = useState(null)

  const load = useCallback(async () => {
    if (!recipientId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (projectId) params.set('project_id', projectId)
      if (filterType) params.set('activity_type', filterType)
      if (filterDirection) params.set('direction', filterDirection)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('limit', '50')

      const data = await fetchWithAuth(`/api/audiences/activity/${recipientId}?${params}`)
      if (data?.error) throw new Error(data.error)
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      toast.error(err.message || 'שגיאה בטעינת פעילות')
    } finally {
      setLoading(false)
    }
  }, [recipientId, projectId, filterType, filterDirection, dateFrom, dateTo, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    if (!deleteId) {
      setDeleteId(null)
      return
    }
    try {
      const data = await fetchWithAuth(`/api/audiences/activity/${deleteId}`, { method: 'DELETE' })
      if (data?.error) throw new Error(data.error)
      setItems((prev) => prev.filter((i) => i.id !== deleteId))
      setTotal((t) => Math.max(0, t - 1))
      toast.success('נמחק')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setDeleteId(null)
    }
  }

  const onSaved = (newItem) => {
    if (newItem?.id) {
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === newItem.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], ...newItem, source: 'activity_log' }
          return next
        }
        return [{ ...newItem, source: 'activity_log', created_by_name: null }, ...prev]
      })
    }
    setEditItem(null)
    onActivityAdded?.()
  }

  const filterBar = showFilters && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <CustomSelect options={TYPE_OPTIONS} value={filterType} onChange={setFilterType} placeholder="סוג" />
        <CustomSelect options={DIRECTION_OPTIONS} value={filterDirection} onChange={setFilterDirection} placeholder="כיוון" />
        <input type="date" className="form-input input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }} />
        <input type="date" className="form-input input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }} />
      </div>
      <input
        type="search"
        placeholder="חיפוש בהערות..."
        className="form-input input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
      />
    </div>
  )

  if (loading && !items.length) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>טוען פעילות...</p>
  }

  if (!items.length) {
    return (
      <>
        {filterBar}
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>אין רשומות פעילות</p>
      </>
    )
  }

  return (
    <>
      {filterBar}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, i) => {
          const editable = item.source === 'activity_log' && item.id && !String(item.id).includes('-')
          const dir = item.direction
          return (
            <div
              key={`${item.id}-${i}`}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 0',
                borderBottom: i < items.length - 1 ? '1px solid var(--border, rgba(255,255,255,0.08))' : 'none',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <TypeIcon type={item.activity_type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {TYPE_LABELS[item.activity_type] || item.activity_type}
                  </span>
                  {dir && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: dir === 'inbound' ? 'rgba(59,130,246,0.15)' : 'rgba(0,195,122,0.15)',
                        color: dir === 'inbound' ? '#3b82f6' : ACCENT,
                      }}
                    >
                      {dir === 'inbound' ? 'נכנס' : 'יצא'}
                    </span>
                  )}
                  {item.outcome && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--v2-dark-3, rgba(255,255,255,0.05))', color: 'var(--text-secondary)' }}>
                      {item.outcome}
                    </span>
                  )}
                  {item.follow_up_date && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                      המשך: {new Date(item.follow_up_date).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </div>
                {item.note && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                    {linkifyText(item.note)}
                  </div>
                )}
                {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {item.attachments.map((att, j) => (
                      att.url ? (
                        <a
                          key={j}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: 'rgba(0,195,122,0.12)',
                            color: ACCENT,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={12} />
                          {att.label || att.url}
                        </a>
                      ) : null
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
                    : '—'}
                  {item.created_by_name && (
                    <span style={{ marginRight: 8 }}> · {item.created_by_name}</span>
                  )}
                </div>
              </div>
              {editable && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setEditItem(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, WebkitTapHighlightColor: 'transparent' }}
                    aria-label="ערוך"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', WebkitTapHighlightColor: 'transparent' }}
                    aria-label="מחק"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="מחיקת פעילות"
        message="למחוק רשומה זו?"
        danger
        confirmLabel="מחק"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ActivityLogModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        recipientId={recipientId}
        editItem={editItem}
        projectId={projectId}
        onSaved={onSaved}
      />
    </>
  )
}

export { ActivityTimeline }
