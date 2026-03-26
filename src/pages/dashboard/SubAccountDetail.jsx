import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { ArrowRight, Building2, Users, Calendar, Settings2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const DEPT_TYPE_OPTIONS = [
  { value: 'culture', label: 'תרבות' },
  { value: 'youth', label: 'נוער' },
  { value: 'sport', label: 'ספורט' },
  { value: 'welfare', label: 'רווחה' },
  { value: 'education', label: 'חינוך' },
  { value: 'custom', label: 'מותאם' },
]

const AUDIENCE_OPTS = [
  { value: 'children', label: 'ילדים' },
  { value: 'youth', label: 'נוער' },
  { value: 'adults', label: 'מבוגרים' },
  { value: 'seniors', label: 'קשישים' },
  { value: 'all', label: 'כולם' },
]

const AUDIENCE_LABELS = Object.fromEntries(AUDIENCE_OPTS.map((o) => [o.value, o.label]))

export default function SubAccountDetail() {
  const subAccountsAllowed = useRequirePermission('can_manage_sub_accounts')
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, businessId } = useAuth()
  const [tab, setTab] = useState(0)
  const [dept, setDept] = useState(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    load()
  }, [load])

  if (!subAccountsAllowed) return null

  const typeLabel = dept
    ? DEPT_TYPE_OPTIONS.find((o) => o.value === dept.department_type)?.label || dept.department_type
    : ''

  const audiences = dept
    ? (dept.target_audience || []).map((a) => AUDIENCE_LABELS[a] || a).filter(Boolean)
    : []

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
                    {audiences.map((lbl) => (
                      <span
                        key={lbl}
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
    </div>
  )
}
