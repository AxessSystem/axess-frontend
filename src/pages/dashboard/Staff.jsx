import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Edit3,
  Trash2,
  UserPlus,
  Users,
  Pause,
  Copy,
  Mail,
  MessageCircle,
  Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

/** Presets for invite dropdown + default permission preview */
export const ROLE_PRESETS = [
  { value: 'owner', label: 'בעלים', color: '#eab308', permissions: { can_manage_staff: true, can_edit_events: true, can_send_campaigns: true, can_view_reports: true } },
  { value: 'manager', label: 'מנהל', color: '#a855f7', permissions: { can_manage_staff: false, can_edit_events: true, can_send_campaigns: true, can_view_reports: true } },
  { value: 'division_head', label: 'ראש מחלקה', color: '#6366f1', permissions: { can_view_inbox: true, can_reply_inbox: true, can_view_campaigns: true, can_create_campaigns: true, can_send_campaigns: true, can_view_events: true, can_manage_events: true, can_scan: true, can_view_audiences: true, can_manage_audiences: true, can_view_reports: true, can_export_data: true, can_manage_sub_accounts: true } },
  { value: 'department_manager', label: 'מנהל מחלקה', color: '#8b5cf6', permissions: { can_view_inbox: true, can_reply_inbox: true, can_view_events: true, can_manage_events: true, can_scan: true, can_view_audiences: true, can_manage_audiences: true, can_view_reports: true, can_approve_registrations: true } },
  { value: 'coordinator', label: 'רכז', color: '#22c55e', permissions: { can_view_events: true, can_manage_events: true, can_scan: true, can_view_audiences: true } },
  { value: 'inbox_agent', label: 'סוכן אינבוקס', color: '#14b8a6', permissions: { can_view_inbox: true, can_reply_inbox: true } },
  { value: 'event_producer', label: 'מפיק אירועים', color: '#06b6d4', permissions: { can_view_events: true, can_manage_events: true, can_scan: true } },
  { value: 'campaign_manager', label: 'מנהל קמפיינים', color: '#f97316', permissions: { can_view_campaigns: true, can_create_campaigns: true, can_send_campaigns: true, can_view_audiences: true } },
  { value: 'scanner', label: 'סורק', color: '#64748b', permissions: { can_scan: true } },
  { value: 'analyst', label: 'אנליסט', color: '#3b82f6', permissions: { can_view_reports: true, can_view_audiences: true, can_view_campaigns: true, can_view_events: true } },
  { value: 'external_auditor', label: 'ביקורת חיצונית', color: '#78716c', permissions: { can_view_reports: true, can_view_events: true } },
  { value: 'event_manager', label: 'מנהל אירועים (legacy)', color: '#0ea5e9', permissions: { can_edit_events: true, can_scan_tickets: true } },
  { value: 'viewer', label: 'צופה', color: '#94a3b8', permissions: { can_view_reports: true } },
]

const PERMISSION_LABELS = {
  can_view_inbox: 'אינבוקס',
  can_reply_inbox: 'מענה אינבוקס',
  can_view_events: 'צפייה באירועים',
  can_manage_events: 'ניהול אירועים',
  can_scan: 'סריקה',
  can_view_campaigns: 'קמפיינים',
  can_create_campaigns: 'יצירת קמפיין',
  can_send_campaigns: 'שליחת קמפיין',
  can_view_audiences: 'קהלים',
  can_manage_audiences: 'ניהול קהלים',
  can_view_reports: 'דוחות',
  can_export_data: 'ייצוא',
  can_manage_sub_accounts: 'מחלקות משנה',
  can_approve_registrations: 'אישור הרשמות',
  can_edit_events: 'עריכת אירועים',
  can_view_revenue: 'הכנסות',
  can_manage_promoters: 'יחצ"נים',
  can_manage_staff: 'ניהול צוות',
  can_manage_tables: 'שולחנות',
  can_scan_tickets: 'סריקת כרטיסים',
}

