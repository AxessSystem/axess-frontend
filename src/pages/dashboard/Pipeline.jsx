import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, Phone, Calendar, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { fetchWithAuth } from '@/lib/supabase'
import CustomSelect from '@/components/ui/CustomSelect'
import ActivityLogModal from '@/components/ActivityLogModal'

const ACCENT = '#00C37A'

const CRM_STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'new_lead', label: 'ליד חדש' },
  { value: 'in_treatment', label: 'בטיפול' },
  { value: 'waiting_callback', label: 'ממתין לחזרה' },
  { value: 'meeting_scheduled', label: 'פגישה נקבעה' },
  { value: 'proposal_sent', label: 'הצעה נשלחה' },
  { value: 'completed', label: 'הושלם' },
  { value: 'lost', label: 'אבוד' },
]

const CRM_STATUS_INLINE = CRM_STATUS_OPTIONS.filter((o) => o.value)

const PROJECT_TYPE_OPTIONS = [
  { value: '', label: 'כל הסוגים' },
  { value: 'event_production', label: 'הפקת אירוע' },
  { value: 'content_sale', label: 'מכירת תוכן' },
  { value: 'b2b_service', label: 'שירות B2B' },
  { value: 'b2c_service', label: 'שירות B2C' },
  { value: 'venue_marketing', label: 'שיווק מקום' },
  { value: 'concept', label: 'קונסепט' },
  { value: 'other', label: 'אחר' },
]

const PROJECT_TYPE_CREATE = PROJECT_TYPE_OPTIONS.filter((o) => o.value)

const ROLE_LABELS = {
  customer: 'לקוח',
  supplier: 'ספק',
  partner: 'שותף',
  colleague: 'עמית',
  lead: 'ליד',
  other: 'אחר',
}

const CRM_COLORS = {
  new_lead: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  in_treatment: { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  waiting_callback: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  meeting_scheduled: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  proposal_sent: { bg: 'rgba(14,165,233,0.15)', color: '#0ea5e9' },
  completed: { bg: 'rgba(0,195,122,0.15)', color: ACCENT },
  lost: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
}

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'היום' },
  { value: 'week', label: 'השבוע' },
  { value: 'month', label: 'החודש' },
  { value: 'all', label: 'הכל' },
]

const ACTIVITY_LABELS = {
  meeting: 'פגישה',
  call: 'שיחה',
  note: 'הערה',
  email: 'אימייל',
  document_sent: 'מסמך נשלח',
  document_received: 'מסמך התקבל',
  task: 'משימה',
  message: 'הודעה',
  lead_captured: 'ליד נקלט',
}

function getDateRange(range) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fmt = (d) => d.toISOString().slice(0, 10)
  if (range === 'today') return { date_from: fmt(today), date_to: fmt(today) }
  if (range === 'week') {
    const start = new Date(today)
    start.setDate(start.getDate() - start.getDay())
    return { date_from: fmt(start), date_to: fmt(today) }
  }
  if (range === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { date_from: fmt(start), date_to: fmt(today) }
  }
  return {}
}

function followUpDisplay(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / 86400000)
  if (diff < 0) return { text: `איחור ${Math.abs(diff)} ימים`, color: '#ef4444' }
  if (diff === 0) return { text: 'היום', color: '#f97316' }
  return { text: d.toLocaleDateString('he-IL'), color: 'var(--text-secondary)' }
}

function countByStatus(stats, status) {
  return stats?.by_status?.find((s) => s.crm_status === status)?.count || 0
}

