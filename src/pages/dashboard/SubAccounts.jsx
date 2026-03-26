import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { Building2, Plus, Users, Calendar, Pencil, Copy, Globe, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'
const PORTAL_BASE = 'https://axess.pro/portal'

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

function emptyDeptForm() {
  return {
    name: '',
    department_type: 'culture',
    custom_type_name: '',
    description: '',
    target_audience: [],
    phone: '',
    budget_code: '',
    portal_enabled: false,
    portal_slug: '',
    shared_portal: true,
  }
}

export default function SubAccounts() {
  const subAccountsAllowed = useRequirePermission('can_manage_sub_accounts')
  const { session, businessId } = useAuth()
  const [tab, setTab] = useState(0)
  const [subAccounts, setSubAccounts] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [poLoading, setPoLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deptForm, setDeptForm] = useState(emptyDeptForm)
  const [submitting, setSubmitting] = useState(false)

  const [orgForm, setOrgForm] = useState({
    name: '',
    logo_url: '',
    portal_slug: '',
    portal_general_enabled: false,
  })
  const [orgLoading, setOrgLoading] = useState(false)

  const [poModal, setPoModal] = useState(false)
  const [poForm, setPoForm] = useState({
    sub_account_id: '',
    po_number: '',
    amount: '',
    description: '',
    event_ids: [],
  })

  const authHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json', 'X-Business-Id': businessId }
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`
    return h
  }, [businessId, session?.access_token])

  const loadDepartments = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    fetch(`${API_BASE}/api/sub-accounts`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setSubAccounts(Array.isArray(d.sub_accounts) ? d.sub_accounts : []))
      .catch(() => setSubAccounts([]))
      .finally(() => setLoading(false))
  }, [businessId, authHeaders])

  const loadPOs = useCallback(() => {
    if (!businessId) return
    setPoLoading(true)
    fetch(`${API_BASE}/api/purchase-orders`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setPurchaseOrders(Array.isArray(d.purchase_orders) ? d.purchase_orders : []))
      .catch(() => setPurchaseOrders([]))
      .finally(() => setPoLoading(false))
  }, [businessId, authHeaders])

  const loadOrg = useCallback(() => {
    if (!businessId) return
    setOrgLoading(true)
    fetch(`${API_BASE}/api/sub-accounts/org`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const o = d.org || {}
        const logo = o.brand_assets?.logo_url || ''
        setOrgForm({
          name: o.name || '',
          logo_url: logo,
          portal_slug: o.portal_slug || '',
          portal_general_enabled: !!o.portal_general_enabled,
        })
      })
      .catch(() => {})
      .finally(() => setOrgLoading(false))
  }, [businessId, authHeaders])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  useEffect(() => {
    if (tab === 1) loadOrg()
  }, [tab, loadOrg])

  useEffect(() => {
    if (tab === 2) {
      loadPOs()
      if (businessId) {
        fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((rows) => setEvents(Array.isArray(rows) ? rows : []))
          .catch(() => setEvents([]))
      }
    }
  }, [tab, loadPOs, businessId])

  const openCreate = () => {
    setEditId(null)
    setDeptForm(emptyDeptForm())
    setModalOpen(true)
  }

  const openEdit = (sa) => {
    setEditId(sa.id)
    setDeptForm({
      name: sa.department_name || '',
      department_type: sa.department_type || 'custom',
      custom_type_name: sa.custom_type_name || '',
      description: sa.description || '',
      target_audience: Array.isArray(sa.target_audience) ? sa.target_audience : [],
      phone: sa.phone || '',
      budget_code: sa.budget_code || '',
      portal_enabled: !!sa.portal_enabled,
      portal_slug: sa.portal_slug || '',
      shared_portal: sa.shared_portal !== false,
    })
    setModalOpen(true)
  }

  const toggleAudience = (v) => {
    setDeptForm((f) => ({
      ...f,
      target_audience: f.target_audience.includes(v)
        ? f.target_audience.filter((x) => x !== v)
        : [...f.target_audience, v],
    }))
  }

  const saveDept = async () => {
    if (!deptForm.name.trim()) {
      toast.error('הזן שם מחלקה')
      return
    }
    setSubmitting(true)
    try {
      const body = {
        name: deptForm.name.trim(),
        department_type: deptForm.department_type,
        custom_type_name: deptForm.department_type === 'custom' ? deptForm.custom_type_name.trim() || null : null,
        description: deptForm.description.trim() || null,
        target_audience: deptForm.target_audience,
        phone: deptForm.phone.trim() || null,
        budget_code: deptForm.budget_code.trim() || null,
        portal_enabled: deptForm.portal_enabled,
        portal_slug: deptForm.portal_slug.trim() || null,
        shared_portal: deptForm.shared_portal,
      }
      const url = editId ? `${API_BASE}/api/sub-accounts/${editId}` : `${API_BASE}/api/sub-accounts`
      const res = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success(editId ? 'עודכן' : 'נוצר')
      setModalOpen(false)
      loadDepartments()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const duplicateDept = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/sub-accounts/${id}/duplicate`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('נוצר עותק')
      loadDepartments()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const saveOrg = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/sub-accounts/org`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          name: orgForm.name,
          logo_url: orgForm.logo_url || null,
          portal_slug: orgForm.portal_slug || null,
          portal_general_enabled: orgForm.portal_general_enabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('נשמר')
      if (data.org) {
        const logo = data.org.brand_assets?.logo_url || ''
        setOrgForm((f) => ({
          ...f,
          name: data.org.name || f.name,
          logo_url: logo,
          portal_slug: data.org.portal_slug || '',
          portal_general_enabled: !!data.org.portal_general_enabled,
        }))
      }
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const savePO = async () => {
    if (!poForm.po_number.trim()) {
      toast.error('הזן מספר PO')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          sub_account_id: poForm.sub_account_id || null,
          po_number: poForm.po_number.trim(),
          amount: poForm.amount === '' ? null : Number(poForm.amount),
          description: poForm.description.trim() || null,
          event_ids: poForm.event_ids,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('נוצר PO')
      setPoModal(false)
      setPoForm({ sub_account_id: '', po_number: '', amount: '', description: '', event_ids: [] })
      loadPOs()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק את המחלקה?')) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/sub-accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('שגיאה')
      setSubAccounts((prev) => prev.filter((s) => s.id !== id))
      toast.success('נמחק')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  const tabBtn = (i, label) => (
    <button
      type="button"
      key={i}
      onClick={() => setTab(i)}
      style={{
        padding: '10px 18px',
        borderRadius: 'var(--radius-full)',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 14,
        background: tab === i ? 'var(--v2-primary)' : 'transparent',
        color: tab === i ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
      }}
    >
      {label}
    </button>
  )

  const portalUrl = (slug) => (slug ? `${PORTAL_BASE}/${encodeURIComponent(slug)}` : '')

  if (!subAccountsAllowed) return null

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800 }}>מחלקות</h1>
        <div style={{ display: 'flex', gap: 8, background: 'var(--v2-dark-3)', padding: 4, borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' }}>
          {tabBtn(0, 'מחלקות')}
          {tabBtn(1, 'הגדרות ארגון')}
          {tabBtn(2, 'הזמנות עבודה')}
        </div>
      </div>

      {tab === 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              type="button"
              onClick={openCreate}
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
              <Plus size={18} /> מחלקה חדשה
            </button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {subAccounts.map((sa) => {
                const typeLabel = DEPT_TYPE_OPTIONS.find((o) => o.value === sa.department_type)?.label || sa.department_type
                const audiences = (sa.target_audience || []).map((a) => AUDIENCE_LABELS[a] || a).filter(Boolean)
                return (
                  <div
                    key={sa.id}
                    style={{
                      background: 'var(--v2-dark-3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,195,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={24} style={{ color: 'var(--v2-primary)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 17 }}>{sa.department_name}</div>
                        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 2 }}>
                          {typeLabel}
                          {sa.custom_type_name && sa.department_type === 'custom' ? ` · ${sa.custom_type_name}` : ''}
                        </div>
                        {sa.description && (
                          <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 8, lineHeight: 1.4 }}>{sa.description}</div>
                        )}
                      </div>
                    </div>
                    {audiences.length > 0 && (
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
                    )}
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={16} /> {sa.staff_count ?? 0} צוות
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={16} /> {sa.events_count ?? 0} אירועים
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: sa.portal_enabled ? '#4ade80' : 'var(--v2-gray-400)' }}>פורטל: {sa.portal_enabled ? 'פעיל' : 'כבוי'}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <a
                        href="/dashboard"
                        style={{ flex: '1 1 120px', padding: '10px 12px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 8, fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontSize: 13 }}
                      >
                        כנס למחלקה
                      </a>
                      <button
                        type="button"
                        onClick={() => openEdit(sa)}
                        style={{ padding: '10px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                      >
                        <Pencil size={16} /> ערוך
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateDept(sa.id)}
                        style={{ padding: '10px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                      >
                        <Copy size={16} /> שכפל
                      </button>
                      {sa.portal_slug && sa.portal_enabled ? (
                        <a
                          href={portalUrl(sa.portal_slug)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '10px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                        >
                          <Globe size={16} /> פורטל
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(sa.id)}
                        style={{ padding: '10px 12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                      >
                        מחק
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
        <div style={{ maxWidth: 520, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          {orgLoading ? (
            <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
          ) : (
            <>
              <label className="label">שם הארגון</label>
              <input className="input" style={{ marginBottom: 16 }} value={orgForm.name} onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))} />
              <label className="label">לוגו (URL)</label>
              <input className="input" dir="ltr" style={{ marginBottom: 16 }} value={orgForm.logo_url} onChange={(e) => setOrgForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
              <label className="label">Slug פורטל כללי</label>
              <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 6, direction: 'ltr', textAlign: 'right' }}>
                {PORTAL_BASE}/[{orgForm.portal_slug || 'slug'}]
              </div>
              <input className="input" dir="ltr" style={{ marginBottom: 16 }} value={orgForm.portal_slug} onChange={(e) => setOrgForm((f) => ({ ...f, portal_slug: e.target.value }))} placeholder="slug-ארגון" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                <input type="checkbox" checked={orgForm.portal_general_enabled} onChange={(e) => setOrgForm((f) => ({ ...f, portal_general_enabled: e.target.checked }))} />
                <span style={{ fontWeight: 600 }}>פורטל כללי פעיל</span>
              </label>
              <button type="button" className="btn-primary" onClick={saveOrg} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
                <Save size={18} /> שמור
              </button>
            </>
          )}
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                setPoForm({ sub_account_id: '', po_number: '', amount: '', description: '', event_ids: [] })
                setPoModal(true)
              }}
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
              <Plus size={18} /> PO חדש
            </button>
          </div>
          {poLoading ? (
            <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', background: 'var(--v2-dark-3)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>
                    <th style={{ padding: 12 }}>מספר PO</th>
                    <th style={{ padding: 12 }}>מחלקה</th>
                    <th style={{ padding: 12 }}>סכום</th>
                    <th style={{ padding: 12 }}>נוצל</th>
                    <th style={{ padding: 12 }}>יתרה</th>
                    <th style={{ padding: 12 }}>סטטוס</th>
                    <th style={{ padding: 12, minWidth: 140 }}>התקדמות</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => {
                    const total = po.amount != null ? Number(po.amount) : 0
                    const used = po.used_amount != null ? Number(po.used_amount) : 0
                    const balance = Math.max(0, total - used)
                    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
                    return (
                      <tr key={po.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: 12, fontWeight: 700 }}>{po.po_number}</td>
                        <td style={{ padding: 12 }}>{po.sub_account_name || '—'}</td>
                        <td style={{ padding: 12 }}>{total ? total.toLocaleString('he-IL') : '—'}</td>
                        <td style={{ padding: 12 }}>{used.toLocaleString('he-IL')}</td>
                        <td style={{ padding: 12 }}>{total ? balance.toLocaleString('he-IL') : '—'}</td>
                        <td style={{ padding: 12 }}>{po.status}</td>
                        <td style={{ padding: 12 }}>
                          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--v2-primary)', transition: 'width 0.3s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 4 }}>{pct}% · {used}/{total || '—'}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {purchaseOrders.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--v2-gray-400)' }}>אין הזמנות עבודה</div>}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={() => !submitting && setModalOpen(false)}>
          <div style={{ background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--glass-border)' }} onClick={(e) => e.stopPropagation()} dir="rtl">
            <h3 style={{ marginBottom: 20, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 }}>{editId ? 'עריכת מחלקה' : 'מחלקה חדשה'}</h3>
            <label className="label">שם מחלקה</label>
            <input className="input" style={{ marginBottom: 14 }} value={deptForm.name} onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))} />
            <label className="label">סוג</label>
            <select className="input" style={{ marginBottom: 14 }} value={deptForm.department_type} onChange={(e) => setDeptForm((f) => ({ ...f, department_type: e.target.value }))}>
              {DEPT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {deptForm.department_type === 'custom' && (
              <>
                <label className="label">כותרת מותאמת</label>
                <input className="input" style={{ marginBottom: 14 }} value={deptForm.custom_type_name} onChange={(e) => setDeptForm((f) => ({ ...f, custom_type_name: e.target.value }))} />
              </>
            )}
            <label className="label">תיאור</label>
            <textarea className="input" style={{ marginBottom: 14, minHeight: 72, resize: 'vertical' }} value={deptForm.description} onChange={(e) => setDeptForm((f) => ({ ...f, description: e.target.value }))} />
            <label className="label">קהל יעד</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              {AUDIENCE_OPTS.map((o) => (
                <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={deptForm.target_audience.includes(o.value)} onChange={() => toggleAudience(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
            <label className="label">טלפון מחלקה</label>
            <input className="input" dir="ltr" style={{ marginBottom: 14 }} value={deptForm.phone} onChange={(e) => setDeptForm((f) => ({ ...f, phone: e.target.value }))} />
            <label className="label">קוד תקציב</label>
            <input className="input" style={{ marginBottom: 14 }} value={deptForm.budget_code} onChange={(e) => setDeptForm((f) => ({ ...f, budget_code: e.target.value }))} />
            <div style={{ marginBottom: 14, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>פורטל ציבורי</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={deptForm.portal_enabled} onChange={(e) => setDeptForm((f) => ({ ...f, portal_enabled: e.target.checked }))} />
                הפעל פורטל
              </label>
              <label className="label">slug (URL)</label>
              <input className="input" dir="ltr" style={{ marginBottom: 10 }} value={deptForm.portal_slug} onChange={(e) => setDeptForm((f) => ({ ...f, portal_slug: e.target.value }))} placeholder="שם-בנתיב" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={deptForm.shared_portal} onChange={(e) => setDeptForm((f) => ({ ...f, shared_portal: e.target.checked }))} />
                הצג בפורטל הכללי
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}>
                ביטול
              </button>
              <button type="button" onClick={saveDept} disabled={submitting} className="btn-primary" style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                {editId ? 'שמור' : 'צור מחלקה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {poModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={() => !submitting && setPoModal(false)}>
          <div style={{ background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 440, width: '100%', border: '1px solid var(--glass-border)' }} onClick={(e) => e.stopPropagation()} dir="rtl">
            <h3 style={{ marginBottom: 20, fontWeight: 800 }}>PO חדש</h3>
            <label className="label">מחלקה</label>
            <select className="input" style={{ marginBottom: 14 }} value={poForm.sub_account_id} onChange={(e) => setPoForm((f) => ({ ...f, sub_account_id: e.target.value }))}>
              <option value="">—</option>
              {subAccounts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.department_name}
                </option>
              ))}
            </select>
            <label className="label">מספר PO</label>
            <input className="input" style={{ marginBottom: 14 }} value={poForm.po_number} onChange={(e) => setPoForm((f) => ({ ...f, po_number: e.target.value }))} />
            <label className="label">סכום</label>
            <input className="input" dir="ltr" type="number" style={{ marginBottom: 14 }} value={poForm.amount} onChange={(e) => setPoForm((f) => ({ ...f, amount: e.target.value }))} />
            <label className="label">תיאור</label>
            <textarea className="input" style={{ marginBottom: 14, minHeight: 64 }} value={poForm.description} onChange={(e) => setPoForm((f) => ({ ...f, description: e.target.value }))} />
            <label className="label">אירועים משויכים</label>
            <div style={{ maxHeight: 140, overflow: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map((ev) => (
                <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={poForm.event_ids.includes(ev.id)}
                    onChange={(e) => {
                      if (e.target.checked) setPoForm((f) => ({ ...f, event_ids: [...f.event_ids, ev.id] }))
                      else setPoForm((f) => ({ ...f, event_ids: f.event_ids.filter((x) => x !== ev.id) }))
                    }}
                  />
                  {ev.title || ev.slug}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setPoModal(false)} style={{ flex: 1, padding: 12, borderRadius: 8, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}>
                ביטול
              </button>
              <button type="button" onClick={savePO} disabled={submitting} className="btn-primary" style={{ flex: 1, padding: 12, borderRadius: 8, fontWeight: 700 }}>
                צור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
