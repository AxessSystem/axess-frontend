import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { ArrowRight, Building2, Users, Calendar, Settings2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const MODAL_CLOSE_X = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--v2-gray-400)',
  padding: 4,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const BASE_DEPT_TYPES = [
  { value: 'culture', label: 'תרבות' },
  { value: 'youth', label: 'נוער' },
  { value: 'sport', label: 'ספורט' },
  { value: 'welfare', label: 'רווחה' },
  { value: 'education', label: 'חינוך' },
]

const BASE_DEPT_TYPE_VALUES = new Set(BASE_DEPT_TYPES.map((t) => t.value))

const AUDIENCE_OPTS = [
  { value: 'children', label: 'ילדים' },
  { value: 'youth', label: 'נוער' },
  { value: 'young_adults', label: 'צעירים' },
  { value: 'adults', label: 'מבוגרים' },
  { value: 'veterans', label: 'ותיקים' },
  { value: 'all', label: 'כולם' },
]

const AUDIENCE_LABELS = {
  ...Object.fromEntries(AUDIENCE_OPTS.map((o) => [o.value, o.label])),
  seniors: 'ותיקים',
}

const SELECT_STYLE = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--glass-border)', background: 'var(--card)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
  cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
}

function normalizeAudienceFromApi(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map((v) => (v === 'seniors' ? 'veterans' : v))
}

function parseBrandingObj(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return { ...raw }
  return {}
}