/** הרשאות לפי תפקיד — מודאל הזמנה בלבד */
const ROLE_PERMISSIONS = {
  manager: { can_view_inbox: true, can_reply_inbox: true, can_view_campaigns: true, can_create_campaigns: true, can_send_campaigns: true, can_view_events: true, can_manage_events: true, can_view_audiences: true, can_manage_audiences: true, can_view_reports: true },
  inbox_agent: { can_view_inbox: true, can_reply_inbox: true },
  event_producer: { can_view_events: true, can_manage_events: true, can_scan: true },
  campaign_manager: { can_view_campaigns: true, can_create_campaigns: true, can_send_campaigns: true, can_view_audiences: true },
  scanner: { can_scan: true },
  analyst: { can_view_reports: true, can_view_audiences: true, can_view_campaigns: true, can_view_events: true },
  coordinator: { can_view_events: true, can_manage_events: true, can_scan: true, can_view_audiences: true },
  division_head: { can_view_inbox: true, can_reply_inbox: true, can_view_campaigns: true, can_create_campaigns: true, can_send_campaigns: true, can_view_events: true, can_manage_events: true, can_scan: true, can_view_audiences: true, can_manage_audiences: true, can_view_reports: true, can_export_data: true, can_manage_sub_accounts: true },
  department_manager: { can_view_inbox: true, can_reply_inbox: true, can_view_events: true, can_manage_events: true, can_scan: true, can_view_audiences: true, can_manage_audiences: true, can_view_reports: true, can_approve_registrations: true },
  external_auditor: { can_view_reports: true, can_view_events: true },
}

const ALL_PERMISSION_KEYS = Array.from(
  new Set(ROLE_PRESETS.flatMap((r) => Object.keys(r.permissions || {})).concat(Object.keys(PERMISSION_LABELS)))
).filter((k) => PERMISSION_LABELS[k])

function parseJsonObj(v) {
  if (!v) return {}
  if (typeof v === 'object' && !Array.isArray(v)) return v
  try {
    return JSON.parse(v)
  } catch {
    return {}
  }
}

function effectivePerm(member, key) {
  const custom = parseJsonObj(member.permissions)
  const role = parseJsonObj(member.role_permissions)
  if (Object.prototype.hasOwnProperty.call(custom, key)) return !!custom[key]
  return !!role[key]
}

function statusBadge(status) {
  const s = status || 'active'
  if (s === 'active') return { text: 'פעיל', bg: 'rgba(34,197,94,0.2)', color: '#4ade80' }
  if (s === 'pending') return { text: 'ממתין', bg: 'rgba(234,179,8,0.2)', color: '#facc15' }
  if (s === 'suspended') return { text: 'מושהה', bg: 'rgba(248,113,113,0.2)', color: '#f87171' }
  return { text: s, bg: 'rgba(148,163,184,0.2)', color: '#94a3b8' }
}

function roleColor(role) {
  return ROLE_PRESETS.find((r) => r.value === role)?.color || '#94a3b8'
}

function logIcon(actionType) {
  const a = (actionType || '').toLowerCase()
  if (a.includes('send') || a.includes('שליח')) return '📤'
  if (a.includes('delete') || a.includes('מחיק')) return '🗑️'
  if (a.includes('login') || a.includes('כניס')) return '🔑'
  return '✏️'
}

