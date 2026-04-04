import { useState, useEffect, useCallback } from 'react'
import { Users, UtensilsCrossed, LayoutGrid, Megaphone, Store, Receipt, Save, ChevronDown, ChevronUp, Trash2, Search, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const TEMPLATE_TYPES = [
  { id: 'staff', label: 'הצוות שלי', desc: 'שמור את הצוות הקבוע שלך', icon: 'users' },
  { id: 'menu', label: 'התפריט שלי', desc: 'שמור את התפריט המעודכן', icon: 'utensils' },
  { id: 'tables', label: 'השולחנות שלי', desc: 'כלל חינם + מספור שולחנות', icon: 'grid' },
  { id: 'promoters', label: 'היחצ"נים שלי', desc: 'רשימת יחצ"נים קבועה', icon: 'megaphone' },
  { id: 'vendors', label: 'הספקים שלי', desc: 'ספקים חוזרים', icon: 'store' },
  { id: 'expenses', label: 'קטגוריות הוצאות', desc: 'קטגוריות הוצאות קבועות', icon: 'receipt' },
]

const PRESET_MENU_CATEGORIES = ['וויסקי', 'וודקה', 'טקילה', 'ג\'ין', 'רום', 'אניס', 'יין ושמפניה', 'קוניאק', 'ליקרים', 'נישנושים']

const VENDOR_TYPES = [
  { value: 'none', label: 'ללא' },
  { value: 'ltd', label: 'בע"מ' },
  { value: 'osek_murshe', label: 'עוסק מורשה' },
  { value: 'osek_patur', label: 'עוסק פטור' },
]

const ICONS = {
  users: <Users size={20} color="#00C37A" />,
  utensils: <UtensilsCrossed size={20} color="#00C37A" />,
  grid: <LayoutGrid size={20} color="#00C37A" />,
  megaphone: <Megaphone size={20} color="#00C37A" />,
  store: <Store size={20} color="#00C37A" />,
  receipt: <Receipt size={20} color="#00C37A" />,
}

export default function TemplatesTab({ eventId, businessId, authHeaders }) {
  const [templates, setTemplates] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [templateData, setTemplateData] = useState({})
  const [confirmAction, setConfirmAction] = useState(null)

  const requestConfirm = useCallback((message, onConfirm) => {
    setConfirmAction({
      message,
      onConfirm: async () => {
        try {
          await onConfirm()
        } finally {
          setConfirmAction(null)
        }
      },
    })
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [businessId])

  useEffect(() => {
    if (expanded && templates[expanded]) {
      setActiveTemplate(expanded)
      setTemplateData(templates[expanded].template_data || {})
    }
  }, [expanded, templates])

  const loadTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/business/${businessId}/templates`, { headers: authHeaders() })
      const data = await res.json()
      const byType = {}
      ;(data.templates || []).forEach((t) => { byType[t.template_type] = t })
      setTemplates(byType)
    } catch (e) {
      console.error('loadTemplates error:', e)
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async (type) => {
    setSaving(type)
    try {
      const res = await fetch(`${API_BASE}/api/admin/business/${businessId}/templates`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ template_type: type, source_event_id: eventId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      toast.success('תבנית נשמרה!')
      loadTemplates()
    } catch (e) {
      toast.error(e.message || 'שגיאה בשמירה')
    } finally {
      setSaving(null)
    }
  }

  const updateTemplateData = async (type, newData) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/business/${businessId}/templates/${type}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ template_data: newData }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      loadTemplates()
    } catch (e) {
      toast.error(e.message || 'שגיאה בעדכון')
    }
  }

  const handleTemplateUpdate = (type, newData) => {
    setTemplateData((prev) => {
      const next = { ...prev, ...newData }
      updateTemplateData(type, next)
      return next
    })
  }

  const toggleExpand = (t, existing, isExpanded) => {
    if (isExpanded) {
      setExpanded(null)
      setActiveTemplate(null)
      setTemplateData({})
      return
    }
    setExpanded(t.id)
    if (existing) {
      setActiveTemplate(t.id)
      setTemplateData(existing.template_data || {})
    } else {
      setActiveTemplate(null)
      setTemplateData({})
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)' }}>טוען...</div>

  return (
    <div>
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1a1d2e', borderRadius: 14, padding: 24, maxWidth: 360, width: '100%', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>אישור פעולה</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>{confirmAction.message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmAction(null)} style={{ flex: 1, height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                ביטול
              </button>
              <button
                type="button"
                onClick={() => { Promise.resolve(confirmAction.onConfirm()).catch(() => {}) }}
                style={{ flex: 1, height: 42, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background: 'rgba(0,195,122,0.08)', borderRadius: 10, padding: 12, marginBottom: 20, border: '1px solid rgba(0,195,122,0.2)' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#00C37A', fontWeight: 700 }}>⭐ התבניות שלי</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          שמור הגדרות מאירוע זה כתבנית — תועתק אוטומטית לאירועים חדשים
        </p>
      </div>

      {TEMPLATE_TYPES.map((t) => {
        const existing = templates[t.id]
        const isExpanded = expanded === t.id
        const dataForPanel = activeTemplate === t.id && isExpanded ? templateData : (existing?.template_data || {})
        const alwaysShow = ['staff', 'promoters']

        return (
          <div key={t.id} style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${isExpanded ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`, overflow: 'hidden', transition: 'all 0.2s' }}>

            {/* כותרת */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--glass)', cursor: 'pointer' }}
              onClick={() => toggleExpand(t, existing, isExpanded)}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICONS[t.icon]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{t.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                  {existing ? `עודכן: ${new Date(existing.updated_at).toLocaleDateString('he-IL')}` : t.desc}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); saveTemplate(t.id) }}
                  disabled={saving === t.id}
                  style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(0,195,122,0.15)', color: '#00C37A', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                >
                  {saving === t.id ? '...' : <><Save size={12} style={{ marginLeft: 4 }} /> שמור</>}
                </button>
                {isExpanded ? <ChevronUp size={16} color="var(--v2-gray-400)" /> : <ChevronDown size={16} color="var(--v2-gray-400)" />}
              </div>
            </div>

            {/* תוכן מורחב */}
            {isExpanded && (existing || alwaysShow.includes(t.id)) && (
              <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
                <TemplateContent
                  key={String(existing?.updated_at ?? t.id)}
                  type={t.id}
                  data={dataForPanel}
                  onUpdate={(newData) => handleTemplateUpdate(t.id, newData)}
                  eventId={eventId}
                  businessId={businessId}
                  authHeaders={authHeaders}
                  requestConfirm={requestConfirm}
                />
              </div>
            )}

            {isExpanded && !existing && !alwaysShow.includes(t.id) && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                לא נשמרה תבנית עדיין — לחץ &quot;שמור&quot; כדי לשמור מאירוע זה
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TemplateContent({ type, data, onUpdate, eventId, businessId, authHeaders, requestConfirm }) {
  if (type === 'staff') return <StaffTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} requestConfirm={requestConfirm} />
  if (type === 'menu') return <MenuTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} requestConfirm={requestConfirm} />
  if (type === 'tables') return <TablesTemplate data={data} onUpdate={onUpdate} />
  if (type === 'promoters') return <PromotersTemplate key="promoters" data={data} onUpdate={onUpdate} businessId={businessId} authHeaders={authHeaders} />
  if (type === 'expenses' || type === 'vendors') return <ExpensesTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} requestConfirm={requestConfirm} />
  return null
}

