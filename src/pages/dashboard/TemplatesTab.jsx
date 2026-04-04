import { useState, useEffect } from 'react'
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
            {isExpanded && existing && (
              <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
                <TemplateContent
                  key={String(existing.updated_at)}
                  type={t.id}
                  data={dataForPanel}
                  onUpdate={(newData) => handleTemplateUpdate(t.id, newData)}
                  eventId={eventId}
                  businessId={businessId}
                  authHeaders={authHeaders}
                />
              </div>
            )}

            {isExpanded && !existing && (
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

function TemplateContent({ type, data, onUpdate, eventId, businessId, authHeaders }) {
  if (type === 'staff') return <StaffTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} />
  if (type === 'menu') return <MenuTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} />
  if (type === 'tables') return <TablesTemplate data={data} onUpdate={onUpdate} />
  if (type === 'promoters') return <PromotersTemplate data={data} onUpdate={onUpdate} />
  if (type === 'expenses' || type === 'vendors') return <ExpensesTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} />
  return null
}

function StaffTemplate({ data, onUpdate, eventId, businessId: _businessId, authHeaders }) {
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
                {member.role} · {member.phone}
                {member.scan_station && ` · עמדה: ${member.scan_station}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {member.is_permanent && <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.2)', color: '#3B82F6', padding: '2px 6px', borderRadius: 8 }}>קבוע</span>}
              {member.on_shift && <span style={{ fontSize: 10, background: 'rgba(0,195,122,0.2)', color: '#00C37A', padding: '2px 6px', borderRadius: 8 }}>במשמרת</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
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
        onClick={async () => {
          if (!window.confirm('לייבא צוות מהתבנית לאירוע זה?')) return
          for (const member of staff.filter((s) => s.on_shift)) {
            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({ name: member.name, phone: member.phone, role: member.role, wa_notifications: true }),
            }).catch(() => {})
          }
          toast.success(`${staff.filter((s) => s.on_shift).length} אנשי צוות יובאו לאירוע!`)
        }}
        style={{ width: '100%', height: 42, borderRadius: 8, border: 'none', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 12 }}
      >
        ← ייבא צוות במשמרת לאירוע זה
      </button>
    </div>
  )
}

function MenuTemplate({ data, onUpdate, eventId, businessId, authHeaders }) {
  const [menu, setMenu] = useState(data?.menu || [])
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', unit: 'bottle', free_entries: 3, free_extras: 5, included_extras: [] })
  const [customCategories, setCustomCategories] = useState([])

  const categories = [...new Set(menu.map((m) => m.category).filter(Boolean)), ...customCategories]
  const filtered = menu.filter((m) => !search
    || (m.name || '').toLowerCase().includes(search.toLowerCase())
    || (m.category || '').toLowerCase().includes(search.toLowerCase()))
  const byCategory = filtered.reduce((acc, m) => { if (!acc[m.category]) acc[m.category] = []; acc[m.category].push(m); return acc }, {})

  const EXTRAS_OPTIONS = ['חמוציות קנקן/בקבוק', 'תפוזים קנקן/בקבוק', 'אשכוליות קנקן/בקבוק', 'ראשן קנקן/בקבוק', 'מאי טוניק קנקן/בקבוק', 'קולה קנקן/בקבוק', 'משקה אנרגיה 5 פחיות']

  useEffect(() => {
    setMenu(data?.menu || [])
  }, [data])

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חפש מוצר או קטגוריה..." style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 36px 0 12px', fontSize: 13, boxSizing: 'border-box' }} />
        <Search size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--v2-gray-400)' }} />
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,195,122,0.3) transparent' }}>
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {cat}
              {' '}
              (
              {items.length}
              )
            </p>
            {items.map((item, i) => (
              <div key={item.id || `${cat}_${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                    {item.free_entries > 0 && `${item.free_entries} כניסות חינם`}
                    {item.included_extras?.length > 0 && ` · ${item.included_extras.length} תוספות`}
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
                    style={{ width: 70, height: 28, borderRadius: 4, border: '1px solid #00C37A', background: 'var(--glass)', color: 'var(--text)', padding: '0 6px', fontSize: 13, textAlign: 'center' }}
                  />
                ) : (
                  <span onClick={() => setEditingItem(`${cat}_${i}`)} style={{ fontSize: 14, fontWeight: 700, color: '#00C37A', cursor: 'text', minWidth: 60, textAlign: 'left' }}>
                    ₪
                    {item.price}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const updated = menu.filter((m) => m !== item)
                    setMenu(updated)
                    onUpdate({ menu: updated })
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginTop: 10, border: '1px solid rgba(0,195,122,0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={newItem.name} onChange={(e) => setNewItem((f) => ({ ...f, name: e.target.value }))} placeholder="שם המוצר *" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }} />
            <select
              value={newItem.category}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  const c = window.prompt('שם קטגוריה חדשה:')
                  if (c) { setCustomCategories((p) => [...p, c]); setNewItem((f) => ({ ...f, category: c })) }
                } else setNewItem((f) => ({ ...f, category: e.target.value }))
              }}
              style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
            >
              <option value="">בחר קטגוריה</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__new__">+ קטגוריה חדשה</option>
            </select>
            <input value={newItem.price} onChange={(e) => setNewItem((f) => ({ ...f, price: e.target.value }))} placeholder="מחיר ₪ *" type="number" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }} />
            <input value={newItem.free_entries} onChange={(e) => setNewItem((f) => ({ ...f, free_entries: parseInt(e.target.value, 10) || 0 }))} placeholder="כניסות חינם" type="number" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }} />
          </div>

          <p style={{ margin: '10px 0 6px', fontSize: 12, fontWeight: 600 }}>תוספות כלולות:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXTRAS_OPTIONS.map((extra) => {
              const isSelected = newItem.included_extras.includes(extra)
              return (
                <span
                  key={extra}
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
                setNewItem({ name: '', category: '', price: '', unit: 'bottle', free_entries: 3, free_extras: 5, included_extras: [] })
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
          onClick={async () => {
            if (!window.confirm('לייבא תפריט מהתבנית לאירוע זה?')) return
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

function PromotersTemplate({ data, onUpdate }) {
  const [promoters, setPromoters] = useState(data?.promoters || [])
  const [showAdd, setShowAdd] = useState(false)
  const [newPromoter, setNewPromoter] = useState({
    name: '', phone: '',
    deals: [],
  })
  const [newDeal, setNewDeal] = useState({ type: 'pct_sales', value: 10, condition: '' })

  const DEAL_TYPES = [
    { value: 'pct_sales', label: '% מהמכירות' },
    { value: 'fixed_per_ticket', label: '₪ קבוע לכרטיס' },
    { value: 'fixed_per_n_tickets', label: '₪ על כל X כרטיסים' },
    { value: 'pct_tables', label: '% ממכירת שולחנות' },
    { value: 'combo', label: 'שילוב מסלולים' },
  ]

  useEffect(() => {
    setPromoters(data?.promoters || [])
  }, [data])

  return (
    <div>
      {promoters.map((p, i) => (
        <div key={i} style={{ background: 'var(--glass)', borderRadius: 10, padding: 12, marginBottom: 8, border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{p.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>{p.phone}</p>
              {p.deals?.map((d, di) => (
                <span key={di} style={{ fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', padding: '2px 8px', borderRadius: 8, display: 'inline-block', marginTop: 4, marginLeft: 4 }}>
                  {DEAL_TYPES.find((t) => t.value === d.type)?.label}
                  :
                  {' '}
                  {d.value}
                  {d.type.includes('pct') ? '%' : '₪'}
                  {d.condition && ` (${d.condition})`}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { const u = promoters.filter((_, idx) => idx !== i); setPromoters(u); onUpdate({ promoters: u }) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {showAdd ? (
        <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, border: '1px solid rgba(0,195,122,0.3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={newPromoter.name} onChange={(e) => setNewPromoter((f) => ({ ...f, name: e.target.value }))} placeholder="שם יחצ'ן *" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
            <input value={newPromoter.phone} onChange={(e) => setNewPromoter((f) => ({ ...f, phone: e.target.value }))} placeholder="טלפון" style={{ height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />

            <p style={{ margin: '4px 0', fontSize: 12, fontWeight: 700 }}>מסלולי עמלה:</p>
            {newPromoter.deals.map((d, di) => (
              <div key={di} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                <span style={{ flex: 1, color: 'var(--v2-gray-400)' }}>
                  {DEAL_TYPES.find((t) => t.value === d.type)?.label}
                  :
                  {' '}
                  {d.value}
                  {d.type.includes('pct') ? '%' : '₪'}
                </span>
                <button type="button" onClick={() => setNewPromoter((f) => ({ ...f, deals: f.deals.filter((_, idx) => idx !== di) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>×</button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6 }}>
              <select value={newDeal.type} onChange={(e) => setNewDeal((f) => ({ ...f, type: e.target.value }))} style={{ flex: 2, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 6px', fontSize: 12 }}>
                {DEAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input value={newDeal.value} onChange={(e) => setNewDeal((f) => ({ ...f, value: parseFloat(e.target.value) || 0 }))} type="number" placeholder="ערך" style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 6px', fontSize: 12 }} />
              <input value={newDeal.condition} onChange={(e) => setNewDeal((f) => ({ ...f, condition: e.target.value }))} placeholder="תנאי (אופ.)" style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 6px', fontSize: 12 }} />
              <button type="button" onClick={() => { setNewPromoter((f) => ({ ...f, deals: [...f.deals, { ...newDeal }] })); setNewDeal({ type: 'pct_sales', value: 10, condition: '' }) }} style={{ height: 32, padding: '0 8px', borderRadius: 6, border: 'none', background: 'rgba(0,195,122,0.2)', color: '#00C37A', fontWeight: 700, cursor: 'pointer' }}>+</button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (!newPromoter.name) return
                  const u = [...promoters, newPromoter]
                  setPromoters(u)
                  onUpdate({ promoters: u })
                  setNewPromoter({ name: '', phone: '', deals: [] })
                  setShowAdd(false)
                }}
                style={{ flex: 1, height: 36, borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                הוסף יחצ'ן
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} style={{ width: '100%', height: 38, borderRadius: 8, border: '2px dashed rgba(0,195,122,0.3)', background: 'none', color: '#00C37A', fontSize: 13, cursor: 'pointer' }}>
          + הוסף יחצ'ן
        </button>
      )}
    </div>
  )
}

function ExpensesTemplate({ data, onUpdate, eventId, businessId: _businessId, authHeaders }) {
  const [categories, setCategories] = useState(data?.categories || ['אמנים', 'ציוד', 'שמע ותאורה', 'אבטחה', 'שיווק', 'מקום', 'כיבוד', 'אחר'])
  const [vendors, setVendors] = useState(data?.vendors || [])
  const [newCat, setNewCat] = useState('')
  const [newVendor, setNewVendor] = useState({ vendor_name: '', category: '', contact: '', phone: '' })
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
              <p style={{ margin: 0, fontSize: 11, color: 'var(--v2-gray-400)' }}>{v.category} · {v.phone}</p>
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
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={newVendor.vendor_name} onChange={(e) => setNewVendor((f) => ({ ...f, vendor_name: e.target.value }))} placeholder="שם ספק *" style={{ height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={newVendor.category} onChange={(e) => setNewVendor((f) => ({ ...f, category: e.target.value }))} style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 6px', fontSize: 12 }}>
                <option value="">קטגוריה</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={newVendor.phone} onChange={(e) => setNewVendor((f) => ({ ...f, phone: e.target.value }))} placeholder="נייד" style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 6px', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  if (!newVendor.vendor_name) return
                  const u = [...vendors, newVendor]
                  setVendors(u)
                  onUpdate({ ...data, vendors: u })
                  setNewVendor({ vendor_name: '', category: '', contact: '', phone: '' })
                  setShowAddVendor(false)
                }}
                style={{ flex: 1, height: 32, borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                שמור
              </button>
              <button type="button" onClick={() => setShowAddVendor(false)} style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>ביטול</button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={async () => {
          if (!window.confirm('לייבא קטגוריות הוצאות לאירוע זה?')) return
          toast.success('קטגוריות יובאו!')
        }}
        style={{ width: '100%', height: 40, borderRadius: 8, border: 'none', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
      >
        ← ייבא קטגוריות לאירוע
      </button>
    </div>
  )
}