export default function Pipeline() {
  const allowed = useRequirePermission('can_view_pipeline')
  const { businessId, hasPermission } = useAuth()
  const navigate = useNavigate()
  const canManage = hasPermission('can_manage_pipeline')

  const [stats, setStats] = useState(null)
  const [queue, setQueue] = useState([])
  const [projects, setProjects] = useState([])
  const [staff, setStaff] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStaff, setFilterStaff] = useState('')
  const [filterDateRange, setFilterDateRange] = useState('all')

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '', project_type: 'other', description: '', start_date: '', end_date: '', owner_id: '', event_page_id: '',
  })
  const [savingProject, setSavingProject] = useState(false)

  const [activityModal, setActivityModal] = useState(null)
  const [statusEditing, setStatusEditing] = useState(null)

  const projectOptions = useMemo(
    () => [{ value: '', label: 'כל הפרויקטים' }, ...projects.map((p) => ({ value: p.id, label: p.name }))],
    [projects]
  )

  const staffOptions = useMemo(
    () => [{ value: '', label: 'כל הצוות' }, ...staff.map((s) => ({ value: s.id, label: s.full_name || s.email || s.id }))],
    [staff]
  )

  const eventOptions = useMemo(
    () => events.map((e) => ({ value: e.id, label: `${e.title || 'אירוע'}${e.date ? ` (${String(e.date).slice(0, 10)})` : ''}` })),
    [events]
  )

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/projects/pipeline/stats')
      if (data?.error) throw new Error(data.error)
      setStats(data)
    } catch (err) {
      toast.error(err.message || 'שגיאה בטעינת סטטיסטיקות')
    }
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterProject) params.set('project_id', filterProject)
      if (filterStatus) params.set('crm_status', filterStatus)
      if (filterStaff) params.set('assigned_to', filterStaff)
      const dr = getDateRange(filterDateRange)
      if (dr.date_from) params.set('date_from', dr.date_from)
      if (dr.date_to) params.set('date_to', dr.date_to)

      const data = await fetchWithAuth(`/api/projects/pipeline/queue?${params}`)
      if (data?.error) throw new Error(data.error)
      let items = data.items || []
      if (filterType) items = items.filter((i) => i.project_type === filterType)
      setQueue(items)
    } catch (err) {
      toast.error(err.message || 'שגיאה בטעינת תור')
    }
  }, [filterProject, filterStatus, filterType, filterStaff, filterDateRange])

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/projects')
      if (data?.error) throw new Error(data.error)
      setProjects(data.projects || [])
    } catch (err) {
      /* tables may not exist yet */
    }
  }, [])

  useEffect(() => {
    if (!allowed || !businessId) return
    setLoading(true)
    Promise.all([
      loadStats(),
      loadQueue(),
      loadProjects(),
      fetchWithAuth(`/api/staff?business_id=${businessId}`).then((d) => setStaff(Array.isArray(d) ? d : d?.members || [])).catch(() => {}),
      fetchWithAuth(`/api/admin/events?business_id=${businessId}`).then((d) => setEvents(Array.isArray(d) ? d : d?.events || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [allowed, businessId, loadStats, loadQueue, loadProjects])

  useEffect(() => {
    if (!allowed || !businessId) return
    loadQueue()
  }, [filterProject, filterStatus, filterType, filterStaff, filterDateRange, allowed, businessId, loadQueue])

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) {
      toast.error('יש להזין שם פרויקט')
      return
    }
    setSavingProject(true)
    try {
      const payload = {
        name: projectForm.name.trim(),
        project_type: projectForm.project_type,
        description: projectForm.description || undefined,
        start_date: projectForm.start_date || undefined,
        end_date: projectForm.end_date || undefined,
        owner_id: projectForm.owner_id || undefined,
        event_page_id: projectForm.project_type === 'event_production' ? projectForm.event_page_id || undefined : undefined,
      }
      const data = await fetchWithAuth('/api/projects', { method: 'POST', body: JSON.stringify(payload) })
      if (data?.error) throw new Error(data.error)
      toast.success('פרויקט נוצר')
      setProjects((prev) => [data.project, ...prev])
      setShowProjectModal(false)
      setProjectForm({ name: '', project_type: 'other', description: '', start_date: '', end_date: '', owner_id: '', event_page_id: '' })
      loadStats()
      loadQueue()
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setSavingProject(false)
    }
  }

  const handleStatusChange = async (item, newStatus) => {
    if (!canManage) return
    try {
      const data = await fetchWithAuth(`/api/projects/${item.project_id}/contacts/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ crm_status: newStatus }),
      })
      if (data?.error) throw new Error(data.error)
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, crm_status: newStatus } : q)))
      loadStats()
      toast.success('סטטוס עודכן')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setStatusEditing(null)
    }
  }

  if (!allowed) return null

  const statCards = [
    { label: 'לידים חדשים', value: stats?.new_leads_24h ?? 0, color: '#3b82f6' },
    { label: 'בטיפול', value: countByStatus(stats, 'in_treatment'), color: '#f97316' },
    { label: 'ממתינים לחזרה', value: countByStatus(stats, 'waiting_callback'), color: '#ef4444' },
    { label: 'הושלמו', value: countByStatus(stats, 'completed'), color: ACCENT },
  ]

  const btnStyle = {
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    padding: '10px 16px',
  }

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)', WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={24} color={ACCENT} />
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800, margin: 0 }}>Pipeline</h1>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 8, background: ACCENT, color: '#000' }}
          >
            <Plus size={16} />
            פרויקט חדש
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {statCards.map((c) => (
          <div
            key={c.label}
            style={{
              background: 'var(--v2-dark-3, var(--card))',
              border: '1px solid var(--glass-border, var(--border))',
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 20 }}>
        <CustomSelect options={projectOptions} value={filterProject} onChange={setFilterProject} placeholder="פרויקט" />
        <CustomSelect options={CRM_STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} placeholder="סטטוס" />
        <CustomSelect options={PROJECT_TYPE_OPTIONS} value={filterType} onChange={setFilterType} placeholder="סוג" />
        <CustomSelect options={staffOptions} value={filterStaff} onChange={setFilterStaff} placeholder="צוות" />
        <CustomSelect options={DATE_RANGE_OPTIONS} value={filterDateRange} onChange={setFilterDateRange} placeholder="תאריך" />
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="spin" />
          טוען...
        </div>
      ) : queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>אין פריטים בתור</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {queue.map((item) => {
            const name = [item.first_name, item.last_name].filter(Boolean).join(' ') || 'לא צוין'
            const crmStyle = CRM_COLORS[item.crm_status] || CRM_COLORS.new_lead
            const fu = followUpDisplay(item.follow_up_date)
            const lastAct = item.last_activity

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/contacts/${item.master_recipient_id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/dashboard/contacts/${item.master_recipient_id}`)}
                style={{
                  background: 'var(--v2-dark-3, var(--card))',
                  border: '1px solid var(--glass-border, var(--border))',
                  borderRadius: 12,
                  padding: 16,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(0,195,122,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: ACCENT,
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      name[0]
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{name}</span>
                      {item.phone && (
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }} dir="ltr">
                          <Phone size={12} />
                          {item.phone}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{item.project_name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                        {PROJECT_TYPE_CREATE.find((o) => o.value === item.project_type)?.label || item.project_type}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                        {ROLE_LABELS[item.role] || item.role}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: crmStyle.bg, color: crmStyle.color }}>
                        {CRM_STATUS_INLINE.find((o) => o.value === item.crm_status)?.label || item.crm_status}
                      </span>
                      {(item.priority === 'urgent' || item.priority === 'high') && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          {item.priority === 'urgent' ? 'דחוף' : 'גבוה'}
                        </span>
                      )}
                      {fu && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, color: fu.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} />
                          {fu.text}
                        </span>
                      )}
                    </div>
                    {lastAct?.created_at && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        פעילות אחרונה: {ACTIVITY_LABELS[lastAct.activity_type] || lastAct.activity_type}{' '}
                        · {new Date(lastAct.created_at).toLocaleDateString('he-IL')}
                      </div>
                    )}
                    {item.assigned_to_name && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>אחראי: {item.assigned_to_name}</div>
                    )}
                  </div>
                </div>

                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border, rgba(255,255,255,0.08))' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    style={{ ...btnStyle, background: 'rgba(0,195,122,0.15)', color: ACCENT }}
                    onClick={() => setActivityModal({
                      recipientId: item.master_recipient_id,
                      recipientName: name,
                      projectId: item.project_id,
                      projectContactId: item.id,
                    })}
                  >
                    תיעד פעילות
                  </button>
                  {canManage && (
                    statusEditing === item.id ? (
                      <div style={{ minWidth: 160 }}>
                        <CustomSelect
                          options={CRM_STATUS_INLINE}
                          value={item.crm_status}
                          onChange={(v) => handleStatusChange(item, v)}
                          style={{ fontSize: 13 }}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        style={{ ...btnStyle, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
                        onClick={() => setStatusEditing(item.id)}
                      >
                        עדכן סטטוס
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showProjectModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowProjectModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--v2-dark-2, var(--card))',
              borderRadius: '16px 16px 0 0',
              width: 'min(520px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 20,
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>פרויקט חדש</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>שם פרויקט *</label>
                <input
                  className="form-input input"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>סוג</label>
                <CustomSelect
                  options={PROJECT_TYPE_CREATE}
                  value={projectForm.project_type}
                  onChange={(v) => setProjectForm((f) => ({ ...f, project_type: v, event_page_id: v === 'event_production' ? f.event_page_id : '' }))}
                />
              </div>
              {projectForm.project_type === 'event_production' && (
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>אירוע מקושר</label>
                  <CustomSelect
                    options={eventOptions}
                    value={projectForm.event_page_id}
                    onChange={(v) => setProjectForm((f) => ({ ...f, event_page_id: v }))}
                    placeholder="בחר אירוע..."
                  />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>תיאור</label>
                <textarea
                  className="form-input input"
                  rows={2}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>תאריך התחלה</label>
                  <input type="date" className="form-input input" value={projectForm.start_date} onChange={(e) => setProjectForm((f) => ({ ...f, start_date: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>תאריך סיום</label>
                  <input type="date" className="form-input input" value={projectForm.end_date} onChange={(e) => setProjectForm((f) => ({ ...f, end_date: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>אחראי</label>
                <CustomSelect
                  options={staffOptions.filter((o) => o.value)}
                  value={projectForm.owner_id}
                  onChange={(v) => setProjectForm((f) => ({ ...f, owner_id: v }))}
                  placeholder="בחר..."
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" disabled={savingProject} onClick={handleCreateProject} style={{ ...btnStyle, flex: 1, background: ACCENT, color: '#000', opacity: savingProject ? 0.6 : 1 }}>
                  {savingProject ? 'שומר...' : 'צור פרויקט'}
                </button>
                <button type="button" onClick={() => setShowProjectModal(false)} style={{ ...btnStyle, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ActivityLogModal
        isOpen={!!activityModal}
        onClose={() => setActivityModal(null)}
        recipientId={activityModal?.recipientId}
        recipientName={activityModal?.recipientName}
        projectId={activityModal?.projectId}
        projectContactId={activityModal?.projectContactId}
        onSaved={() => {
          loadQueue()
          loadStats()
          setActivityModal(null)
        }}
      />
    </div>
  )
}