function StaffTemplate({ data, onUpdate, eventId, businessId: _businessId, authHeaders, requestConfirm }) {
  const [staff, setStaff] = useState(data?.staff || [])
  const [showAdd, setShowAdd] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '', phone: '',
    role: 'מלצר/ית',
    is_permanent: true,
    on_shift: true,
    save_to_template: true,
    scan_station: '',
  })

  const ROLES = [
    'בעלים', 'מנהל ערב', 'מנהל שולחנות', 'מנהל בר',
    'מלצר/ית', 'קופאי/ת', 'סלקטור/ית', 'סורק/ת', 'מארח/ת', 'ברמן/ית',
  ]
  const [customRoles, setCustomRoles] = useState([])
  const allRoles = [...ROLES, ...customRoles]

  useEffect(() => {
    setStaff(data?.staff || [])
  }, [data])

  return (
    <div>
      {staff.map((member, i) => (
        <div
          key={i}
          style={{
            background: 'var(--glass)', borderRadius: 10, padding: 12, marginBottom: 8,
            border: `1px solid ${member.on_shift ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,195,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C37A', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {member.name?.[0] || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{member.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                {Array.isArray(member.roles) ? member.roles.join(' + ') : member.role} · {member.phone}
                {member.scan_station && ` · עמדה: ${member.scan_station}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {member.is_permanent && <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.2)', color: '#3B82F6', padding: '2px 6px', borderRadius: 8 }}>קבוע</span>}
              {member.on_shift && <span style={{ fontSize: 10, background: 'rgba(0,195,122,0.2)', color: '#00C37A', padding: '2px 6px', borderRadius: 8 }}>במשמרת</span>}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const role = window.prompt('הוסף תפקיד לאירוע זה:')
                  if (!role) return
                  const updated = staff.map((s, idx) => (idx === i ? {
                    ...s,
                    roles: [...(Array.isArray(s.roles) ? s.roles : [s.role].filter(Boolean)), role],
                  } : s))
                  setStaff(updated)
                  onUpdate({ staff: updated })
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: 11 }}
              >
                + תפקיד
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = staff.map((s, idx) => (idx === i ? { ...s, on_shift: !s.on_shift } : s))
                  setStaff(updated)
                  onUpdate({ staff: updated })
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: member.on_shift ? '#00C37A' : 'var(--v2-gray-400)', fontSize: 11 }}
              >
                {member.on_shift ? '✅' : '⬜'}
                {' '}
                משמרת
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = staff.filter((_, idx) => idx !== i)
                  setStaff(updated)
                  onUpdate({ staff: updated })
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {showAdd ? (
        <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, border: '1px solid rgba(0,195,122,0.3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={newMember.name} onChange={(e) => setNewMember((f) => ({ ...f, name: e.target.value }))} placeholder="שם מלא *" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
            <input value={newMember.phone} onChange={(e) => setNewMember((f) => ({ ...f, phone: e.target.value }))} placeholder="נייד WA *" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={newMember.role}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    const r = window.prompt('שם תפקיד חדש:')
                    if (r) { setCustomRoles((prev) => [...prev, r]); setNewMember((f) => ({ ...f, role: r })) }
                  } else {
                    setNewMember((f) => ({ ...f, role: e.target.value }))
                  }
                }}
                style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
              >
                {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                <option value="__new__">+ תפקיד חדש</option>
              </select>
            </div>

            {(newMember.role === 'סורק/ת' || newMember.role === 'סלקטור/ית') && (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={newMember.scan_station || ''} onChange={(e) => setNewMember((f) => ({ ...f, scan_station: e.target.value }))} placeholder="עמדת סריקה (למשל: כניסה ראשית)" style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { key: 'is_permanent', label: 'צוות קבוע' },
                { key: 'on_shift', label: 'במשמרת לאירוע זה' },
                { key: 'save_to_template', label: 'שמור בתבנית' },
              ].map((cb) => (
                <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newMember[cb.key]} onChange={(e) => setNewMember((f) => ({ ...f, [cb.key]: e.target.checked }))} />
                  {cb.label}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (!newMember.name || !newMember.phone) return
                  const updated = [...staff, newMember]
                  setStaff(updated)
                  onUpdate({ staff: updated })
                  setNewMember({ name: '', phone: '', role: 'מלצר/ית', is_permanent: true, on_shift: true, save_to_template: true, scan_station: '' })
                  setShowAdd(false)
                }}
                style={{ flex: 1, height: 36, borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                הוסף לצוות
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} style={{ width: '100%', height: 40, borderRadius: 8, border: '2px dashed rgba(0,195,122,0.3)', background: 'none', color: '#00C37A', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={16} />
          הוסף איש צוות
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          requestConfirm('לייבא צוות מהתבנית לאירוע זה?', async () => {
            const shiftStaff = staff.filter((s) => s.on_shift)
            for (const member of shiftStaff) {
              const roleStr = Array.isArray(member.roles) && member.roles.length
                ? member.roles.join(' + ')
                : member.role
              await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ name: member.name, phone: member.phone, role: roleStr, wa_notifications: true }),
              }).catch(() => {})
            }
            toast.success(`${shiftStaff.length} אנשי צוות יובאו לאירוע!`)
          })
        }}
        style={{ width: '100%', height: 42, borderRadius: 8, border: 'none', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 12 }}
      >
        ← ייבא צוות במשמרת לאירוע זה
      </button>
    </div>
  )
}

