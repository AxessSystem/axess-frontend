import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, UtensilsCrossed, LayoutGrid, Megaphone, Store, Receipt, Save, ChevronDown, ChevronUp, Pencil, Trash2, Search, Plus, X, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

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

const EXPENSE_CATEGORIES = [
  { value: 'staff', label: 'כוח אדם' },
  { value: 'lineup', label: 'ליינאפ' },
  { value: 'marketing', label: 'שיווק' },
  { value: 'operations', label: 'תפעול' },
  { value: 'fixed', label: 'עלויות קבועות' },
  { value: 'other', label: 'שונות' },
]

const INVOICE_TYPES = [
  { value: 'authorized', label: 'מורשה' },
  { value: 'ltd', label: 'בע"מ' },
  { value: 'exempt', label: 'פטור' },
  { value: 'none', label: 'ללא' },
]

const ICONS = {
  users: <Users size={20} color="#00C37A" />,
  utensils: <UtensilsCrossed size={20} color="#00C37A" />,
  grid: <LayoutGrid size={20} color="#00C37A" />,
  megaphone: <Megaphone size={20} color="#00C37A" />,
  store: <Store size={20} color="#00C37A" />,
  receipt: <Receipt size={20} color="#00C37A" />,
}

const SELECT_MENU_STYLE = { background: '#1e2130', maxHeight: 240, overflowY: 'auto' }

const ConfirmModal = ({ title, message, confirmText, confirmColor = '#ef4444', onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  }}
  >
    <div style={{
      background: 'var(--card)', borderRadius: 16,
      padding: 28, maxWidth: 380, width: '100%',
      border: '1px solid var(--glass-border)', textAlign: 'center',
    }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{title}</h3>
      <p
        style={{
          color: 'var(--v2-gray-400)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px',
        }}
        dangerouslySetInnerHTML={{ __html: message }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, height: 44, borderRadius: 10,
            border: '1px solid var(--glass-border)',
            background: 'transparent', color: 'var(--text)',
            fontSize: 15, cursor: 'pointer',
          }}
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            flex: 1, height: 44, borderRadius: 10, border: 'none',
            background: confirmColor, color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
)

function pickActiveRowId(list, businessId) {
  if (!list.length) return null
  const owned = list.filter((x) => String(x.business_id) === String(businessId) && !x.is_system)
  const def = owned.find((x) => x.is_default) || owned[0]
  if (def) return def.id
  return list[0].id
}

