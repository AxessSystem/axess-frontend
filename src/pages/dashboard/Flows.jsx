import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  X,
  Library,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { fetchWithAuth, supabase } from '@/lib/supabase'
import CustomSelect from '@/components/ui/CustomSelect'


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

const SELECT_STYLE = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--glass-border)', background: 'var(--card)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
  cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none',
}

const STEP_TYPES = [
  { type: 'message', label: '💬 הודעת טקסט', fields: ['content'] },
  { type: 'menu', label: '📋 תפריט + כפתורים', fields: ['content', 'options'] },
  { type: 'question', label: '❓ שאלה', fields: ['content'] },
  { type: 'send_webview', label: '🌐 שלח Webview', fields: ['content'] },
  { type: 'send_qr', label: '🎫 שלח QR כרטיס', fields: ['content'] },
  { type: 'tag_contact', label: '🏷️ הוסף תגית', fields: ['tag'] },
  { type: 'notify_business', label: '🔔 התראה לעסק', fields: ['content'] },
  { type: 'delay', label: '⏱️ המתן', fields: ['minutes'] },
  { type: 'end', label: '🔚 סיום שיחה', fields: [] },
]

const TRIGGER_OPTIONS = [
  { value: 'keyword', label: 'כשלקוח כותב מילת מפתח' },
  { value: 'first_message', label: 'הודעה ראשונה מהלקוח' },
  { value: 'any', label: 'כל הודעה' },
]

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid var(--glass-border)',
  borderRadius: 12,
  padding: 20,
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--glass-border)',
  background: 'var(--v2-dark-2)',
  color: '#fff',
  fontSize: 14,
  fontFamily: "'DM Sans',sans-serif",
}

const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--v2-primary)',
  color: 'var(--v2-dark)',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

const btnGhost = {
  padding: '8px 14px',
  borderRadius: 10,
  border: '1px solid var(--glass-border)',
  background: 'transparent',
  color: 'var(--v2-gray-400)',
  fontSize: 13,
  cursor: 'pointer',
}

function newStepId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function emptyStep(type = 'message') {
  const base = { id: newStepId(), type, content: '', tag: '', minutes: 1 }
  if (type === 'menu') {
    base.options = [
      { label: 'אפשרות 1', next_step: '' },
      { label: 'אפשרות 2', next_step: '' },
    ]
  }
  return base
}

function normalizeSteps(raw) {
  const arr = Array.isArray(raw) ? raw : []
  return arr.map((st, i) => {
    const id = st.id || newStepId()
    const type = st.type || 'message'
    const step = { ...st, id, type }
    if (type === 'menu' && !Array.isArray(step.options)) {
      step.options = [
        { label: 'אפשרות 1', next_step: '' },
        { label: 'אפשרות 2', next_step: '' },
      ]
    }
    return step
  })
}

function flowDisplayName(f) {
  return f.flow_name || f.display_name || f.name || 'ללא שם'
}

function triggerSummary(f) {
  const t = f.trigger_type || 'keyword'
  if (t === 'first_message') return 'כשההודעה הראשונה מגיעה'
  if (t === 'any') return 'בכל הודעה נכנסת'
  const kw = f.trigger_value || ''
  return kw ? `כשלקוח כותב "${kw}"` : 'מילת מפתח (לא הוגדרה)'
}

function statsRuns(f) {
  const n = f.stats && typeof f.stats === 'object' ? f.stats.runs : null
  return n != null ? Number(n) : null
}

/** תצוגה מקדימה — בועות כמו בווטסאפ */
function usePreviewBubbles(steps, triggerType, keyword) {
  return useMemo(() => {
    const bubbles = []
    const customerHint =
      triggerType === 'keyword' && keyword
        ? `…${keyword}…`
        : triggerType === 'first_message'
          ? 'היי'
          : 'הודעה'
    bubbles.push({ from: 'user', text: customerHint })

    for (const st of steps || []) {
      switch (st.type) {
        case 'message':
        case 'question':
          if (st.content) bubbles.push({ from: 'bot', text: st.content })
          break
        case 'menu': {
          if (st.content) bubbles.push({ from: 'bot', text: st.content })
          const opts = (st.options || []).map((o, i) => `${i + 1}. ${o.label || '—'}`).join('\n')
          if (opts) bubbles.push({ from: 'bot', text: opts })
          break
        }
        case 'send_webview':
          bubbles.push({
            from: 'bot',
            text: st.content ? `${st.content}\n\n🔗 קישור Webview` : '🔗 קישור Webview',
          })
          break
        case 'send_qr':
          bubbles.push({
            from: 'bot',
            text: st.content ? `${st.content}\n\n🎫 QR` : '🎫 QR כרטיס',
          })
          break
        case 'tag_contact':
          bubbles.push({ from: 'bot', text: `🏷️ תגית: ${st.tag || '—'}` })
          break
        case 'notify_business':
          bubbles.push({ from: 'system', text: `🔔 התראה לעסק: ${(st.content || '').slice(0, 80)}` })
          break
        case 'delay':
          bubbles.push({ from: 'system', text: `⏱️ המתנה ${st.minutes ?? 1} דק׳` })
          break
        case 'end':
          bubbles.push({ from: 'system', text: '🔚 סיום שיחה' })
          break
        default:
          break
      }
    }
    return bubbles
  }, [steps, triggerType, keyword])
}

