import { useState, useEffect } from 'react'
import { Users, UtensilsCrossed, LayoutGrid, Megaphone, Store, Receipt, Save, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
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

  useEffect(() => {
    loadTemplates()
  }, [businessId])

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

        return (
          <div key={t.id} style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${isExpanded ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`, overflow: 'hidden', transition: 'all 0.2s' }}>

            {/* כותרת */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--glass)', cursor: 'pointer' }}
              onClick={() => setExpanded(isExpanded ? null : t.id)}
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
                  type={t.id}
                  data={existing.template_data}
                  onUpdate={(newData) => updateTemplateData(t.id, newData)}
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

// תצוגת תוכן תבנית לפי סוג:
function TemplateContent({ type, data, onUpdate }) {
  if (type === 'staff') {
    const staff = data?.staff || []
    return (
      <div>
        {staff.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginRight: 8 }}>{s.role}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{s.phone}</span>
            <button
              type="button"
              onClick={() => onUpdate({ staff: staff.filter((_, idx) => idx !== i) })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {staff.length === 0 && <p style={{ fontSize: 12, color: 'var(--v2-gray-400)', margin: 0 }}>אין צוות בתבנית</p>}
      </div>
    )
  }

  if (type === 'expenses') {
    const categories = data?.categories || []
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map((cat, i) => (
            <span key={i} style={{ background: 'rgba(0,195,122,0.1)', color: '#00C37A', padding: '3px 10px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {cat}
              <button
                type="button"
                onClick={() => onUpdate({ categories: categories.filter((_, idx) => idx !== i) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,195,122,0.5)', fontSize: 14, padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'tables') {
    const tables = data?.tables || []
    return (
      <div>
        {tables.slice(0, 5).map((tbl, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '3px 0', color: 'var(--v2-gray-400)' }}>
            <span>
              שולחן
              {tbl.table_number}
            </span>
            {tbl.table_name && <span>— {tbl.table_name}</span>}
            <span>
              (
              {tbl.capacity}
              {' '}
              אנשים)
            </span>
          </div>
        ))}
        {tables.length > 5 && <p style={{ fontSize: 11, color: 'var(--v2-gray-400)', margin: '4px 0 0' }}>ועוד {tables.length - 5}...</p>}
      </div>
    )
  }

  if (type === 'menu') {
    const menu = data?.menu || []
    const byCategory = menu.reduce((acc, m) => { if (!acc[m.category]) acc[m.category] = []; acc[m.category].push(m); return acc }, {})
    return (
      <div>
        {Object.entries(byCategory).slice(0, 3).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 6 }}>
            <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{cat}</p>
            {items.slice(0, 3).map((item, i) => (
              <span key={i} style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginLeft: 8 }}>
                {item.name}
                {' '}
                ₪
                {item.price}
              </span>
            ))}
          </div>
        ))}
        {menu.length > 0 && <p style={{ fontSize: 11, color: 'var(--v2-gray-400)', margin: '4px 0 0' }}>סה&quot;כ {menu.length} פריטים</p>}
      </div>
    )
  }

  // promoters, vendors:
  const items = data?.promoters || data?.vendors || []
  return (
    <div>
      {items.slice(0, 5).map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: 'var(--v2-gray-400)', padding: '2px 0' }}>
          {item.name || item.vendor_name}
          {item.commission_pct && ` — ${item.commission_pct}%`}
        </div>
      ))}
      {items.length === 0 && <p style={{ fontSize: 12, color: 'var(--v2-gray-400)', margin: 0 }}>אין פריטים בתבנית</p>}
    </div>
  )
}