export default function TemplatesTab({ eventId, businessId, authHeaders }) {
  const [allTemplates, setAllTemplates] = useState([])
  const [activeRowIdByType, setActiveRowIdByType] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)
  const [templateData, setTemplateData] = useState({})
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmSave, setConfirmSave] = useState(null)
  const [confirmUpgrade, setConfirmUpgrade] = useState(false)
  const [upgradeTypeKey, setUpgradeTypeKey] = useState(null)
  const [duplicateModal, setDuplicateModal] = useState(null)
  const [eventSlug, setEventSlug] = useState('')

  const requestConfirm = useCallback((message, onConfirm) => {
    setConfirmAction({
      title: 'אישור פעולה',
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
    if (!eventId || !businessId) return
    let cancelled = false
    fetch(`${API_BASE}/api/admin/events/${eventId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((ev) => {
        if (cancelled || !ev || ev.error) return
        setEventSlug(ev.slug || '')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [eventId, businessId, authHeaders])

  const templatesByType = useMemo(() => {
    const m = {}
    for (const row of allTemplates) {
      if (!m[row.template_type]) m[row.template_type] = []
      m[row.template_type].push(row)
    }
    return m
  }, [allTemplates])

  useEffect(() => {
    if (!expanded) return
    const rid = activeRowIdByType[expanded]
    const row = allTemplates.find((x) => x.id === rid)
    if (row) setTemplateData(row.template_data || {})
  }, [expanded, activeRowIdByType, allTemplates])

  const loadTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/business/${businessId}/templates`, { headers: authHeaders() })
      const data = await res.json()
      const list = data.templates || []
      setAllTemplates(list)
      const next = {}
      for (const tt of TEMPLATE_TYPES) {
        const sub = list.filter((x) => x.template_type === tt.id)
        if (sub.length) next[tt.id] = pickActiveRowId(sub, businessId)
      }
      setActiveRowIdByType(next)
    } catch (e) {
      console.error('loadTemplates error:', e)
    } finally {
      setLoading(false)
    }
  }

  const rowPatchBody = (typeKey, newData) => {
    const rid = activeRowIdByType[typeKey]
    const row = allTemplates.find((x) => x.id === rid)
    const useTid = row && !row.is_system && String(row.business_id) === String(businessId)
    const body = { template_data: newData }
    if (useTid && rid) body.template_id = rid
    return body
  }

  const saveTemplate = (templateType) => {
    setConfirmSave({ templateType })
  }

  const doSaveTemplate = async (templateType) => {
    setSaving(templateType)
    try {
      const rid = activeRowIdByType[templateType]
      const row = allTemplates.find((x) => x.id === rid)
      const useTid = row && !row.is_system && String(row.business_id) === String(businessId)
      const payload = { template_type: templateType, source_event_id: eventId }
      if (useTid && rid) payload.template_id = rid
      const res = await fetch(`${API_BASE}/api/admin/business/${businessId}/templates`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      const updated = data.template
      setAllTemplates((prev) => {
        const i = prev.findIndex((x) => x.id === updated.id)
        if (i >= 0) {
          const cp = [...prev]
          cp[i] = updated
          return cp
        }
        return [...prev, updated]
      })
      setActiveRowIdByType((p) => ({ ...p, [templateType]: updated.id }))
      setTemplateData(updated.template_data || {})
      toast.success('תבנית יובאה מהאירוע!')
    } catch (e) {
      toast.error(e.message || 'שגיאה בשמירה')
    } finally {
      setSaving(null)
    }
  }

  const handleTemplateUpdate = async (type, newData) => {
    const rid = activeRowIdByType[type]
    setAllTemplates((prev) => prev.map((row) => (row.id === rid ? { ...row, template_data: newData } : row)))
    await fetch(`${API_BASE}/api/admin/business/${businessId}/templates/${type}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(rowPatchBody(type, newData)),
    })
  }

  const duplicateTemplate = (templateId) => {
    const row = allTemplates.find((x) => x.id === templateId)
    const base = row?.template_name || 'תבנית'
    setDuplicateModal({ templateId, typeKey: row?.template_type, name: `${base} (עותק)` })
  }

  const upgradeTemplate = async (templateType) => {
    const res = await fetch(`${API_BASE}/api/admin/business/${businessId}/templates/upgrade`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ template_type: templateType }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
    await loadTemplates()
  }

  const toggleExpand = (t, existing, isExpanded) => {
    if (isExpanded) {
      setExpanded(null)
      setTemplateData({})
      return
    }
    setExpanded(t.id)
    if (existing) {
      setTemplateData(existing.template_data || {})
    } else {
      setTemplateData({})
    }
  }

  const systemNewerThanBizDefault = (typeKey) => {
    const systemT = allTemplates.find((x) => x.template_type === typeKey && x.is_system)
    const bizDefault = allTemplates.find((x) => x.template_type === typeKey
      && String(x.business_id) === String(businessId) && x.is_default && !x.is_system)
    if (!systemT || !bizDefault) return false
    return new Date(systemT.updated_at) > new Date(bizDefault.updated_at)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)' }}>טוען...</div>

  return (
    <div>
      {confirmSave && (
        <ConfirmModal
          title="עדכון תבנית עסק"
          message="שינויים אלו <strong>יחולו על כל האירועים העתידיים</strong> שלך כברירת מחדל.<br/>אירועים קיימים לא יושפעו."
          confirmText="עדכן תבנית"
          confirmColor="#00C37A"
          onConfirm={async () => {
            const { templateType } = confirmSave
            setConfirmSave(null)
            await handleTemplateUpdate(templateType, templateData)
            toast.success('תבנית עודכנה בהצלחה!')
          }}
          onCancel={() => setConfirmSave(null)}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText="אישור"
          confirmColor="#00C37A"
          onConfirm={() => { Promise.resolve(confirmAction.onConfirm()).catch(() => {}) }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmUpgrade && upgradeTypeKey && (
        <ConfirmModal
          title="שדרוג לתבנית מערכת"
          message={'פעולה זו תחליף את התבנית הנוכחית בגרסה החדשה של תבנית המערכת.<br/><strong>שינויים שערכת ידנית יאבדו.</strong>'}
          confirmText="שדרג"
          confirmColor="#00C37A"
          onConfirm={async () => {
            setConfirmUpgrade(false)
            try {
              await upgradeTemplate(upgradeTypeKey)
              toast.success('התבנית שודרגה בהצלחה!')
            } catch (e) {
              toast.error(e.message || 'שגיאה')
            }
          }}
          onCancel={() => setConfirmUpgrade(false)}
        />
      )}
      {duplicateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        >
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%',
            border: '1px solid var(--glass-border)',
          }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>שם לתבנית המשוכפלת</h3>
            <input
              value={duplicateModal.name}
              onChange={(e) => setDuplicateModal((m) => ({ ...m, name: e.target.value }))}
              style={{
                width: '100%', height: 40, borderRadius: 8, marginBottom: 16,
                border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setDuplicateModal(null)} style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>ביטול</button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/api/admin/business/${businessId}/templates/duplicate`, {
                      method: 'POST',
                      headers: authHeaders(),
                      body: JSON.stringify({ template_id: duplicateModal.templateId, new_name: duplicateModal.name.trim() || 'עותק' }),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(data.error || 'שגיאה')
                    const created = data.template
                    setAllTemplates((prev) => [...prev, created])
                    if (duplicateModal.typeKey) {
                      setActiveRowIdByType((p) => ({ ...p, [duplicateModal.typeKey]: created.id }))
                      setTemplateData(created.template_data || {})
                    }
                    setDuplicateModal(null)
                    toast.success('תבנית שוכפלה')
                  } catch (e) {
                    toast.error(e.message || 'שגיאה')
                  }
                }}
                style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                שכפל
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
        const list = templatesByType[t.id] || []
        const activeTemplateId = activeRowIdByType[t.id] || pickActiveRowId(list, businessId)
        const existing = list.find((r) => r.id === activeTemplateId) || list[0]
        const isExpanded = expanded === t.id
        const dataForPanel = isExpanded ? templateData : (existing?.template_data || {})
        const alwaysShow = ['staff', 'promoters', 'vendors']
        const canUpgrade = systemNewerThanBizDefault(t.id)

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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {isExpanded ? <ChevronUp size={16} color="var(--v2-gray-400)" /> : <ChevronDown size={16} color="var(--v2-gray-400)" />}
              </div>
            </div>

            {/* תוכן מורחב */}
            {isExpanded && (existing || alwaysShow.includes(t.id)) && (
              <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
                {/* שורת כפתורים — responsive */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 16,
                  alignItems: 'center',
                }}
                >
                  {list.length > 0 && (
                    <CustomSelect
                      value={activeTemplateId || ''}
                      onChange={(v) => {
                        setActiveRowIdByType((p) => ({ ...p, [t.id]: v }))
                        const row = list.find((r) => r.id === v)
                        if (row) setTemplateData(row.template_data || {})
                      }}
                      options={list.map((row) => ({
                        value: row.id,
                        label: `${row.template_name || row.template_type}${row.is_default ? ' ★' : ''}`,
                      }))}
                      style={{ flex: '1 1 140px', minWidth: 0, background: '#1e2130' }}
                      menuStyle={SELECT_MENU_STYLE}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      title="שכפל תבנית"
                      onClick={() => activeTemplateId && duplicateTemplate(activeTemplateId)}
                      disabled={!activeTemplateId}
                      style={{
                        height: 36, width: 36, borderRadius: 8,
                        border: '1px solid var(--glass-border)',
                        background: 'transparent', color: 'var(--text)',
                        cursor: activeTemplateId ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Copy size={14} />
                    </button>
                    {canUpgrade && (
                      <button
                        type="button"
                        title="שדרג לתבנית מערכת"
                        onClick={() => { setUpgradeTypeKey(t.id); setConfirmUpgrade(true) }}
                        style={{
                          height: 36, padding: '0 10px', borderRadius: 8,
                          border: '1px solid #00C37A',
                          background: 'rgba(0,195,122,0.1)',
                          color: '#00C37A', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600,
                        }}
                      >
                        ↑
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const payload = expanded === t.id
                          ? templateData
                          : (existing?.template_data || {})

                        const menuItems = payload.menu || []
                        if (!menuItems.length) return

                        try {
                          // עדכן כל פריט ב-event_table_menu של האירוע
                          await Promise.all(menuItems.map((item) => item.id && fetch(
                            `${API_BASE}/api/admin/events/${eventId}/table-menu/${item.id}`,
                            {
                              method: 'PATCH',
                              headers: authHeaders(),
                              body: JSON.stringify({
                                price: item.price,
                                name: item.name,
                                free_entries: item.free_entries,
                                free_extras: item.free_extras,
                                free_extras_type: item.free_extras_type,
                                included_extras: item.included_extras || [],
                              }),
                            },
                          )))
                          toast.success('התפריט עודכן לאירוע זה בלבד ✓')
                        } catch (err) {
                          toast.error('שגיאה בשמירת התפריט לאירוע')
                        }
                      }}
                      style={{
                        height: 36, padding: '0 12px', borderRadius: 8,
                        border: '1px solid var(--glass-border)',
                        background: 'transparent', color: 'var(--text)',
                        fontSize: 13, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      שמור לאירוע
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmSave({ templateType: t.id })}
                      disabled={saving === t.id}
                      style={{
                        height: 36, padding: '0 12px', borderRadius: 8,
                        border: 'none', background: '#00C37A',
                        color: '#000', fontWeight: 700,
                        fontSize: 13, cursor: saving === t.id ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Save size={13} />
                      <span>עדכן תבנית</span>
                    </button>
                  </div>
                </div>
                <TemplateContent
                  key={`${activeTemplateId ?? 'x'}_${String(existing?.updated_at ?? t.id)}`}
                  type={t.id}
                  data={dataForPanel}
                  onUpdate={(newData) => handleTemplateUpdate(t.id, newData)}
                  eventId={eventId}
                  businessId={businessId}
                  authHeaders={authHeaders}
                  requestConfirm={requestConfirm}
                  eventSlug={eventSlug}
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

function TemplateContent({ type, data, onUpdate, eventId, businessId, authHeaders, requestConfirm, eventSlug }) {
  if (type === 'staff') return <StaffTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} requestConfirm={requestConfirm} />
  if (type === 'menu') return <MenuTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} requestConfirm={requestConfirm} />
  if (type === 'tables') return <TablesTemplate data={data} onUpdate={onUpdate} />
  if (type === 'promoters') return <PromotersTemplate key="promoters" data={data} onUpdate={onUpdate} businessId={businessId} authHeaders={authHeaders} eventSlug={eventSlug} />
  if (type === 'vendors') return <VendorsTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} />
  if (type === 'expenses') return <ExpensesTemplate data={data} onUpdate={onUpdate} eventId={eventId} businessId={businessId} authHeaders={authHeaders} requestConfirm={requestConfirm} />
  return null
}

function StaffTemplate({ data, onUpdate, eventId, businessId, authHeaders, requestConfirm }) {
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

  const [allEvents, setAllEvents] = useState([])
  const [sourceEventId, setSourceEventId] = useState(eventId)
  const [showEventPicker, setShowEventPicker] = useState(false)
  const selectedEvent = allEvents.find((ev) => ev.id === sourceEventId)
  const [memberExtraRoleIdx, setMemberExtraRoleIdx] = useState(null)
  const [memberExtraRoleText, setMemberExtraRoleText] = useState('')
  const [newMemberCustomRoleOpen, setNewMemberCustomRoleOpen] = useState(false)
  const [newMemberCustomRoleDraft, setNewMemberCustomRoleDraft] = useState('')

  const ROLES = [
    'בעלים', 'מנהל ערב', 'מנהל שולחנות', 'מנהל בר',
    'מלצר/ית', 'קופאי/ת', 'סלקטור/ית', 'סורק/ת', 'מארח/ת', 'ברמן/ית',
  ]
  const [customRoles, setCustomRoles] = useState([])
  const allRoles = [...ROLES, ...customRoles]

  useEffect(() => {
    setStaff(data?.staff || [])
  }, [data])

  useEffect(() => {
    if (!businessId || !authHeaders) return
    fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setAllEvents(Array.isArray(d) ? d : []))
  }, [businessId])

  useEffect(() => {
    if (!sourceEventId || !authHeaders) return
    fetch(`${API_BASE}/api/admin/events/${sourceEventId}/table-staff`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const dbStaff = d.staff || []
        if (dbStaff.length > 0) setStaff(dbStaff)
      })
      .catch(() => {})
  }, [sourceEventId])

  return (
    <div>
      {memberExtraRoleIdx !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        >
          <div style={{ background: 'var(--card)', borderRadius: 14, padding: 22, width: '100%', maxWidth: 360, border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 700 }}>הוסף תפקיד לאירוע זה</p>
            <input
              value={memberExtraRoleText}
              onChange={(e) => setMemberExtraRoleText(e.target.value)}
              placeholder="שם תפקיד"
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', marginBottom: 14, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setMemberExtraRoleIdx(null); setMemberExtraRoleText('') }} style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>ביטול</button>
              <button
                type="button"
                onClick={() => {
                  const role = memberExtraRoleText.trim()
                  if (!role) return
                  const i = memberExtraRoleIdx
                  const updated = staff.map((s, idx) => (idx === i ? {
                    ...s,
                    roles: [...(Array.isArray(s.roles) ? s.roles : [s.role].filter(Boolean)), role],
                  } : s))
                  setStaff(updated)
                  onUpdate({ staff: updated })
                  setMemberExtraRoleIdx(null)
                  setMemberExtraRoleText('')
                }}
                style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                הוסף
              </button>
            </div>
          </div>
        </div>
      )}
      {newMemberCustomRoleOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        >
          <div style={{ background: 'var(--card)', borderRadius: 14, padding: 22, width: '100%', maxWidth: 360, border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 700 }}>שם תפקיד חדש</p>
            <input
              value={newMemberCustomRoleDraft}
              onChange={(e) => setNewMemberCustomRoleDraft(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', marginBottom: 14, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setNewMemberCustomRoleOpen(false); setNewMemberCustomRoleDraft('') }} style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>ביטול</button>
              <button
                type="button"
                onClick={() => {
                  const r = newMemberCustomRoleDraft.trim()
                  if (!r) return
                  setCustomRoles((prev) => [...prev, r])
                  setNewMember((f) => ({ ...f, role: r }))
                  setNewMemberCustomRoleOpen(false)
                  setNewMemberCustomRoleDraft('')
                }}
                style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
          טען צוות מאירוע:
        </label>

        <div
          onClick={() => setShowEventPicker((p) => !p)}
          style={{
            height: 40, borderRadius: 8, border: '1px solid var(--glass-border)',
            background: 'var(--glass)', color: 'var(--text)',
            padding: '0 12px', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span>{selectedEvent?.title || 'בחר אירוע...'}</span>
          <ChevronDown size={16} color="var(--v2-gray-400)" style={{ transform: showEventPicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>

        {showEventPicker && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 100,
            background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, marginTop: 4, maxHeight: 240, overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,195,122,0.3) transparent',
          }}
          >
            {allEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => { setSourceEventId(ev.id); setShowEventPicker(false) }}
                style={{
                  padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                  background: ev.id === sourceEventId ? 'rgba(0,195,122,0.1)' : 'transparent',
                  color: ev.id === sourceEventId ? '#00C37A' : 'var(--text)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ev.id === sourceEventId ? 'rgba(0,195,122,0.1)' : 'transparent' }}
              >
                <span>{ev.title}</span>
                {ev.id === eventId && (
                  <span style={{ fontSize: 10, color: '#00C37A', background: 'rgba(0,195,122,0.1)', padding: '1px 6px', borderRadius: 8 }}>
                    נוכחי
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
                  setMemberExtraRoleText('')
                  setMemberExtraRoleIdx(i)
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
              <CustomSelect
                value={newMember.role}
                onChange={(v) => {
                  if (v === '__new__') {
                    setNewMemberCustomRoleDraft('')
                    setNewMemberCustomRoleOpen(true)
                  } else {
                    setNewMember((f) => ({ ...f, role: v }))
                  }
                }}
                options={[...allRoles.map((r) => ({ value: r, label: r })), { value: '__new__', label: '+ תפקיד חדש' }]}
                style={{ flex: 1, background: '#1e2130' }}
                menuStyle={SELECT_MENU_STYLE}
              />
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
  const [deleteMenuIdx, setDeleteMenuIdx] = useState(null)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryDraft, setNewCategoryDraft] = useState('')

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
      .catch(() => {})
    return () => { cancelled = true }
  }, [eventId, businessId, data?.menu])

  const deleteItem = async (index) => {
    const newMenu = menu.filter((_, i) => i !== index)
    setMenu(newMenu)
    await onUpdate({ menu: newMenu })
    toast.success('פריט נמחק')
  }

  return (
    <div>
      {deleteMenuIdx !== null && (
        <ConfirmModal
          title="מחיקת פריט"
          message="למחוק פריט זה מהתבנית?"
          confirmText="מחק"
          confirmColor="#ef4444"
          onConfirm={async () => {
            const i = deleteMenuIdx
            setDeleteMenuIdx(null)
            await deleteItem(i)
          }}
          onCancel={() => setDeleteMenuIdx(null)}
        />
      )}
      {newCategoryOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        >
          <div style={{ background: 'var(--card)', borderRadius: 14, padding: 22, width: '100%', maxWidth: 360, border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 700 }}>שם קטגוריה חדשה</p>
            <input
              value={newCategoryDraft}
              onChange={(e) => setNewCategoryDraft(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', marginBottom: 14, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setNewCategoryOpen(false); setNewCategoryDraft('') }} style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>ביטול</button>
              <button
                type="button"
                onClick={() => {
                  const c = newCategoryDraft.trim()
                  if (!c) return
                  setCustomCategories((p) => [...p, c])
                  setNewItem((f) => ({ ...f, category: c }))
                  setNewCategoryOpen(false)
                  setNewCategoryDraft('')
                }}
                style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
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

            {items.map((item, i) => {
              const extrasCount = Array.isArray(item.included_extras)
                ? item.included_extras.length
                : (Number(item.included_extras) || 0)
              return (
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
                    {extrasCount > 0 && (
                      <span>{` · ${extrasCount} תוספות כלולות`}</span>
                    )}
                  </p>
                </div>

                <span style={{ fontSize: 16, fontWeight: 800, color: '#00C37A', minWidth: 70, textAlign: 'left' }}>
                  ₪
                  {(Number(item.price) || 0).toLocaleString()}
                </span>

                <button
                  type="button"
                  onClick={() => setEditingItem({
                    index: menu.indexOf(item),
                    ...item,
                    included_extras: Array.isArray(item.included_extras) ? item.included_extras.length : (Number(item.included_extras) || 0),
                  })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', marginLeft: 4, padding: 4 }}
                >
                  <Pencil size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const duplicate = {
                      ...item,
                      name: `${item.name} (עותק)`,
                    }
                    const newMenu = [...menu, duplicate]
                    setMenu(newMenu)
                    onUpdate({ menu: newMenu })
                    toast.success('פריט שוכפל!')
                  }}
                  title="שכפל פריט"
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--v2-gray-400)', cursor: 'pointer',
                    padding: 4, borderRadius: 6,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Copy size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteMenuIdx(menu.indexOf(item))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              )
            })}
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
              <CustomSelect
                value={newItem.category || ''}
                placeholder="בחר קטגוריה"
                onChange={(v) => {
                  if (v === '__new__') {
                    setNewCategoryDraft('')
                    setNewCategoryOpen(true)
                  } else {
                    setNewItem((f) => ({ ...f, category: v }))
                  }
                }}
                options={[
                  ...categoryOptions.filter((c, idx, arr) => arr.indexOf(c) === idx).map((c) => ({ value: c, label: c })),
                  { value: '__new__', label: '+ קטגוריה חדשה' },
                ]}
                style={{ width: '100%', background: '#1e2130' }}
                menuStyle={SELECT_MENU_STYLE}
              />
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
                await fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu`, {
                  method: 'POST',
                  headers: authHeaders(),
                  body: JSON.stringify({
                    name: item.name,
                    category: item.category,
                    price: item.price,
                    description: item.description || null,
                    extras_detail: item.extras_detail || null,
                    free_entries: item.free_entries || 0,
                    included_extras: Array.isArray(item.included_extras)
                      ? item.included_extras.length
                      : (Number(item.included_extras) || 0),
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

      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ margin: '0 0 16px' }}>עריכת מוצר</h4>
            {[
              { field: 'name', label: 'שם מוצר', type: 'text' },
              { field: 'category', label: 'קטגוריה', type: 'text' },
              { field: 'price', label: 'מחיר ₪', type: 'number' },
              { field: 'free_entries', label: 'כניסות חינם', type: 'number' },
              { field: 'included_extras', label: 'תוספות כלולות', type: 'number' },
              { field: 'extras_detail', label: 'פירוט תוספות', type: 'text' },
              { field: 'description', label: 'תיאור', type: 'text' },
            ].map(({ field, label, type }) => (
              <div key={field} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  type={type}
                  value={editingItem[field] || ''}
                  onChange={e => setEditingItem(prev => ({ ...prev, [field]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                  style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 10px', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={async () => {
                  const { index, ...fields } = editingItem
                  const fixedFields = {
                    ...fields,
                    included_extras: Array.isArray(fields.included_extras)
                      ? fields.included_extras
                      : new Array(Number(fields.included_extras) || 0).fill(''),
                  }
                  const newMenu = menu.map((it, i) => (i === index ? { ...it, ...fixedFields } : it))
                  setMenu(newMenu)
                  await onUpdate({ menu: newMenu })
                  setEditingItem(null)
                  toast.success('מוצר עודכן בהצלחה')
                }}
                style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                שמור שינויים
              </button>
              <button type="button" onClick={() => setEditingItem(null)} style={{ height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
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

function waDigits(phone) {
  const d = String(phone || '').replace(/\D/g, '')
  if (d.startsWith('0')) return `972${d.slice(1)}`
  if (d.startsWith('972')) return d
  return d
}

function PromotersTemplate({ data: _data, onUpdate: _onUpdate, businessId, authHeaders, eventSlug }) {
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
    ticket_commission_type: 'pct',
    ticket_commission_n: '',
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

  const eventRefBase = (eventSlug && String(eventSlug).trim())
    ? `https://axess.pro/e/${String(eventSlug).trim()}`
    : 'https://axess.pro/e'

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: 'var(--v2-gray-400)' }}>טוען...</div>

  return (
    <div>
      {promoters.map((p, i) => {
        const tct = p.ticket_commission_type || p.commission_type || 'pct'
        const ticketLabel = Number(p.commission_per_ticket) > 0
          ? (tct === 'pct' ? `כרטיס: ${p.commission_per_ticket}%` : tct === 'fixed_per_n' ? `כרטיס: ₪${p.commission_per_ticket} / ${p.ticket_commission_n || 'X'} כרטיסים` : `כרטיס: ₪${p.commission_per_ticket}`)
          : null
        return (
          <div
            key={p.id || i}
            style={{
              background: 'var(--glass)', borderRadius: 10, padding: 12, marginBottom: 8,
              border: `1px solid ${p.is_active !== false ? 'rgba(0,195,122,0.2)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
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
                  {ticketLabel && (
                    <span style={{ fontSize: 10, background: 'rgba(0,195,122,0.1)', color: '#00C37A', padding: '1px 6px', borderRadius: 8 }}>
                      {ticketLabel}
                    </span>
                  )}
                  {Number(p.commission_per_table) > 0 && (
                    <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', padding: '1px 6px', borderRadius: 8 }}>
                      שולחן:
                      {p.commission_per_table}
                      %
                    </span>
                  )}
                  {p.auto_approve_clients && (
                    <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: '#22C55E', padding: '1px 6px', borderRadius: 8 }}>
                      אישור אוטומטי
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${eventRefBase}?ref=${p.seller_code || p.id}`
                      navigator.clipboard?.writeText(url)
                      toast.success('לינק אישי הועתק!')
                    }}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(0,195,122,0.3)', background: 'rgba(0,195,122,0.1)', color: '#00C37A', cursor: 'pointer' }}
                  >
                    📋 לינק לאירוע
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${eventRefBase}?ref=${p.seller_code || p.id}`
                      const msg = `שלום ${p.first_name || p.name}! הלינק האישי שלך לאירוע: ${url}`
                      const w = waDigits(p.phone)
                      if (!w) {
                        toast.error('אין מספר טלפון ליחצ"ן')
                        return
                      }
                      window.open(`https://wa.me/${w}?text=${encodeURIComponent(msg)}`, '_blank')
                    }}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#22C55E', cursor: 'pointer' }}
                  >
                    💬 שלח WA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const joinUrl = `https://axess.pro/promoter/join/${p.seller_code || p.id}`
                      navigator.clipboard?.writeText(joinUrl)
                      toast.success('לינק הצטרפות הועתק!')
                    }}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', cursor: 'pointer' }}
                  >
                    🔗 לינק הצטרפות
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {promoters.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            onClick={() => {
              const activeWithPhone = promoters.filter((p) => p.is_active !== false && p.phone)
              activeWithPhone.forEach((p) => {
                const url = `${eventRefBase}?ref=${p.seller_code || p.id}`
                const msg = `שלום ${p.first_name || p.name}! הלינק האישי שלך לאירוע: ${url}`
                const w = waDigits(p.phone)
                if (w) window.open(`https://wa.me/${w}?text=${encodeURIComponent(msg)}`, '_blank')
              })
              toast.success(`נשלחו ${activeWithPhone.length} הודעות!`)
            }}
            style={{
              width: '100%', height: 42, borderRadius: 8, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            💬 שלח לינק לכל היחצ&quot;נים הפעילים (
            {promoters.filter((p) => p.is_active !== false).length}
            )
          </button>
        </div>
      )}

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

            <CustomSelect
              value={newPromoter.role}
              onChange={(v) => setNewPromoter((f) => ({ ...f, role: v }))}
              options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
              style={{ height: 36, background: '#1e2130' }}
              menuStyle={SELECT_MENU_STYLE}
            />

            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newPromoter.seller_code} onChange={(e) => setNewPromoter((f) => ({ ...f, seller_code: e.target.value }))} placeholder="קוד יחצ'ן (ייווצר אוטומטי)" style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 10px', fontSize: 13 }} />
              <button type="button" onClick={() => setNewPromoter((f) => ({ ...f, seller_code: generateCode() }))} style={{ height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
                🎲 צור
              </button>
            </div>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)' }}>מסלולי עמלה:</p>

            <div style={{ background: 'rgba(0,195,122,0.05)', borderRadius: 8, padding: 10, border: '1px solid rgba(0,195,122,0.15)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>🎫 עמלת כרטיסים</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <CustomSelect
                  value={newPromoter.ticket_commission_type || 'pct'}
                  onChange={(v) => setNewPromoter((f) => ({ ...f, ticket_commission_type: v }))}
                  options={[
                    { value: 'pct', label: '% מהמכירות' },
                    { value: 'fixed', label: '₪ קבוע לכרטיס' },
                    { value: 'fixed_per_n', label: '₪ על כל X כרטיסים' },
                  ]}
                  style={{ flex: 1, minWidth: 140, height: 34, background: '#1e2130' }}
                  menuStyle={SELECT_MENU_STYLE}
                />
                <input
                  value={newPromoter.commission_per_ticket}
                  onChange={(e) => setNewPromoter((f) => ({ ...f, commission_per_ticket: parseFloat(e.target.value) || 0 }))}
                  type="number"
                  placeholder={newPromoter.ticket_commission_type === 'pct' ? '%' : '₪'}
                  style={{ width: 70, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13, textAlign: 'center' }}
                />
                {newPromoter.ticket_commission_type === 'fixed_per_n' && (
                  <input
                    value={newPromoter.ticket_commission_n || ''}
                    onChange={(e) => setNewPromoter((f) => ({ ...f, ticket_commission_n: parseInt(e.target.value, 10) || 0 }))}
                    type="number"
                    placeholder="X כרטיסים"
                    style={{ width: 90, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 12 }}
                  />
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(139,92,246,0.05)', borderRadius: 8, padding: 10, border: '1px solid rgba(139,92,246,0.15)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>🪑 עמלת שולחנות (% בלבד)</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={newPromoter.commission_per_table}
                  onChange={(e) => setNewPromoter((f) => ({ ...f, commission_per_table: parseFloat(e.target.value) || 0 }))}
                  type="number"
                  placeholder="% מהשולחן"
                  style={{ width: 80, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', padding: '0 8px', fontSize: 13, textAlign: 'center' }}
                />
                <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>% ממחיר השולחן (ללא טיפ)</span>
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
                  const tctype = newPromoter.ticket_commission_type || 'pct'
                  const payload = {
                    ...newPromoter,
                    name: `${newPromoter.first_name} ${newPromoter.last_name}`.trim(),
                    seller_code: code,
                    business_id: businessId,
                    commission_type: tctype === 'pct' ? 'pct' : 'fixed',
                    ticket_commission_type: tctype,
                    ticket_commission_n: tctype === 'fixed_per_n' ? (parseInt(newPromoter.ticket_commission_n, 10) || 0) : null,
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
                      first_name: '', last_name: '', phone: '', email: '', identification_number: '', role: 'salesman', commission_per_ticket: 10, commission_per_table: 0, commission_type: 'pct', ticket_commission_type: 'pct', ticket_commission_n: '', auto_approve_clients: false, genre_tags: [], seller_code: '', is_active: true, deals: [],
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

function VendorsTemplate({ data: _data, onUpdate: _onUpdate, eventId: _eventId, businessId, authHeaders }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: '',
    custom_category: '',
    vendor_type: 'none',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    default_price: '',
    items: [],
  })
  const [newVendorItem, setNewVendorItem] = useState({ name: '', price: '' })

  const loadVendors = useCallback(() => {
    if (!businessId) return Promise.resolve()
    setLoading(true)
    return fetch(`${API_BASE}/api/admin/vendors`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { vendors: [] }))
      .then((d) => {
        setVendors(Array.isArray(d.vendors) ? d.vendors : [])
      })
      .catch(() => setVendors([]))
      .finally(() => setLoading(false))
  }, [businessId, authHeaders])

  useEffect(() => {
    loadVendors()
  }, [loadVendors])

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: 'var(--v2-gray-400)' }}>טוען ספקים...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>הספקים של העסק</p>
        <button
          type="button"
          onClick={() => setShowAddVendor(true)}
          style={{ background: 'rgba(0,195,122,0.15)', border: 'none', borderRadius: 8, color: '#00C37A', fontWeight: 700, fontSize: 12, padding: '8px 12px', cursor: 'pointer' }}
        >
          + הוסף ספק
        </button>
      </div>

      {vendors.length === 0 ? (
        <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, margin: 0 }}>אין ספקים שמורים עדיין</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vendors.map((v) => (
            <div
              key={v.id}
              style={{
                background: 'var(--glass)', borderRadius: 10, padding: 12, border: '1px solid var(--glass-border)',
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{v.name}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                {EXPENSE_CATEGORIES.find((c) => c.value === v.category)?.label || v.category || '—'}
                {' '}
                · ₪
                {(Number(v.default_price) || 0).toLocaleString()}
                {v.contact_phone ? ` · ${v.contact_phone}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {showAddVendor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
        >
          <div style={{
            background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', position: 'relative', border: '1px solid var(--glass-border)', maxHeight: '90vh', overflow: 'auto',
          }}
          >
            <button
              type="button"
              onClick={() => setShowAddVendor(false)}
              style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>הוסף ספק</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={vendorForm.name}
                onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="שם הספק"
                style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
              />
              <CustomSelect
                value={vendorForm.vendor_type}
                onChange={(v) => setVendorForm((f) => ({ ...f, vendor_type: v }))}
                options={INVOICE_TYPES}
                style={{ background: '#1e2130' }}
                menuStyle={SELECT_MENU_STYLE}
              />
              <CustomSelect
                value={vendorForm.category}
                onChange={(v) => setVendorForm((f) => ({
                  ...f,
                  category: v,
                  custom_category: v === 'custom' ? f.custom_category : '',
                }))}
                options={[
                  ...EXPENSE_CATEGORIES,
                  { value: 'custom', label: '+ הוסף קטגוריה חדשה' },
                ]}
                style={{ background: '#1e2130' }}
                menuStyle={SELECT_MENU_STYLE}
              />
              {vendorForm.category === 'custom' && (
                <input
                  value={vendorForm.custom_category}
                  onChange={(e) => setVendorForm((f) => ({ ...f, custom_category: e.target.value }))}
                  placeholder="שם הקטגוריה החדשה (למשל: בוקינג אמנים)"
                  style={{ height: 40, borderRadius: 8, border: '1px solid #00C37A', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                />
              )}
              <input
                value={vendorForm.contact_name}
                onChange={(e) => setVendorForm((f) => ({ ...f, contact_name: e.target.value }))}
                placeholder="איש קשר"
                style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
              />
              <input
                value={vendorForm.contact_phone}
                onChange={(e) => setVendorForm((f) => ({ ...f, contact_phone: e.target.value }))}
                placeholder="טלפון"
                style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
              />
              <input
                value={vendorForm.contact_email}
                onChange={(e) => setVendorForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="מייל"
                style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
              />
              <input
                value={vendorForm.address}
                onChange={(e) => setVendorForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="כתובת (אופציונלי)"
                style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
              />
              <input
                value={vendorForm.default_price}
                onChange={(e) => setVendorForm((f) => ({ ...f, default_price: e.target.value }))}
                placeholder="מחיר ברירת מחדל / משוער ₪"
                type="number"
                style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
              />
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 8, padding: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>
                  פריטים משוייכים לספק
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                  למשל: שם אמן, שם תפקיד, שם שירות ספציפי
                </p>
                {vendorForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{item.name}</span>
                    <span style={{ fontSize: 13, color: '#00C37A' }}>
                      ₪
                      {item.price || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVendorForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input
                    value={newVendorItem.name}
                    onChange={(e) => setNewVendorItem((i) => ({ ...i, name: e.target.value }))}
                    placeholder="שם פריט (למשל: DJ Avicii)"
                    style={{ flex: 2, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
                  />
                  <input
                    value={newVendorItem.price}
                    onChange={(e) => setNewVendorItem((i) => ({ ...i, price: e.target.value }))}
                    placeholder="₪ מחיר"
                    type="number"
                    style={{ flex: 1, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newVendorItem.name) return
                      setVendorForm((f) => ({
                        ...f,
                        items: [...f.items, { name: newVendorItem.name, price: newVendorItem.price || 0 }],
                      }))
                      setNewVendorItem({ name: '', price: '' })
                    }}
                    style={{
                      height: 34,
                      padding: '0 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#00C37A',
                      color: '#000',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!vendorForm.name?.trim()) {
                    toast.error('יש למלא שם ספק')
                    return
                  }
                  const category = vendorForm.category === 'custom'
                    ? vendorForm.custom_category.trim()
                    : vendorForm.category
                  if (!category) {
                    toast.error('בחר או הזן קטגוריה')
                    return
                  }
                  const r = await fetch(`${API_BASE}/api/admin/vendors`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      name: vendorForm.name.trim(),
                      category,
                      vendor_type: vendorForm.vendor_type,
                      contact_name: vendorForm.contact_name || null,
                      contact_phone: vendorForm.contact_phone || null,
                      contact_email: vendorForm.contact_email || null,
                      address: vendorForm.address || null,
                      default_price: parseFloat(vendorForm.default_price) || 0,
                      items: vendorForm.items.map((it) => ({
                        name: it.name,
                        price: parseFloat(it.price) || 0,
                      })),
                    }),
                  })
                  if (!r.ok) {
                    toast.error('שמירת ספק נכשלה')
                    return
                  }
                  setShowAddVendor(false)
                  setVendorForm({
                    name: '',
                    category: '',
                    custom_category: '',
                    vendor_type: 'none',
                    contact_name: '',
                    contact_phone: '',
                    contact_email: '',
                    address: '',
                    default_price: '',
                    items: [],
                  })
                  setNewVendorItem({ name: '', price: '' })
                  await loadVendors()
                  toast.success('ספק נוסף!')
                }}
                style={{ height: 44, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                שמור ספק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExpensesTemplate({ data, onUpdate, eventId, businessId: _businessId, authHeaders, requestConfirm }) {
  const [categories, setCategories] = useState(
    data?.categories || ['אמנים', 'ציוד', 'שמע ותאורה', 'אבטחה', 'שיווק', 'מקום', 'כיבוד', 'אחר'],
  )
  const [newCat, setNewCat] = useState('')

  useEffect(() => {
    if (data && typeof data === 'object') {
      if (Array.isArray(data.categories)) setCategories(data.categories)
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