function WaPreview({ bubbles }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--glass-border)',
        background: '#0B141A',
        overflow: 'hidden',
        maxHeight: 560,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          background: '#202C33',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--v2-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MessageCircle size={18} color="#080C14" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#E9EDEF' }}>תצוגה מקדימה</div>
          <div style={{ fontSize: 11, color: '#8696A0' }}>סימולציית WhatsApp</div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.02) 8px, rgba(255,255,255,0.02) 9px)',
          minHeight: 280,
        }}
      >
        {bubbles.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8696A0', fontSize: 13, padding: 24 }}>
            הוסיפו שלבים כדי לראות תצוגה
          </div>
        ) : (
          bubbles.map((b, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: b.from === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  maxWidth: '88%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background:
                    b.from === 'user'
                      ? '#005C4B'
                      : b.from === 'system'
                        ? 'rgba(134,150,160,0.25)'
                        : '#202C33',
                  color: '#E9EDEF',
                  border: b.from === 'bot' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {b.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Flows() {
  const flowsAllowed = useRequirePermission('can_manage_flows')
  const { session, businessId, profile } = useAuth()
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    trigger_type: 'keyword',
    trigger_value: '',
    steps: [emptyStep('message')],
    is_active: false,
  })
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryFlows, setLibraryFlows] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [toggleBusy, setToggleBusy] = useState(null)

  const businessType = profile?.business_type || profile?.businessType || null

  const onUnauthorized = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [])

  const loadFlows = useCallback(async () => {
    if (!businessId || !session?.access_token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchWithAuth('/api/flows')
      setFlows(Array.isArray(data.flows) ? data.flows : [])
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLoading(false)
    }
  }, [businessId, session, onUnauthorized])

  useEffect(() => {
    loadFlows()
  }, [loadFlows])

  const openNew = () => {
    setEditingId(null)
    setForm({
      name: '',
      trigger_type: 'keyword',
      trigger_value: '',
      steps: [emptyStep('message')],
      is_active: false,
    })
    setEditorOpen(true)
  }

  const openEdit = (f) => {
    setEditingId(f.id)
    setForm({
      name: flowDisplayName(f),
      trigger_type: f.trigger_type || 'keyword',
      trigger_value: f.trigger_value || '',
      steps: normalizeSteps(f.steps).length ? normalizeSteps(f.steps) : [emptyStep('message')],
      is_active: !!f.is_active,
    })
    setEditorOpen(true)
  }

  const loadLibrary = useCallback(async () => {
    if (!session?.access_token) return
    setLibraryLoading(true)
    try {
      const q = businessType ? `?business_type=${encodeURIComponent(businessType)}` : ''
      const data = await fetchWithAuth(`/api/flows/library${q}`)
      setLibraryFlows(Array.isArray(data.flows) ? data.flows : [])
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLibraryLoading(false)
    }
  }, [session, onUnauthorized, businessType])

  const openLibrary = () => {
    setLibraryOpen(true)
    loadLibrary()
  }

  const adoptLibraryFlow = async (libRow) => {
    if (!businessId) return
    setSaving(true)
    try {
      const body = {
        name: `${flowDisplayName(libRow)} (מהספרייה)`,
        trigger_type: libRow.trigger_type || 'keyword',
        trigger_value: libRow.trigger_value || null,
        steps: Array.isArray(libRow.steps) ? libRow.steps : [],
      }
      await fetchWithAuth('/api/flows', { method: 'POST', body: JSON.stringify(body) })
      toast.success('הועתק לעסק')
      setLibraryOpen(false)
      await loadFlows()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSaving(false)
    }
  }

  const saveEditor = async () => {
    if (!form.name?.trim()) {
      toast.error('נא למלא שם Flow')
      return
    }
    if (form.trigger_type === 'keyword' && !form.trigger_value?.trim()) {
      toast.error('נא למלא מילת מפתח')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        trigger_type: form.trigger_type,
        trigger_value: form.trigger_type === 'keyword' ? form.trigger_value.trim() : null,
        steps: form.steps,
        is_active: form.is_active,
      }
      const url = editingId ? `/api/flows/${editingId}` : '/api/flows'
      const method = editingId ? 'PATCH' : 'POST'
      const data = await fetchWithAuth(url, { method, body: JSON.stringify(payload) })
      const newId = data.flow?.id
      if (!editingId && form.is_active && newId) {
        await fetchWithAuth(`/api/flows/${newId}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: true }),
        })
      }
      toast.success(editingId ? 'עודכן' : 'נוצר')
      setEditorOpen(false)
      await loadFlows()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSaving(false)
    }
  }

  const duplicateFlow = async (id) => {
    try {
      await fetchWithAuth(`/api/flows/${id}/duplicate`, { method: 'POST' })
      toast.success('שוכפל')
      await loadFlows()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const deleteFlow = async (id) => {
    if (!confirm('למחוק את ה-Flow?')) return
    try {
      const data = await fetchWithAuth(`/api/flows/${id}`, {
        method: 'DELETE',
      }).catch(() => ({}))
      toast.success('נמחק')
      await loadFlows()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const toggleActive = async (f, next) => {
    setToggleBusy(f.id)
    try {
      await fetchWithAuth(`/api/flows/${f.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: next }),
      })
      setFlows((prev) => prev.map((x) => (x.id === f.id ? { ...x, is_active: next } : x)))
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setToggleBusy(null)
    }
  }

  const previewBubbles = usePreviewBubbles(form.steps, form.trigger_type, form.trigger_value)

  const stepOptionsForMenu = form.steps.map((s) => ({
    id: s.id,
    label: STEP_TYPES.find((t) => t.type === s.type)?.label || s.type,
  }))

  const updateStep = (index, patch) => {
    setForm((prev) => {
      const steps = [...prev.steps]
      steps[index] = { ...steps[index], ...patch }
      return { ...prev, steps }
    })
  }

  const addStep = () => {
    setForm((prev) => ({ ...prev, steps: [...prev.steps, emptyStep('message')] }))
  }

  const removeStep = (index) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.length <= 1 ? prev.steps : prev.steps.filter((_, i) => i !== index),
    }))
  }

  const moveStep = (index, dir) => {
    setForm((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.steps.length) return prev
      const steps = [...prev.steps]
      ;[steps[index], steps[j]] = [steps[j], steps[index]]
      return { ...prev, steps }
    })
  }

  if (!flowsAllowed) return null

  return (
    <div dir="rtl" style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
              fontWeight: 800,
              fontSize: 26,
              color: '#fff',
              margin: 0,
            }}
          >
            ה-Flows שלי
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--v2-gray-400)', fontSize: 14 }}>
            אוטומציות WhatsApp לפי טריגר ושלבים
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!loading && flows.length > 0 && (
            <button type="button" style={{ ...btnGhost, color: '#fff' }} onClick={openLibrary}>
              <Library size={18} style={{ marginLeft: 6 }} />
              מהספרייה
            </button>
          )}
          <button type="button" style={btnPrimary} onClick={openNew}>
            <Plus size={18} />
            Flow חדש
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--v2-gray-400)' }}>טוען…</div>
      ) : flows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '48px 24px',
          }}
        >
          <Sparkles size={40} style={{ color: 'var(--v2-primary)', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>אין Flows עדיין</div>
          <div style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
            התחילו מתבנית מוכנה או בנו Flow מותאם אישית
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" style={btnPrimary} onClick={openLibrary}>
              <Library size={18} />
              בחר מהספרייה
            </button>
            <button type="button" style={{ ...btnGhost, color: '#fff', borderColor: 'var(--v2-primary)' }} onClick={openNew}>
              <Plus size={18} style={{ verticalAlign: 'middle' }} />
              צור חדש
            </button>
          </div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {flows.map((f) => (
            <motion.div
              key={f.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                ...cardStyle,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 6 }}>{flowDisplayName(f)}</div>
                  <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{triggerSummary(f)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!f.is_active}
                    disabled={toggleBusy === f.id}
                    onClick={() => toggleActive(f, !f.is_active)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      border: '1px solid var(--glass-border)',
                      background: f.is_active ? 'rgba(0,195,122,0.2)' : 'var(--v2-dark-2)',
                      color: f.is_active ? 'var(--v2-primary)' : 'var(--v2-gray-400)',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: toggleBusy === f.id ? 'wait' : 'pointer',
                    }}
                  >
                    {f.is_active ? 'פעיל' : 'כבוי'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--v2-gray-400)' }}>
                <span>
                  <strong style={{ color: '#fff' }}>{f.total_sessions ?? 0}</strong> שיחות
                </span>
                <span>
                  <strong style={{ color: '#fff' }}>{f.completed_sessions ?? 0}</strong> הושלמו
                </span>
                {statsRuns(f) != null && (
                  <span>
                    <strong style={{ color: '#fff' }}>{statsRuns(f)}</strong> הרצות (סטטיסטיקה)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={btnGhost} onClick={() => openEdit(f)}>
                  <Pencil size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                  ערוך
                </button>
                <button type="button" style={btnGhost} onClick={() => duplicateFlow(f.id)}>
                  <Copy size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                  שכפל
                </button>
                <button
                  type="button"
                  style={{ ...btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' }}
                  onClick={() => deleteFlow(f.id)}
                >
                  <Trash2 size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                  מחק
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ספרייה */}
      <AnimatePresence>
        {libraryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => !saving && setLibraryOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 520,
                maxHeight: '85vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--card)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
              }}
            >
              <button type="button" onClick={() => !saving && setLibraryOpen(false)} style={MODAL_CLOSE_X} aria-label="סגור">
                <X size={20} />
              </button>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>בחר מהספרייה</div>
              </div>
              <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
                {libraryLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--v2-gray-400)', padding: 24 }}>טוען…</div>
                ) : libraryFlows.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--v2-gray-400)', padding: 24 }}>
                    אין תבניות בספרייה כרגע
                  </div>
                ) : (
                  libraryFlows.map((lf) => {
                    const stepCount = Array.isArray(lf.steps) ? lf.steps.length : 0
                    const desc = lf.display_name || lf.description || triggerSummary(lf)
                    return (
                      <div
                        key={lf.id}
                        style={{
                          border: '1px solid var(--glass-border)',
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          background: 'var(--v2-dark-2)',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{flowDisplayName(lf)}</div>
                        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>{desc}</div>
                        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 12 }}>
                          {stepCount} שלבים
                          {lf.business_type ? ` · ${lf.business_type}` : ''}
                        </div>
                        <button
                          type="button"
                          style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}
                          disabled={saving}
                          onClick={() => adoptLibraryFlow(lf)}
                        >
                          השתמש
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* עורך */}
      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 210,
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              dir="rtl"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 1100,
                margin: 'auto',
                maxHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--v2-dark-2)',
                border: '1px solid var(--glass-border)',
              }}
              className="flows-editor-panel"
            >
              <button type="button" onClick={() => !saving && setEditorOpen(false)} style={MODAL_CLOSE_X} aria-label="סגור">
                <X size={20} />
              </button>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>
                  {editingId ? 'עריכת Flow' : 'Flow חדש'}
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  padding: 20,
                }}
                className="flows-editor-body"
              >
                <style>{`
                  @media (max-width: 899px) {
                    .flows-editor-body {
                      flex-direction: column-reverse !important;
                    }
                  }
                  @media (min-width: 900px) {
                    .flows-editor-body {
                      flex-direction: row !important;
                      align-items: flex-start !important;
                    }
                    .flows-editor-panel {
                      border-radius: 12px !important;
                      margin: 24px auto !important;
                      max-height: calc(100vh - 48px) !important;
                    }
                  }
                `}</style>

                {/* ב-RTL + row: פריט ראשון = ימין — תצוגה מקדימה ימין */}
                <div className="flows-preview-col" style={{ width: '100%', maxWidth: 360, flexShrink: 0, position: 'sticky', top: 0, alignSelf: 'stretch' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>תצוגה מקדימה</div>
                  <WaPreview bubbles={previewBubbles} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>שם Flow</span>
                      <input
                        style={inputStyle}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="לדוגמה: קבלת פנים"
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>טריגר</span>
                      <CustomSelect
                        style={{ ...inputStyle, ...SELECT_STYLE }}
                        value={form.trigger_type}
                        onChange={(val) => setForm((p) => ({ ...p, trigger_type: val }))}
                        options={TRIGGER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      />
                    </label>

                    {form.trigger_type === 'keyword' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>מילת מפתח</span>
                        <input
                          style={inputStyle}
                          value={form.trigger_value}
                          onChange={(e) => setForm((p) => ({ ...p, trigger_value: e.target.value }))}
                          placeholder="שלום"
                        />
                      </label>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                      />
                      <span style={{ color: '#fff', fontSize: 14 }}>Flow פעיל אחרי שמירה</span>
                    </label>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>שלבים</span>
                        <button type="button" style={{ ...btnPrimary, padding: '8px 14px', fontSize: 13 }} onClick={addStep}>
                          <Plus size={16} /> הוסף שלב
                        </button>
                      </div>

                      {form.steps.map((step, idx) => {
                        const def = STEP_TYPES.find((t) => t.type === step.type) || STEP_TYPES[0]
                        return (
                          <div
                            key={step.id}
                            style={{
                              border: '1px solid var(--glass-border)',
                              borderRadius: 12,
                              padding: 14,
                              marginBottom: 12,
                              background: 'var(--card)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>שלב {idx + 1}</span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button type="button" style={btnGhost} onClick={() => moveStep(idx, -1)} disabled={idx === 0}>
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  style={btnGhost}
                                  onClick={() => moveStep(idx, 1)}
                                  disabled={idx === form.steps.length - 1}
                                >
                                  ↓
                                </button>
                                <button type="button" style={{ ...btnGhost, color: '#f87171' }} onClick={() => removeStep(idx)}>
                                  מחק
                                </button>
                              </div>
                            </div>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                              <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>סוג שלב</span>
                              <CustomSelect
                                style={{ ...inputStyle, ...SELECT_STYLE }}
                                value={step.type}
                                onChange={(t) => {
                                  const next = emptyStep(t)
                                  next.id = step.id
                                  setForm((p) => {
                                    const steps = [...p.steps]
                                    steps[idx] = { ...next, id: step.id }
                                    return { ...p, steps }
                                  })
                                }}
                                options={STEP_TYPES.map((st) => ({ value: st.type, label: st.label }))}
                              />
                            </label>

                            {def.fields.includes('content') && (
                              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>תוכן</span>
                                <textarea
                                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                                  value={step.content || ''}
                                  onChange={(e) => updateStep(idx, { content: e.target.value })}
                                />
                              </label>
                            )}

                            {def.fields.includes('tag') && (
                              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>תגית</span>
                                <input
                                  style={inputStyle}
                                  value={step.tag || ''}
                                  onChange={(e) => updateStep(idx, { tag: e.target.value })}
                                />
                              </label>
                            )}

                            {def.fields.includes('minutes') && (
                              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>דקות</span>
                                <input
                                  type="number"
                                  min={1}
                                  style={inputStyle}
                                  value={step.minutes ?? 1}
                                  onChange={(e) => updateStep(idx, { minutes: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                />
                              </label>
                            )}

                            {def.fields.includes('options') && (
                              <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>אפשרויות</div>
                                {(step.options || []).map((opt, oi) => (
                                  <div key={oi} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                                    <input
                                      style={inputStyle}
                                      placeholder="טקסט כפתור"
                                      value={opt.label || ''}
                                      onChange={(e) => {
                                        const options = [...(step.options || [])]
                                        options[oi] = { ...options[oi], label: e.target.value }
                                        updateStep(idx, { options })
                                      }}
                                    />
                                    <CustomSelect
                                      style={{ ...inputStyle, ...SELECT_STYLE }}
                                      value={opt.next_step || ''}
                                      onChange={(val) => {
                                        const options = [...(step.options || [])]
                                        options[oi] = { ...options[oi], next_step: val }
                                        updateStep(idx, { options })
                                      }}
                                      options={[
                                        { value: '', label: '— שלב הבא —' },
                                        ...stepOptionsForMenu.map((so) => ({
                                          value: so.id,
                                          label: `${so.label} (${so.id.slice(0, 8)}…)`,
                                        })),
                                      ]}
                                    />
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  style={btnGhost}
                                  onClick={() =>
                                    updateStep(idx, {
                                      options: [...(step.options || []), { label: 'חדש', next_step: '' }],
                                    })
                                  }
                                >
                                  + אפשרות
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 8 }}>
                      <button type="button" style={btnPrimary} disabled={saving} onClick={saveEditor}>
                        {saving ? 'שומר…' : 'שמור'}
                      </button>
                      <button type="button" style={btnGhost} disabled={saving} onClick={() => setEditorOpen(false)}>
                        ביטול
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