export default function SubAccountDetail() {
  const subAccountsAllowed = useRequirePermission('can_manage_sub_accounts')
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, businessId } = useAuth()
  const [tab, setTab] = useState(0)
  const [dept, setDept] = useState(null)
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState([])
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customTypes, setCustomTypes] = useState([])
  const [showAddType, setShowAddType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [editForm, setEditForm] = useState({
    name: '',
    department_type: 'culture',
    custom_type_name: '',
    description: '',
    target_audience: [],
    phone: '',
    department_email: '',
    manager_user_id: '',
    budget_code: '',
    portal_enabled: false,
    portal_slug: '',
    shared_portal: true,
  })

  const authHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json', 'X-Business-Id': businessId }
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`
    return h
  }, [businessId, session?.access_token])

  const load = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    fetch(`${API_BASE}/api/sub-accounts`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d.sub_accounts) ? d.sub_accounts : []
        const found = list.find((s) => String(s.id) === String(id))
        setDept(found || null)
      })
      .catch(() => setDept(null))
      .finally(() => setLoading(false))
  }, [businessId, authHeaders, id])

  const loadStaff = useCallback(() => {
    if (!businessId || !session?.access_token) return
    fetch(`${API_BASE}/api/staff`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setStaffList(Array.isArray(d.staff) ? d.staff : []))
      .catch(() => setStaffList([]))
  }, [businessId, session?.access_token, authHeaders])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  useEffect(() => {
    if (editOpen) loadStaff()
  }, [editOpen, loadStaff])

  const openEditModal = () => {
    if (!dept) return
    const br = parseBrandingObj(dept.branding)
    if (!BASE_DEPT_TYPE_VALUES.has(dept.department_type)) {
      setCustomTypes([{ value: dept.department_type, label: dept.custom_type_name || dept.department_type }])
    } else {
      setCustomTypes([])
    }
    setShowAddType(false)
    setNewTypeName('')
    setEditForm({
      name: dept.department_name || '',
      department_type: dept.department_type || 'culture',
      custom_type_name: dept.custom_type_name || '',
      description: dept.description || '',
      target_audience: normalizeAudienceFromApi(dept.target_audience),
      phone: dept.phone || '',
      department_email: br.department_email || '',
      manager_user_id: br.manager_user_id || '',
      budget_code: dept.budget_code || '',
      portal_enabled: !!dept.portal_enabled,
      portal_slug: dept.portal_slug || '',
      shared_portal: dept.shared_portal !== false,
    })
    setEditOpen(true)
  }

  const toggleAudience = (v) => {
    setEditForm((f) => ({
      ...f,
      target_audience: f.target_audience.includes(v)
        ? f.target_audience.filter((x) => x !== v)
        : [...f.target_audience, v],
    }))
  }

  const saveEdit = async () => {
    if (!dept || !editForm.name.trim()) {
      toast.error('הזן שם מחלקה')
      return
    }
    setSubmitting(true)
    try {
      const prevBranding = parseBrandingObj(dept.branding)
      const allTypesForSave = [...BASE_DEPT_TYPES, ...customTypes]
      const selectedType = allTypesForSave.find((t) => t.value === editForm.department_type)
      const custom_type_name = BASE_DEPT_TYPE_VALUES.has(editForm.department_type)
        ? null
        : (selectedType?.label || editForm.custom_type_name?.trim() || null)
      const body = {
        name: editForm.name.trim(),
        department_type: editForm.department_type,
        custom_type_name,
        description: editForm.description.trim() || null,
        target_audience: editForm.target_audience.map((v) => (v === 'seniors' ? 'veterans' : v)),
        phone: editForm.phone.trim() || null,
        budget_code: editForm.budget_code.trim() || null,
        portal_enabled: editForm.portal_enabled,
        portal_slug: editForm.portal_slug.trim() || null,
        shared_portal: editForm.shared_portal,
        branding: {
          ...prevBranding,
          department_email: editForm.department_email.trim() || null,
          manager_user_id: editForm.manager_user_id || null,
        },
      }
      const res = await fetch(`${API_BASE}/api/sub-accounts/${dept.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('נשמר')
      setEditOpen(false)
      const row = data.sub_account
      if (row) {
        setDept((prev) =>
          prev
            ? {
                ...prev,
                ...row,
                staff_count: prev.staff_count,
                events_count: prev.events_count,
              }
            : null
        )
      } else load()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  if (!subAccountsAllowed) return null

  const typeLabel = dept
    ? BASE_DEPT_TYPES.find((o) => o.value === dept.department_type)?.label || dept.custom_type_name || dept.department_type
    : ''

  const audiences = dept
    ? (dept.target_audience || []).map((a) => AUDIENCE_LABELS[a] || a).filter(Boolean)
    : []

  const branding = dept ? parseBrandingObj(dept.branding) : {}
  const managerUserId = branding.manager_user_id
  const managerMember = managerUserId ? staffList.find((s) => String(s.user_id) === String(managerUserId)) : null
  const managerDisplay = managerMember
    ? `${managerMember.full_name || ''}${managerMember.email ? ` · ${managerMember.email}` : ''}`.trim() || managerUserId
    : null

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)', maxWidth: 1100 }}>
      <button
        type="button"
        onClick={() => navigate('/dashboard/sub-accounts')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
          padding: '8px 14px',
          borderRadius: 8,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          color: 'var(--v2-gray-400)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <ArrowRight size={18} />
        חזור למחלקות
      </button>

      {loading ? (
        <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
      ) : !dept ? (
        <div style={{ color: 'var(--v2-gray-400)' }}>מחלקה לא נמצאה</div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,195,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} style={{ color: 'var(--v2-primary)' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>{dept.department_name}</h1>
                  <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', margin: 0 }}>
                    {typeLabel}
                    {dept.custom_type_name && dept.department_type === 'custom' ? ` · ${dept.custom_type_name}` : ''}
                  </p>
                </div>
              </div>
              <button type="button" onClick={openEditModal} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                ערוך מחלקה
              </button>
            </div>
            {dept.description ? (
              <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', margin: '0 0 12px', lineHeight: 1.5 }}>{dept.description}</p>
            ) : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--v2-gray-400)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={16} /> {dept.staff_count ?? 0} צוות
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} /> {dept.events_count ?? 0} אירועים
              </span>
            </div>
          </div>

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
              { id: 0, label: 'אנשי צוות', icon: Users },
              { id: 1, label: 'אירועים', icon: Calendar },
              { id: 2, label: 'הגדרות', icon: Settings2 },
            ].map((t) => {
              const Icon = t.icon
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
                  <Icon size={18} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {tab === 0 && (
            <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>אנשי צוות</div>
              <p style={{ color: 'var(--v2-gray-400)', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                במחלקה זו מדווחים {dept.staff_count ?? 0} אנשי צוות משויכים. ניהול מלא של הצוות מתבצע דרך עמוד &quot;צוות&quot; בלוח הבקרה.
              </p>
            </div>
          )}

          {tab === 1 && (
            <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>אירועים</div>
              <p style={{ color: 'var(--v2-gray-400)', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                ספירת האירועים עבור העסק: {dept.events_count ?? 0}. ליצירה ועריכה משתמשים בעמוד &quot;אירועים&quot;.
              </p>
            </div>
          )}

          {tab === 2 && (
            <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>הגדרות מחלקה</div>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>
                <strong style={{ color: '#fff' }}>טלפון: </strong>
                {dept.phone || '—'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>
                <strong style={{ color: '#fff' }}>מייל מחלקה: </strong>
                {branding.department_email || '—'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>
                <strong style={{ color: '#fff' }}>מנהל המחלקה: </strong>
                {managerDisplay || '—'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>
                <strong style={{ color: '#fff' }}>קוד תקציב: </strong>
                {dept.budget_code || '—'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>
                <strong style={{ color: '#fff' }}>פורטל: </strong>
                {dept.portal_enabled ? 'פעיל' : 'כבוי'}
                {dept.portal_slug ? ` · ${dept.portal_slug}` : ''}
              </div>
              {audiences.length > 0 ? (
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8, fontSize: 14 }}>קהלי יעד</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {audiences.map((lbl, idx) => (
                      <span
                        key={`${lbl}-${idx}`}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: 'rgba(99,102,241,0.2)',
                          color: '#a5b4fc',
                        }}
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {editOpen && dept && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={() => !submitting && setEditOpen(false)}>
          <div style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--glass-border)' }} onClick={(e) => e.stopPropagation()} dir="rtl">
            <button type="button" onClick={() => !submitting && setEditOpen(false)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: 20, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 }}>עריכת מחלקה</h3>
            <label className="label">שם מחלקה</label>
            <input className="input" style={{ marginBottom: 14 }} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            <label className="label">סוג</label>
            <CustomSelect
              style={{ ...SELECT_STYLE, marginBottom: showAddType ? 8 : 14 }}
              value={editForm.department_type}
              onChange={(val) => {
                if (val === '__add_new__') {
                  setShowAddType(true)
                  return
                }
                setEditForm((f) => ({ ...f, department_type: val }))
              }}
              options={[
                ...[...BASE_DEPT_TYPES, ...customTypes].map((t) => ({ value: t.value, label: t.label })),
                { value: '__add_new__', label: '+ הוסף סוג חדש...' },
              ]}
            />
            {showAddType && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="שם הסוג החדש (למשל: דוברות)"
                  style={{
                    flex: '1 1 140px',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTypeName.trim()) return
                    const raw = newTypeName.trim()
                    const newType = { value: raw.toLowerCase().replace(/\s/g, '_'), label: raw }
                    setCustomTypes((prev) => [...prev, newType])
                    setEditForm((f) => ({ ...f, department_type: newType.value, custom_type_name: newType.label }))
                    setShowAddType(false)
                    setNewTypeName('')
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  הוסף
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddType(false)
                    setNewTypeName('')
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  ביטול
                </button>
              </div>
            )}
            <label className="label">מנהל המחלקה</label>
            <CustomSelect
              style={{ ...SELECT_STYLE, marginBottom: 14 }}
              value={editForm.manager_user_id}
              onChange={(val) => setEditForm((f) => ({ ...f, manager_user_id: val }))}
              options={[
                { value: '', label: '— בחר מרשימת הצוות —' },
                ...staffList.map((s) => ({
                  value: s.user_id || '',
                  label: s.full_name || s.email || s.user_id,
                })),
              ]}
            />
            <label className="label">תיאור</label>
            <textarea className="input" style={{ marginBottom: 14, minHeight: 72, resize: 'vertical' }} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
            <label className="label">קהל יעד</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              {AUDIENCE_OPTS.map((o) => (
                <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.target_audience.includes(o.value)} onChange={() => toggleAudience(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
            <label className="label">טלפון מחלקה</label>
            <input className="input" dir="ltr" style={{ marginBottom: 14 }} value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            <label className="label">מייל מחלקה</label>
            <input className="input" dir="ltr" type="email" style={{ marginBottom: 14 }} value={editForm.department_email} onChange={(e) => setEditForm((f) => ({ ...f, department_email: e.target.value }))} />
            <label className="label">קוד תקציב</label>
            <input className="input" style={{ marginBottom: 14 }} value={editForm.budget_code} onChange={(e) => setEditForm((f) => ({ ...f, budget_code: e.target.value }))} />
            <div style={{ marginBottom: 14, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>פורטל ציבורי</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.portal_enabled} onChange={(e) => setEditForm((f) => ({ ...f, portal_enabled: e.target.checked }))} />
                הפעל פורטל
              </label>
              <label className="label">slug (URL)</label>
              <input className="input" dir="ltr" style={{ marginBottom: 10 }} value={editForm.portal_slug} onChange={(e) => setEditForm((f) => ({ ...f, portal_slug: e.target.value }))} placeholder="שם-בנתיב" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.shared_portal} onChange={(e) => setEditForm((f) => ({ ...f, shared_portal: e.target.checked }))} />
                הצג בפורטל הכללי
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setEditOpen(false)} disabled={submitting} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}>
                ביטול
              </button>
              <button type="button" onClick={saveEdit} disabled={submitting} className="btn-primary" style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