function MenuTemplate({ data, onUpdate, eventId, businessId, authHeaders, requestConfirm }) {
  const [menu, setMenu] = useState(data?.menu || [])
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '', category: '', price: '', description: '', unit: 'bottle', free_entries: 3, free_extras: 5, included_extras: [],
  })
  const [customCategories, setCustomCategories] = useState([])

  const categoryOptions = [...PRESET_MENU_CATEGORIES, ...new Set(menu.map((m) => m.category).filter(Boolean)), ...customCategories]
  const filtered = menu.filter((m) => !search
    || (m.name || '').toLowerCase().includes(search.toLowerCase())
    || (m.category || '').toLowerCase().includes(search.toLowerCase()))
  const byCategory = filtered.reduce((acc, m) => { if (!acc[m.category]) acc[m.category] = []; acc[m.category].push(m); return acc }, {})

  const EXTRAS_OPTIONS = ['חמוציות קנקן/בקבוק', 'תפוזים קנקן/בקבוק', 'אשכוליות קנקן/בקבוק', 'ראשן קנקן/בקבוק', 'מאי טוניק קנקן/בקבוק', 'קולה קנקן/בקבוק', 'משקה אנרגיה 5 פחיות']

  useEffect(() => {
    setMenu(data?.menu || [])
  }, [data])

  useEffect(() => {
    if (!businessId || !eventId) return
    if ((data?.menu || []).length > 0) return
    let cancelled = false
    const hdrs = authHeaders()
    fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu`, { headers: hdrs })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.menu?.length > 0) {
          setMenu(d.menu)
          onUpdate({ menu: d.menu })
        }
      })
      .catch(() => {
        fetch(`${API_BASE}/api/admin/events/00000000-0000-0000-0000-000000000000/table-menu`, { headers: hdrs })
          .then((r) => r.json())
          .then((d) => {
            if (cancelled || !d.menu?.length) return
            setMenu((prev) => (prev.length > 0 ? prev : d.menu))
          })
          .catch(() => {})
      })
    return () => { cancelled = true }
  }, [eventId, businessId, data?.menu])

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש מוצר או קטגוריה..." style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 36px 0 12px', fontSize: 13, boxSizing: 'border-box' }} />
        <Search size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--v2-gray-400)' }} />
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,195,122,0.3) transparent' }}>
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <p style={{
              margin: '0 0 8px', fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: 1,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: 6,
            }}
            >
              {cat}
              {' '}
              (
              {items.length}
              )
            </p>

            {items.map((item, i) => (
              <div
                key={item.id || `${cat}_${i}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{item.name}</p>
                  {item.description && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.description}</p>
                  )}
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(0,195,122,0.7)' }}>
                    {item.free_entries > 0 ? `${item.free_entries} כניסות חינם` : 'ללא כניסות חינם'}
                    {item.included_extras?.length > 0 && ` · ${item.included_extras.length} תוספות כלולות`}
                  </p>
                </div>

                {editingItem === `${cat}_${i}` ? (
                  <input
                    defaultValue={item.price}
                    autoFocus
                    onBlur={(e) => {
                      const updated = menu.map((m) => (m === item ? { ...m, price: parseFloat(e.target.value) || m.price } : m))
                      setMenu(updated)
                      onUpdate({ menu: updated })
                      setEditingItem(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    style={{ width: 80, height: 32, borderRadius: 6, border: '1px solid #00C37A', background: 'var(--glass)', color: '#00C37A', padding: '0 8px', fontSize: 14, textAlign: 'center', fontWeight: 700 }}
                  />
                ) : (
                  <span onClick={() => setEditingItem(`${cat}_${i}`)} style={{ fontSize: 16, fontWeight: 800, color: '#00C37A', cursor: 'text', minWidth: 70, textAlign: 'left' }}>
                    ₪
                    {(Number(item.price) || 0).toLocaleString()}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const updated = menu.filter((m) => m !== item)
                    setMenu(updated)
                    onUpdate({ menu: updated })
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginTop: 10, border: '1px solid rgba(0,195,122,0.3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 3 }}>שם המוצר *</label>
              <input value={newItem.name} onChange={(e) => setNewItem((f) => ({ ...f, name: e.target.value }))} placeholder="למשל: יימסון, בלאק לייבל..." style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 3 }}>קטגוריה *</label>
              <select
                value={newItem.category}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    const c = window.prompt('שם קטגוריה חדשה:')
                    if (c) { setCustomCategories((p) => [...p, c]); setNewItem((f) => ({ ...f, category: c })) }
                  } else setNewItem((f) => ({ ...f, category: e.target.value }))
                }}
                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
              >
                <option value="">בחר קטגוריה</option>
                {categoryOptions.filter((c, idx, arr) => arr.indexOf(c) === idx).map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ קטגוריה חדשה</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 3 }}>מחיר בש&quot;ח לליטר/בקבוק *</label>
              <input value={newItem.price} onChange={(e) => setNewItem((f) => ({ ...f, price: e.target.value }))} placeholder="₪0" type="number" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 3 }}>תיאור (אופציונלי)</label>
              <input value={newItem.description || ''} onChange={(e) => setNewItem((f) => ({ ...f, description: e.target.value }))} placeholder="פרטים נוספים על המוצר..." style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 3 }}>כניסות חינם לליטר/בקבוק</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={newItem.free_entries}
                  onChange={(e) => setNewItem((f) => ({ ...f, free_entries: parseInt(e.target.value, 10) || 0 }))}
                  type="number"
                  min="0"
                  max="10"
                  style={{ width: 80, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
                />
                <label style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={newItem.free_entries === 0}
                    onChange={(e) => setNewItem((f) => ({ ...f, free_entries: e.target.checked ? 0 : 3 }))}
                  />
                  ללא כניסות חינם
                </label>
              </div>
            </div>
          </div>

          <p style={{ margin: '10px 0 6px', fontSize: 12, fontWeight: 600 }}>תוספות כלולות:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXTRAS_OPTIONS.map((extra) => {
              const isSelected = newItem.included_extras.includes(extra)
              return (
                <span
                  key={extra}
                  role="presentation"
                  onClick={() => setNewItem((f) => ({
                    ...f,
                    included_extras: isSelected ? f.included_extras.filter((e) => e !== extra) : [...f.included_extras, extra],
                  }))}
                  style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 10, cursor: 'pointer',
                    background: isSelected ? 'rgba(0,195,122,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? '#00C37A' : 'rgba(255,255,255,0.1)'}`,
                    color: isSelected ? '#00C37A' : 'var(--v2-gray-400)',
                  }}
                >
                  {extra}
                </span>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => {
                if (!newItem.name || !newItem.price || !newItem.category) return
                const updated = [...menu, { ...newItem, price: parseFloat(newItem.price) }]
                setMenu(updated)
                onUpdate({ menu: updated })
                setNewItem({
                  name: '', category: '', price: '', description: '', unit: 'bottle', free_entries: 3, free_extras: 5, included_extras: [],
                })
                setShowAdd(false)
              }}
              style={{ flex: 1, height: 36, borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
            >
              הוסף מוצר
            </button>
            <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} style={{ width: '100%', height: 38, borderRadius: 8, border: '2px dashed rgba(0,195,122,0.3)', background: 'none', color: '#00C37A', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
          + הוסף מוצר
        </button>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            requestConfirm('לייבא תפריט מהתבנית לאירוע זה?', async () => {
              for (const item of menu) {
                const { id: _id, ...rest } = item
                await fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu`, {
                  method: 'POST',
                  headers: authHeaders(),
                  body: JSON.stringify({
                    name: rest.name,
                    category: rest.category,
                    price: rest.price,
                  }),
                }).catch(() => {})
              }
              toast.success(`${menu.length} פריטים יובאו לתפריט האירוע!`)
            })
          }}
          style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          ← ייבא תפריט לאירוע
        </button>
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/menu/${businessId}`
            navigator.clipboard?.writeText(url)
            toast.success('לינק תפריט הועתק!')
          }}
          style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          📋 העתק לינק תפריט
        </button>
      </div>
    </div>
  )
}

function TablesTemplate({ data, onUpdate }) {
  const [freeRule, setFreeRule] = useState(data?.free_rule || { people: 3, per_liter: 1, price_threshold: 1000, below_threshold_people: 2 })
  const [series, setSeries] = useState(data?.series || ['100-110', '200-210', '300-310', '400-410'])
  const [tableTypes, setTableTypes] = useState(data?.table_types || ['VIP', 'רגיל', 'DJ Booth', 'בר'])
  const [newSeries, setNewSeries] = useState('')
  const [newType, setNewType] = useState('')

  useEffect(() => {
    setFreeRule(data?.free_rule || { people: 3, per_liter: 1, price_threshold: 1000, below_threshold_people: 2 })
    setSeries(data?.series || ['100-110', '200-210', '300-310', '400-410'])
    setTableTypes(data?.table_types || ['VIP', 'רגיל', 'DJ Booth', 'בר'])
  }, [data])

  const save = () => onUpdate({ free_rule: freeRule, series, table_types: tableTypes })

  return (
    <div>
      <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>כלל חינם לליטר/בקבוק</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
              אנשים חינם (בקבוק מעל ₪
              {freeRule.price_threshold}
              )
            </label>
            <input value={freeRule.people} onChange={(e) => setFreeRule((f) => ({ ...f, people: parseInt(e.target.value, 10) || 3 }))} type="number" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>אנשים חינם (מתחת לסף)</label>
            <input value={freeRule.below_threshold_people} onChange={(e) => setFreeRule((f) => ({ ...f, below_threshold_people: parseInt(e.target.value, 10) || 2 }))} type="number" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>סף מחיר (₪)</label>
            <input value={freeRule.price_threshold} onChange={(e) => setFreeRule((f) => ({ ...f, price_threshold: parseInt(e.target.value, 10) || 1000 }))} type="number" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>תוספות לליטר</label>
            <input value={freeRule.per_liter} onChange={(e) => setFreeRule((f) => ({ ...f, per_liter: parseInt(e.target.value, 10) || 1 }))} type="number" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>סוגי/שמות שולחן</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tableTypes.map((ty, i) => (
            <span key={i} style={{ background: 'rgba(0,195,122,0.1)', color: '#00C37A', padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {ty}
              <button type="button" onClick={() => { const u = tableTypes.filter((_, idx) => idx !== i); setTableTypes(u); onUpdate({ ...data, table_types: u }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,195,122,0.5)', fontSize: 14, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="הוסף סוג שולחן..." style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 12 }} />
          <button type="button" onClick={() => { if (!newType.trim()) return; const u = [...tableTypes, newType.trim()]; setTableTypes(u); setNewType(''); onUpdate({ ...data, table_types: u }) }} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
      </div>

      <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>סדרות מספרי שולחן</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {series.map((s, i) => (
            <span key={i} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {s}
              <button type="button" onClick={() => { const u = series.filter((_, idx) => idx !== i); setSeries(u); onUpdate({ ...data, series: u }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(59,130,246,0.5)', fontSize: 14, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={newSeries} onChange={(e) => setNewSeries(e.target.value)} placeholder="למשל: 100-110" style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 12 }} />
          <button type="button" onClick={() => { if (!newSeries.trim()) return; const u = [...series, newSeries.trim()]; setSeries(u); setNewSeries(''); onUpdate({ ...data, series: u }) }} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: 'none', background: '#3B82F6', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
      </div>

      <button type="button" onClick={save} style={{ width: '100%', height: 40, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
        שמור הגדרות שולחנות
      </button>
    </div>
  )
}

function PromotersTemplate({ data: _data, onUpdate: _onUpdate, businessId, authHeaders }) {
  const [promoters, setPromoters] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newPromoter, setNewPromoter] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    identification_number: '',
    role: 'salesman',
    commission_per_ticket: 10,
    commission_per_table: 0,
    commission_type: 'pct',
    auto_approve_clients: false,
    genre_tags: [],
    seller_code: '',
    is_active: true,
    deals: [],
  })

  const ROLES = [
    { value: 'manager', label: 'מנהל' },
    { value: 'head_seller', label: 'ראש מוכרים' },
    { value: 'salesman', label: 'יחצ"ן' },
  ]

  const GENRE_TAGS = ['טכנו', 'מיינסטרים', 'היפ-הופ', 'R&B', 'ים תיכוני', 'אלקטרוני', 'כלל']

  useEffect(() => {
    console.log('[promoters] businessId:', businessId)
    if (!businessId) return
    fetch(`${API_BASE}/api/admin/promoters?business_id=${businessId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : (d.promoters || [])
        setPromoters(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [businessId, authHeaders])

  const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase()

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: 'var(--v2-gray-400)' }}>טוען...</div>

  return (
    <div>
      {promoters.map((p, i) => (
        <div
          key={p.id || i}
          style={{
            background: 'var(--glass)', borderRadius: 10, padding: 12, marginBottom: 8,
            border: `1px solid ${p.is_active !== false ? 'rgba(0,195,122,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,195,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C37A', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
              {(p.first_name || p.name || '?')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                {p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name}
                <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.15)', color: '#3B82F6', padding: '1px 6px', borderRadius: 8, marginRight: 6 }}>
                  {ROLES.find((r) => r.value === p.role)?.label || 'יחצ"ן'}
                </span>
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                {p.phone} · {p.email}
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {p.seller_code && (
                  <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '1px 6px', borderRadius: 8 }}>
                    קוד:
                    {' '}
                    {p.seller_code}
                  </span>
                )}
                {Number(p.commission_per_ticket) > 0 && (
                  <span style={{ fontSize: 10, background: 'rgba(0,195,122,0.1)', color: '#00C37A', padding: '1px 6px', borderRadius: 8 }}>
                    כרטיס:
                    {p.commission_per_ticket}
                    %
                  </span>
                )}
                {Number(p.commission_per_table) > 0 && (
                  <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', padding: '1px 6px', borderRadius: 8 }}>
                    שולחן: ₪
                    {p.commission_per_table}
                  </span>
                )}
                {p.auto_approve_clients && (
                  <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: '#22C55E', padding: '1px 6px', borderRadius: 8 }}>
                    אישור אוטומטי
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => {
                  const url = `https://axess.pro/e/?ref=${p.seller_code || p.id}`
                  navigator.clipboard?.writeText(url)
                  toast.success('לינק הועתק!')
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 11, padding: '4px 6px' }}
              >
                📋 לינק
              </button>
            </div>
          </div>
        </div>
      ))}

      {showAdd ? (
        <div style={{ background: 'var(--glass)', borderRadius: 12, padding: 16, border: '1px solid rgba(0,195,122,0.3)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>יחצ&quot;ן חדש</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input value={newPromoter.first_name} onChange={(e) => setNewPromoter((f) => ({ ...f, first_name: e.target.value }))} placeholder="שם פרטי *" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
              <input value={newPromoter.last_name} onChange={(e) => setNewPromoter((f) => ({ ...f, last_name: e.target.value }))} placeholder="שם משפחה *" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
            </div>

            <input value={newPromoter.phone} onChange={(e) => setNewPromoter((f) => ({ ...f, phone: e.target.value }))} placeholder="טלפון * (972...)" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
            <input value={newPromoter.email} onChange={(e) => setNewPromoter((f) => ({ ...f, email: e.target.value }))} placeholder="מייל" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
            <input value={newPromoter.identification_number} onChange={(e) => setNewPromoter((f) => ({ ...f, identification_number: e.target.value }))} placeholder="ת.ז (לחשבונית)" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

            <select value={newPromoter.role} onChange={(e) => setNewPromoter((f) => ({ ...f, role: e.target.value }))} style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newPromoter.seller_code} onChange={(e) => setNewPromoter((f) => ({ ...f, seller_code: e.target.value }))} placeholder="קוד יחצ'ן (ייווצר אוטומטי)" style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
              <button type="button" onClick={() => setNewPromoter((f) => ({ ...f, seller_code: generateCode() }))} style={{ height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
                🎲 צור
              </button>
            </div>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)' }}>עמלות:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 3 }}>% עמלה לכרטיס</label>
                <input value={newPromoter.commission_per_ticket} onChange={(e) => setNewPromoter((f) => ({ ...f, commission_per_ticket: parseFloat(e.target.value) || 0 }))} type="number" placeholder="10" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 3 }}>₪ עמלה לשולחן</label>
                <input value={newPromoter.commission_per_table} onChange={(e) => setNewPromoter((f) => ({ ...f, commission_per_table: parseFloat(e.target.value) || 0 }))} type="number" placeholder="0" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)' }}>תחומי חוזקה:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENRE_TAGS.map((tag) => {
                const isSelected = newPromoter.genre_tags.includes(tag)
                return (
                  <span
                    key={tag}
                    role="presentation"
                    onClick={() => setNewPromoter((f) => ({
                      ...f,
                      genre_tags: isSelected ? f.genre_tags.filter((t) => t !== tag) : [...f.genre_tags, tag],
                    }))}
                    style={{
                      fontSize: 12, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                      background: isSelected ? 'rgba(0,195,122,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isSelected ? '#00C37A' : 'rgba(255,255,255,0.1)'}`,
                      color: isSelected ? '#00C37A' : 'var(--v2-gray-400)',
                    }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={newPromoter.auto_approve_clients} onChange={(e) => setNewPromoter((f) => ({ ...f, auto_approve_clients: e.target.checked }))} />
              אישור לקוחות אוטומטי (ללא אישור מפיק)
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!newPromoter.first_name || !newPromoter.phone) return
                  const code = newPromoter.seller_code || generateCode()
                  const payload = {
                    ...newPromoter,
                    name: `${newPromoter.first_name} ${newPromoter.last_name}`.trim(),
                    seller_code: code,
                    business_id: businessId,
                  }
                  try {
                    const res = await fetch(`${API_BASE}/api/admin/promoters`, {
                      method: 'POST',
                      headers: authHeaders(),
                      body: JSON.stringify(payload),
                    })
                    const d = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      toast.error(d.error || 'שגיאה בשמירה')
                      return
                    }
                    const row = d.promoter || d
                    setPromoters((prev) => [...prev, row])
                    setNewPromoter({
                      first_name: '', last_name: '', phone: '', email: '', identification_number: '', role: 'salesman', commission_per_ticket: 10, commission_per_table: 0, commission_type: 'pct', auto_approve_clients: false, genre_tags: [], seller_code: '', is_active: true, deals: [],
                    })
                    setShowAdd(false)
                    toast.success('יחצ"ן נוסף בהצלחה!')
                  } catch (e) {
                    toast.error('שגיאה בשמירה')
                  }
                }}
                style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                הוסף יחצ&apos;ן
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} style={{ width: '100%', height: 40, borderRadius: 8, border: '2px dashed rgba(0,195,122,0.3)', background: 'none', color: '#00C37A', fontSize: 13, cursor: 'pointer' }}>
          + הוסף יחצ&quot;ן
        </button>
      )}
    </div>
  )
}

function ExpensesTemplate({ data, onUpdate, eventId, businessId: _businessId, authHeaders, requestConfirm }) {
  const [categories, setCategories] = useState(
    data?.categories || ['אמנים', 'ציוד', 'שמע ותאורה', 'אבטחה', 'שיווק', 'מקום', 'כיבוד', 'אחר'],
  )
  const [vendors, setVendors] = useState(data?.vendors || [])
  const [newCat, setNewCat] = useState('')
  const [newVendor, setNewVendor] = useState({
    vendor_name: '',
    category: '',
    vendor_type: 'none',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    default_price: '',
    items: [],
  })
  const [newVendorItem, setNewVendorItem] = useState({ name: '', price: '' })
  const [showAddVendor, setShowAddVendor] = useState(false)

  useEffect(() => {
    if (data && typeof data === 'object') {
      if (Array.isArray(data.categories)) setCategories(data.categories)
      if (Array.isArray(data.vendors)) setVendors(data.vendors)
    }
  }, [data])

  return (
    <div>
      <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>קטגוריות הוצאות</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {categories.map((cat, i) => (
            <span key={i} style={{ background: 'rgba(0,195,122,0.1)', color: '#00C37A', padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {cat}
              <button type="button" onClick={() => { const u = categories.filter((_, idx) => idx !== i); setCategories(u); onUpdate({ ...data, categories: u }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,195,122,0.5)', fontSize: 14, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="קטגוריה חדשה..." style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 12 }} />
          <button type="button" onClick={() => { if (!newCat.trim()) return; const u = [...categories, newCat.trim()]; setCategories(u); setNewCat(''); onUpdate({ ...data, categories: u }) }} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
      </div>

      <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>הספקים שלי</p>
          <button type="button" onClick={() => setShowAddVendor(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 12 }}>+ הוסף ספק</button>
        </div>

        {vendors.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{v.vendor_name}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--v2-gray-400)' }}>
                {v.category} · {v.contact_phone || v.phone}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await fetch(`${API_BASE}/api/admin/events/${eventId}/expenses`, {
                  method: 'POST',
                  headers: authHeaders(),
                  body: JSON.stringify({
                    category: v.category || 'other',
                    item_name: v.vendor_name,
                    amount: 0,
                    payment_status: 'pending',
                  }),
                }).catch(() => {})
                toast.success(`${v.vendor_name} נוסף להוצאות!`)
              }}
              style={{ background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.2)', borderRadius: 6, cursor: 'pointer', color: '#00C37A', fontSize: 11, padding: '3px 8px' }}
            >
              + לאירוע
            </button>
            <button type="button" onClick={() => { const u = vendors.filter((_, idx) => idx !== i); setVendors(u); onUpdate({ ...data, vendors: u }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {showAddVendor && (
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 14, marginTop: 10, border: '1px solid rgba(0,195,122,0.3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={newVendor.vendor_name} onChange={(e) => setNewVendor((f) => ({ ...f, vendor_name: e.target.value }))} placeholder="שם ספק *" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

              <select value={newVendor.vendor_type} onChange={(e) => setNewVendor((f) => ({ ...f, vendor_type: e.target.value }))} style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}>
                {VENDOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <select
                value={newVendor.category}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    const c = window.prompt('קטגוריה חדשה:')
                    if (c) { setCategories((p) => [...p, c]); setNewVendor((f) => ({ ...f, category: c })) }
                  } else setNewVendor((f) => ({ ...f, category: e.target.value }))
                }}
                style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
              >
                <option value="">בחר קטגוריה</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ קטגוריה חדשה</option>
              </select>

              <input value={newVendor.contact_name} onChange={(e) => setNewVendor((f) => ({ ...f, contact_name: e.target.value }))} placeholder="איש קשר" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

              <input value={newVendor.contact_phone} onChange={(e) => setNewVendor((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="טלפון" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

              <input value={newVendor.contact_email} onChange={(e) => setNewVendor((f) => ({ ...f, contact_email: e.target.value }))} placeholder="מייל (אופציונלי)" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

              <input value={newVendor.address || ''} onChange={(e) => setNewVendor((f) => ({ ...f, address: e.target.value }))} placeholder="כתובת (אופציונלי)" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

              <input value={newVendor.default_price} onChange={(e) => setNewVendor((f) => ({ ...f, default_price: e.target.value }))} placeholder="מחיר משוער ₪ (אופציונלי)" type="number" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

              <p style={{ margin: '4px 0', fontSize: 12, fontWeight: 700 }}>פריטים/שירותים:</p>
              {newVendor.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                  <span style={{ flex: 1 }}>{item.name} — ₪{item.price}</span>
                  <button type="button" onClick={() => setNewVendor((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== j) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={newVendorItem.name} onChange={(e) => setNewVendorItem((f) => ({ ...f, name: e.target.value }))} placeholder="שם פריט/שירות" style={{ flex: 2, height: 30, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 6px', fontSize: 12 }} />
                <input value={newVendorItem.price} onChange={(e) => setNewVendorItem((f) => ({ ...f, price: e.target.value }))} placeholder="₪" type="number" style={{ flex: 1, height: 30, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 6px', fontSize: 12 }} />
                <button
                  type="button"
                  onClick={() => {
                    if (!newVendorItem.name) return
                    setNewVendor((f) => ({ ...f, items: [...f.items, { ...newVendorItem, price: newVendorItem.price || 0 }] }))
                    setNewVendorItem({ name: '', price: '' })
                  }}
                  style={{ height: 30, padding: '0 8px', borderRadius: 6, border: 'none', background: 'rgba(0,195,122,0.2)', color: '#00C37A', fontWeight: 700, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!newVendor.vendor_name) return
                    const row = {
                      ...newVendor,
                      phone: newVendor.contact_phone,
                      items: newVendor.items.map((it) => ({ name: it.name, price: parseFloat(it.price) || 0 })),
                    }
                    const u = [...vendors, row]
                    setVendors(u)
                    onUpdate({ ...data, vendors: u })
                    setNewVendor({
                      vendor_name: '', category: '', vendor_type: 'none', contact_name: '', contact_phone: '', contact_email: '', address: '', default_price: '', items: [],
                    })
                    setShowAddVendor(false)
                  }}
                  style={{ flex: 1, height: 36, borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
                >
                  שמור ספק
                </button>
                <button type="button" onClick={() => setShowAddVendor(false)} style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          requestConfirm('לייבא קטגוריות הוצאות לאירוע זה?', async () => {
            toast.success('קטגוריות יובאו!')
          })
        }}
        style={{ width: '100%', height: 40, borderRadius: 8, border: 'none', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
      >
        ← ייבא קטגוריות לאירוע
      </button>
    </div>
  )
}