export default function Staff() {
  const staffAllowed = useRequirePermission('can_manage_staff')
  const { session, businessId } = useAuth()
  const [tab, setTab] = useState(0)
  const [staff, setStaff] = useState([])
  const [logs, setLogs] = useState([])
  const [subAccounts, setSubAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRole, setInviteRole] = useState('coordinator')
  const [inviteCustomRole, setInviteCustomRole] = useState('')
  const [inviteSubIds, setInviteSubIds] = useState([])
  const [inviteValidMode, setInviteValidMode] = useState('forever')
  const [inviteValidDate, setInviteValidDate] = useState('')
  const [inviteCustomMode, setInviteCustomMode] = useState(false)
  const [inviteCustomPerms, setInviteCustomPerms] = useState({})
  const [lastInviteLink, setLastInviteLink] = useState('')

  const [logFilterUser, setLogFilterUser] = useState('')
  const [logFilterAction, setLogFilterAction] = useState('')
  const [logFilterFrom, setLogFilterFrom] = useState('')
  const [logFilterTo, setLogFilterTo] = useState('')

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId,
  }), [session?.access_token, businessId])

  const loadStaff = useCallback(async () => {
    if (!businessId || !session?.access_token) return
    setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/staff`, { headers: authHeaders() })
      const data = await r.json()
      setStaff(Array.isArray(data.staff) ? data.staff : [])
    } catch {
      setStaff([])
    } finally {
      setLoading(false)
    }
  }, [businessId, session?.access_token, authHeaders])

  const loadLogs = useCallback(() => {
    if (!businessId) return
    setLogsLoading(true)
    const q = new URLSearchParams()
    if (logFilterUser) q.set('user_id', logFilterUser)
    if (logFilterAction) q.set('action_type', logFilterAction)
    if (logFilterFrom) q.set('from', logFilterFrom)
    if (logFilterTo) q.set('to', logFilterTo)
    const qs = q.toString()
    fetch(`${API_BASE}/api/staff/activity-log${qs ? `?${qs}` : ''}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data.logs) ? data.logs : []))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false))
  }, [businessId, authHeaders, logFilterUser, logFilterAction, logFilterFrom, logFilterTo])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  useEffect(() => {
    if (!businessId) return
    fetch(`${API_BASE}/api/admin/sub-accounts?parent_business_id=${businessId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSubAccounts)
      .catch(() => setSubAccounts([]))
  }, [businessId])

  useEffect(() => {
    if (tab === 2) loadLogs()
  }, [tab, loadLogs])

  const onInviteRoleChange = (role) => {
    setInviteRole(role)
    setInviteCustomPerms(ROLE_PERMISSIONS[role] || {})
    setInviteCustomMode(false)
  }

  const openInvite = () => {
    setInviteName('')
    setInviteEmail('')
    setInvitePhone('')
    setInviteRole('')
    setInviteCustomRole('')
    setInviteSubIds([])
    setInviteValidMode('forever')
    setInviteValidDate('')
    setInviteCustomMode(false)
    setInviteCustomPerms({})
    setLastInviteLink('')
    setInviteOpen(true)
  }

  const handleInviteSubmit = async (mode) => {
    if (!inviteRole) {
      toast.error('בחר תפקיד')
      return
    }
    if (!inviteEmail.trim() && !invitePhone.trim()) {
      toast.error('הכנס מייל או טלפון')
      return
    }
    setSubmitting(true)
    try {
      const valid_until =
        inviteValidMode === 'until' && inviteValidDate ? new Date(inviteValidDate).toISOString() : null
      const res = await fetch(`${API_BASE}/api/staff/invite`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          email: inviteEmail.trim() || undefined,
          phone: invitePhone.trim() || undefined,
          role: inviteRole,
          custom_role: inviteCustomRole.trim() || undefined,
          sub_account_ids: inviteSubIds,
          valid_until,
          custom_permissions: inviteCustomPerms,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      const link = data.invite_link || ''
      setLastInviteLink(link)
      toast.success('ההזמנה נוצרה')
      loadStaff()

      if (mode === 'wa' && invitePhone.trim() && link) {
        const text = encodeURIComponent(`הוזמנת ל-AXESS. הצטרפות: ${link}`)
        const digits = invitePhone.replace(/\D/g, '')
        const wa = digits.startsWith('972') ? digits : digits.startsWith('0') ? `972${digits.slice(1)}` : digits
        window.open(`https://wa.me/${wa}?text=${text}`, '_blank')
      }
      if (mode === 'email' && inviteEmail.trim() && link) {
        window.location.href = `mailto:${inviteEmail.trim()}?subject=${encodeURIComponent('הזמנה ל-AXESS')}&body=${encodeURIComponent(`היי,\n\nהצטרפות לצוות: ${link}`)}`
      }
      if (mode === 'copy' && link) {
        await navigator.clipboard.writeText(link)
        toast.success('הקישור הועתק')
      }
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePatchMember = async (id, body) => {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/staff/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      toast.success('עודכן')
      loadStaff()
      setEditMember(null)
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (m) => {
    if (!confirm('להסיר את חבר הצוות?')) return
    try {
      const res = await fetch(`${API_BASE}/api/staff/${m.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || d.message || 'שגיאה')
      toast.success('הוסר')
      setStaff((prev) => prev.filter((x) => x.id !== m.id))
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const toggleMatrixCell = (member, key) => {
    const cur = parseJsonObj(member.permissions)
    const next = { ...cur, [key]: !effectivePerm(member, key) }
    handlePatchMember(member.id, { permissions: next })
  }

  const uniqueLogUsers = useMemo(() => {
    const m = new Map()
    logs.forEach((l) => {
      if (l.user_id) m.set(l.user_id, l.user_name || l.user_id)
    })
    return [...m.entries()]
  }, [logs])

  const uniqueLogActions = useMemo(() => {
    const s = new Set()
    logs.forEach((l) => {
      if (l.action_type) s.add(l.action_type)
    })
    return [...s]
  }, [logs])

  if (!staffAllowed) return null

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800 }}>צוות</h1>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
            borderBottom: '1px solid var(--glass-border)',
            paddingBottom: 16,
          }}
        >
          {[
            { id: 0, label: 'אנשי צוות' },
            { id: 1, label: 'הרשאות' },
            { id: 2, label: 'לוג פעילות' },
          ].map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `1px solid ${active ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
                  background: active ? 'rgba(0,195,122,0.12)' : 'transparent',
                  color: active ? '#fff' : 'var(--v2-gray-400)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              type="button"
              onClick={openInvite}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--v2-primary)',
                color: 'var(--v2-dark)',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={18} /> הזמן איש צוות
            </button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
          ) : staff.length === 0 ? (
            <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center' }}>
              <Users size={40} style={{ color: 'var(--v2-gray-400)', marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>אין חברי צוות</div>
              <button type="button" onClick={openInvite} className="btn-primary" style={{ marginTop: 16 }}>
                הזמן איש צוות
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {staff.map((m) => {
                const sb = statusBadge(m.status)
                const initials = (m.full_name || m.email || '?').charAt(0).toUpperCase()
                const deptIds = Array.isArray(m.sub_account_ids) ? m.sub_account_ids : []
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 16,
                      padding: 16,
                      background: 'var(--v2-dark-3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'rgba(0,195,122,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          fontWeight: 800,
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{m.full_name || m.email || '—'}</div>
                      <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', direction: 'ltr', textAlign: 'right' }}>{m.email || '—'}</div>
                      {m.phone && (
                        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', direction: 'ltr', textAlign: 'right' }}>{m.phone}</div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: `${roleColor(m.role)}22`,
                            color: roleColor(m.role),
                          }}
                        >
                          {ROLE_PRESETS.find((r) => r.value === m.role)?.label || m.role}
                          {m.custom_role ? ` · ${m.custom_role}` : ''}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: sb.bg, color: sb.color }}>{sb.text}</span>
                      </div>
                      {deptIds.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {deptIds.map((id) => {
                            const sa = subAccounts.find((s) => s.id === id)
                            return (
                              <span
                                key={id}
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid var(--glass-border)',
                                }}
                              >
                                {sa?.department_name || id.slice(0, 8)}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      {m.valid_until && (
                        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 6 }}>
                          תוקף עד: {new Date(m.valid_until).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEditMember(m)}
                        style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                        title="ערוך"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePatchMember(m.id, { is_active: m.status === 'suspended' })}
                        style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                        title={m.status === 'suspended' ? 'הפעל' : 'השהה'}
                      >
                        <Pause size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(m)}
                        style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer', color: '#f87171' }}
                        title="הסר"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 1 && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', background: 'var(--v2-dark-3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: 12, textAlign: 'right', position: 'sticky', right: 0, background: 'var(--v2-dark-3)', zIndex: 1 }}>חבר צוות</th>
                {ALL_PERMISSION_KEYS.map((k) => (
                  <th key={k} style={{ padding: 8, textAlign: 'center', minWidth: 72, color: 'var(--v2-gray-400)', fontWeight: 600 }}>
                    {PERMISSION_LABELS[k] || k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: 12, fontWeight: 600, position: 'sticky', right: 0, background: 'var(--v2-dark-3)' }}>
                    {m.full_name || m.email || m.id.slice(0, 8)}
                  </td>
                  {ALL_PERMISSION_KEYS.map((k) => (
                    <td key={k} style={{ textAlign: 'center', padding: 6 }}>
                      <button
                        type="button"
                        onClick={() => toggleMatrixCell(m, k)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 18,
                          padding: 4,
                        }}
                        title="לחץ לשינוי"
                      >
                        {effectivePerm(m, k) ? '✅' : '❌'}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
              padding: 16,
              background: 'var(--v2-dark-3)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              alignItems: 'center',
            }}
          >
            <Filter size={18} style={{ color: 'var(--v2-gray-400)' }} />
            <select className="input" style={{ minWidth: 160 }} value={logFilterUser} onChange={(e) => setLogFilterUser(e.target.value)}>
              <option value="">כל המשתמשים</option>
              {uniqueLogUsers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select className="input" style={{ minWidth: 160 }} value={logFilterAction} onChange={(e) => setLogFilterAction(e.target.value)}>
              <option value="">כל סוגי הפעולות</option>
              {uniqueLogActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <input className="input" type="datetime-local" value={logFilterFrom} onChange={(e) => setLogFilterFrom(e.target.value)} />
            <input className="input" type="datetime-local" value={logFilterTo} onChange={(e) => setLogFilterTo(e.target.value)} />
            <button type="button" className="btn-primary" onClick={loadLogs} style={{ padding: '8px 16px' }}>
              החל
            </button>
          </div>
          {logsLoading ? (
            <div style={{ color: 'var(--v2-gray-400)' }}>טוען לוג...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: 'var(--v2-gray-400)' }}>אין רשומות פעילות</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logs.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: 14,
                    background: 'var(--v2-dark-3)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{logIcon(l.action_type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{l.user_name || l.user_id || 'מערכת'}</div>
                    <div style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>
                      {l.action_type}
                      {l.entity_name ? ` · ${l.entity_name}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString('he-IL') : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {inviteOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => !submitting && setInviteOpen(false)}
        >
          <div
            dir="rtl"
            style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>הזמנת איש צוות</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">שם</label>
                <input className="input" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="שם לתצוגה" />
              </div>
              <div>
                <label className="label">מייל</label>
                <input className="input" dir="ltr" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <label className="label">טלפון</label>
                <input className="input" dir="ltr" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="05XXXXXXXX" />
              </div>
              <div>
                <label className="label">תפקיד</label>
                <select
                  value={inviteRole}
                  onChange={(e) => onInviteRoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontSize: 14,
                  }}
                >
                  <option value="">בחר תפקיד</option>
                  <option value="manager">מנהל</option>
                  <option value="inbox_agent">נציג שירות</option>
                  <option value="event_producer">מפיק אירועים</option>
                  <option value="campaign_manager">מנהל קמפיינים</option>
                  <option value="scanner">סורק</option>
                  <option value="analyst">אנליסט</option>
                  <option value="coordinator">רכז</option>
                  <option value="division_head">מנהל אגף</option>
                  <option value="department_manager">מנהל מחלקה</option>
                  <option value="external_auditor">צופה חיצוני</option>
                </select>
              </div>
              <div>
                <label className="label">כותרת מותאמת (אופציונלי)</label>
                <input className="input" value={inviteCustomRole} onChange={(e) => setInviteCustomRole(e.target.value)} placeholder="תפקיד חופשי" />
              </div>
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={inviteCustomMode}
                    onChange={(e) => {
                      const v = e.target.checked
                      setInviteCustomMode(v)
                      if (!v && inviteRole) setInviteCustomPerms({ ...ROLE_PERMISSIONS[inviteRole] })
                    }}
                  />
                  התאמה אישית של הרשאות
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginTop: 8,
                    opacity: inviteCustomMode ? 1 : 0.5,
                  }}
                >
                  {inviteRole
                    ? Object.keys(ROLE_PERMISSIONS[inviteRole] || {}).map((key) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={!!inviteCustomPerms[key]}
                            disabled={!inviteCustomMode}
                            onChange={(e) => setInviteCustomPerms((prev) => ({ ...prev, [key]: e.target.checked }))}
                          />
                          {PERMISSION_LABELS[key] || key}
                        </label>
                      ))
                    : (
                      <span style={{ fontSize: 13, color: 'var(--v2-gray-400)', gridColumn: '1 / -1' }}>בחר תפקיד כדי לראות הרשאות</span>
                    )}
                </div>
              </div>
              {subAccounts.length > 0 && (
                <div>
                  <label className="label">מחלקות</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflow: 'auto' }}>
                    {subAccounts.map((sa) => (
                      <label key={sa.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={inviteSubIds.includes(sa.id)}
                          onChange={(e) => {
                            if (e.target.checked) setInviteSubIds((p) => [...p, sa.id])
                            else setInviteSubIds((p) => p.filter((x) => x !== sa.id))
                          }}
                        />
                        {sa.department_name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="label">תוקף חברות</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <input type="radio" name="vm" checked={inviteValidMode === 'forever'} onChange={() => setInviteValidMode('forever')} />
                    קבוע
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <input type="radio" name="vm" checked={inviteValidMode === 'until'} onChange={() => setInviteValidMode('until')} />
                    עד תאריך
                  </label>
                  {inviteValidMode === 'until' && <input className="input" type="date" value={inviteValidDate} onChange={(e) => setInviteValidDate(e.target.value)} />}
                </div>
              </div>
              {lastInviteLink && (
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left' }}>{lastInviteLink}</div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setInviteOpen(false)} disabled={submitting} style={{ padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
                סגור
              </button>
              <button type="button" onClick={() => handleInviteSubmit('wa')} disabled={submitting || !invitePhone.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
                <MessageCircle size={16} /> שלח WA
              </button>
              <button type="button" onClick={() => handleInviteSubmit('email')} disabled={submitting || !inviteEmail.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
                <Mail size={16} /> שלח מייל
              </button>
              <button type="button" onClick={() => handleInviteSubmit('copy')} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
                <Copy size={16} /> העתק לינק
              </button>
              <button type="button" onClick={() => handleInviteSubmit('none')} disabled={submitting} className="btn-primary" style={{ padding: '10px 18px' }}>
                {submitting ? '...' : 'צור הזמנה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editMember && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => !submitting && setEditMember(null)}
        >
          <div dir="rtl" style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 400, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>עריכת חבר צוות</h3>
            <label className="label">תפקיד</label>
            <select className="input" style={{ marginBottom: 12 }} value={editMember.role} onChange={(e) => setEditMember({ ...editMember, role: e.target.value })}>
              {ROLE_PRESETS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <label className="label">תפקיד מותאם</label>
            <input className="input" style={{ marginBottom: 12 }} value={editMember.custom_role || ''} onChange={(e) => setEditMember({ ...editMember, custom_role: e.target.value })} />
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={submitting}
              onClick={() =>
                handlePatchMember(editMember.id, {
                  role: editMember.role,
                  custom_role: editMember.custom_role || null,
                })
              }
            >
              שמור
            </button>
            <button type="button" onClick={() => setEditMember(null)} style={{ width: '100%', marginTop: 8, padding: 10, background: 'transparent', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer' }}>
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
