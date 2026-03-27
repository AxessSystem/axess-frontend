import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Save, Building, Building2, MessageSquare, CreditCard, Bell, Wallet, User, Link2, Store, Calendar, LayoutGrid, Grid3X3, Megaphone, QrCode, Send, Users, UsersRound, ClipboardList, MessageCircle, MessageCircleMore, FileText, GitBranch, Eye, RefreshCw, Plus, X, Workflow, CheckCircle, Utensils, Ticket, Tag, ShoppingBag, BarChart3 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import WebviewAnalytics from '@/webview/WebviewAnalytics'
import { fetchWithAuth, supabase } from '@/lib/supabase'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const SMS_LINK_BASE = import.meta.env.VITE_SMS_LINK_BASE || 'https://axss.me'

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

const FEATURE_ICONS = {
  events: Calendar,
  tables: LayoutGrid,
  theater: Grid3X3,
  promoters: Megaphone,
  validators: QrCode,
  campaigns: Send,
  staff: Users,
  group_registration: UsersRound,
  sub_accounts: Building,
  attendance_report: ClipboardList,
  parent_sms: MessageCircle,
}

const TYPE_DESCRIPTIONS = {
  club: 'אירועים, שולחנות VIP, יחצ"נים',
  festival: 'כרטוס, ישיבה, ניהול אמנים',
  venue: 'כנסים, חתונות, השקות',
  restaurant: 'קמפיינים, קופונים, לקוחות חוזרים',
  gym: 'מנויים, שיעורים, תזכורות',
  hotel: 'אורחים, הטבות, חוויה',
  retail: 'מבצעים, נאמנות, SMS',
  municipal: 'אירועים קהילתיים, הרשמות, דיווח',
  organization: 'ניהול חברים, אירועים, תרומות',
  general: 'כל הכלים לפי הצורך',
}

const FEATURE_LABELS = {
  events: 'אירועים',
  tables: 'שולחנות VIP',
  theater: 'ישיבת תיאטרון',
  promoters: 'יחצ"נים',
  validators: 'Validators',
  campaigns: 'קמפיינים',
  staff: 'צוות',
  group_registration: 'הרשמת קבוצות',
  sub_accounts: 'Sub-accounts',
  attendance_report: 'דוח נוכחות',
  parent_sms: 'SMS להורים',
}

const TABS = [
  { id: 'account',       label: 'חשבון',      icon: User },
  { id: 'business',      label: 'פרטי עסק',   icon: Building2 },
  { id: 'businesstype',  label: 'סוג עסק',    icon: Store },
  { id: 'sms',           label: 'הגדרות SMS', icon: MessageSquare },
  { id: 'whatsapp',      label: 'WhatsApp Business', icon: MessageCircleMore },
  { id: 'links',         label: 'לינקים',     icon: Link2 },
  { id: 'webview_analytics', label: 'Analytics Webview', icon: BarChart3 },
  { id: 'payments',      label: 'תשלומים',    icon: Wallet },
  { id: 'billing',       label: 'חיוב',       icon: CreditCard },
  { id: 'notifications', label: 'התראות',     icon: Bell },
]

const cardStyle = { background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }
const sectionH2 = { fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 17, color: '#ffffff', marginBottom: 16 }

function LinksTab({ businessId }) {
  const [links, setLinks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [destType, setDestType] = useState('external_url')
  const [destId, setDestId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [events, setEvents] = useState([])
  const [creating, setCreating] = useState(false)
  const [createdLink, setCreatedLink] = useState(null)

  useEffect(() => {
    if (businessId) {
      fetch(`${API_BASE}/api/admin/business-links?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setLinks).catch(() => [])
    }
  }, [businessId])

  useEffect(() => {
    if (modalOpen && businessId) {
      fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(e => setEvents(Array.isArray(e) ? e : [])).catch(() => [])
    }
  }, [modalOpen, businessId])

  const handleCreate = async () => {
    if (!label.trim() || !businessId) return
    setCreating(true)
    try {
      const body = { business_id: businessId, label: label.trim(), destination_type: destType }
      if (destType === 'event_page' && destId) body.destination_id = destId
      if (destType === 'external_url') body.metadata = { url: externalUrl }
      const r = await fetch(`${API_BASE}/api/admin/business-links`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setCreatedLink(data)
      setLinks(prev => [{ ...data, label: label.trim(), destination_type: destType, clicks: 0 }, ...prev])
      setLabel('')
      setDestId('')
      setExternalUrl('')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  const shortUrl = createdLink ? `${SMS_LINK_BASE}/s/${createdLink.slug}` : ''

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={sectionH2}>Smart Links</h2>
      <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>לינקים קצרים לשיתוף ברשתות חברתיות, WhatsApp או בפרופיל</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>שם</th>
              <th style={{ textAlign: 'right', padding: 12 }}>slug</th>
              <th style={{ textAlign: 'right', padding: 12 }}>יעד</th>
              <th style={{ textAlign: 'right', padding: 12 }}>קליקים</th>
              <th style={{ textAlign: 'right', padding: 12 }}>תאריך</th>
            </tr>
          </thead>
          <tbody>
            {links.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: 12 }}>{l.label || '—'}</td>
                <td style={{ padding: 12 }}>{l.slug}</td>
                <td style={{ padding: 12 }}>{l.destination_type}</td>
                <td style={{ padding: 12 }}>{l.clicks ?? 0}</td>
                <td style={{ padding: 12 }}>{l.created_at ? new Date(l.created_at).toLocaleDateString('he-IL') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => { setModalOpen(true); setCreatedLink(null) }} className="btn-primary" style={{ alignSelf: 'flex-start' }}>+ צור לינק חדש</button>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalOpen(false)}>
          <div dir="rtl" style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setModalOpen(false)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: 16 }}>צור לינק חדש</h3>
            {!createdLink ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">שם הלינק (לשימוש פנימי)</label>
                  <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="למשל: פרופיל אינסטגרם" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">סוג</label>
                  <CustomSelect style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }} value={destType} onChange={(val) => setDestType(val)} options={[{ value: 'event_page', label: 'אירוע' }, { value: 'external_url', label: 'URL חיצוני' }]} />
                </div>
                {destType === 'event_page' && (
                  <div style={{ marginBottom: 12 }}>
                    <CustomSelect style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }} value={destId} onChange={(val) => setDestId(val)} placeholder="בחר אירוע" options={[{ value: '', label: 'בחר אירוע' }, ...events.map(ev => ({ value: ev.id, label: ev.title }))]} />
                  </div>
                )}
                {destType === 'external_url' && (
                  <div style={{ marginBottom: 12 }}>
                    <input className="input" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." dir="ltr" />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={handleCreate} disabled={creating || !label.trim()} className="btn-primary">צור לינק</button>
                  <button onClick={() => setModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: 12, background: 'var(--v2-dark-3)', borderRadius: 8, marginBottom: 12, wordBreak: 'break-all' }}>{shortUrl}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigator.clipboard?.writeText(shortUrl).then(() => toast.success('הועתק'))} className="btn-primary">העתק</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shortUrl)}`} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 16px', background: '#25D366', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
                </div>
                <button onClick={() => { setCreatedLink(null); setModalOpen(false) }} style={{ marginTop: 12, padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>סגור</button>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

const FLOW_TYPES = [
  { id: 'checkin', label: "צ'ק-אין", desc: 'אימות הזמנה וצ\'ק-אין באירוע', icon: CheckCircle },
  { id: 'booking', label: 'הזמנת שולחן', desc: 'בחירת תאריך, שעה ומספר אורחים', icon: Utensils },
  { id: 'purchase', label: 'רכישת כרטיס', desc: 'בחירת כרטיס, פרטים ותשלום', icon: Ticket },
  { id: 'validator', label: 'מימוש קופון', desc: 'הזנת קוד קופון ומימוש', icon: Tag },
  { id: 'retail', label: 'קנייה', desc: 'קטלוג, סל ותשלום', icon: ShoppingBag },
]

function WhatsAppTab({ businessId, session }) {
  const [waTab, setWaTab] = useState('account')
  const [status, setStatus] = useState(null)
  const [loadingWaStatus, setLoadingWaStatus] = useState(true)
  const [templates, setTemplates] = useState([])
  const [rules, setRules] = useState([])
  const [flows, setFlows] = useState([])
  const [staff, setStaff] = useState([])
  const [connectForm, setConnectForm] = useState({
    phone_number_id: '', waba_id: '', access_token: '', business_phone_number: '', display_name: '', is_sandbox: false
  })
  const [connecting, setConnecting] = useState(false)
  const [templateModal, setTemplateModal] = useState(false)
  const [ruleModal, setRuleModal] = useState(false)
  const [flowCreateModal, setFlowCreateModal] = useState(false)
  const [flowCreateStep, setFlowCreateStep] = useState(1)
  const [flowCreateType, setFlowCreateType] = useState(null)
  const [flowCreateParams, setFlowCreateParams] = useState({ business_name: '', event_name: '', coupon_title: '' })
  const [flowCreateDisplayName, setFlowCreateDisplayName] = useState('')
  const [flowCreateBusy, setFlowCreateBusy] = useState(false)
  const [flowCreateError, setFlowCreateError] = useState(null)
  const [flowSendModal, setFlowSendModal] = useState(null)
  const [flowSendPhones, setFlowSendPhones] = useState('')
  const [flowSendCta, setFlowSendCta] = useState('')
  const [flowSendTemplate, setFlowSendTemplate] = useState('flow_invite')
  const [flowSendBusy, setFlowSendBusy] = useState(false)
  const [ruleForm, setRuleForm] = useState({ rule_type: 'keyword', match_value: '', channel: 'both', action: 'queue_general', target_agent_id: '', target_department: '', bot_reply_text: '', is_active: true })
  const [libraryTemplates, setLibraryTemplates] = useState([])
  const [libCategory, setLibCategory] = useState('')
  const [libBusinessType, setLibBusinessType] = useState('')
  const [adoptBusy, setAdoptBusy] = useState(null)
  const [openLibCategoryDropdown, setOpenLibCategoryDropdown] = useState(false)
  const [openLibBusinessTypeDropdown, setOpenLibBusinessTypeDropdown] = useState(false)

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId,
  })

  const onUnauthorized = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const { data: waStatusData, error: waStatusError, isLoading: waStatusLoading } = useQuery({
    queryKey: ['whatsappStatus', businessId],
    queryFn: () =>
      fetchWithAuth(
        `${API_BASE}/api/whatsapp/status`,
        { headers: authHeaders() },
        session,
        onUnauthorized,
      ).then(r => r.json()),
    staleTime: 1000 * 60 * 2,
    enabled: !!businessId && !!session?.access_token,
  })

  useEffect(() => {
    setLoadingWaStatus(waStatusLoading)
  }, [waStatusLoading])

  useEffect(() => {
    if (waStatusData) {
      setStatus(waStatusData || null)
    }
  }, [waStatusData])

  useEffect(() => {
    if (waStatusError) {
      setStatus(null)
    }
  }, [waStatusError])

  useEffect(() => {
    if (waTab === 'templates' && businessId && session?.access_token) {
      fetch(`${API_BASE}/api/whatsapp/templates`, { headers: authHeaders() }).then(r => r.ok ? r.json() : {}).then(d => setTemplates(d.templates || [])).catch(() => setTemplates([]))
    }
  }, [waTab, businessId, session?.access_token])

  useEffect(() => {
    if (waTab === 'templates' && session?.access_token) {
      const q = new URLSearchParams()
      if (libCategory) q.set('category', libCategory)
      if (libBusinessType) q.set('business_type', libBusinessType)
      fetch(`${API_BASE}/api/whatsapp/template-library?${q}`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : {})
        .then(d => setLibraryTemplates(d.templates || []))
        .catch(() => setLibraryTemplates([]))
    }
  }, [waTab, session?.access_token, libCategory, libBusinessType])

  useEffect(() => {
    if (waTab === 'rules' && businessId && session?.access_token) {
      fetch(`${API_BASE}/api/inbox/routing-rules`, { headers: authHeaders() }).then(r => r.ok ? r.json() : {}).then(d => setRules(d.rules || [])).catch(() => setRules([]))
      fetch(`${API_BASE}/api/staff?business_id=${businessId}`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []).then(setStaff).catch(() => [])
    }
  }, [waTab, businessId, session?.access_token])

  useEffect(() => {
    if (waTab === 'flows' && businessId && session?.access_token) {
      fetch(`${API_BASE}/api/whatsapp/flows`, { headers: authHeaders() }).then(r => r.ok ? r.json() : {}).then(d => setFlows(d.flows || [])).catch(() => setFlows([]))
    }
  }, [waTab, businessId, session?.access_token])

  const handleConnect = async () => {
    if (!connectForm.phone_number_id || !connectForm.waba_id || !connectForm.access_token) {
      toast.error('מלא את כל השדות הנדרשים')
      return
    }
    setConnecting(true)
    try {
      const r = await fetch(`${API_BASE}/api/whatsapp/connect`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({
          phone_number_id: connectForm.phone_number_id,
          waba_id: connectForm.waba_id,
          access_token: connectForm.access_token,
          business_phone_number: connectForm.business_phone_number || undefined,
          display_name: connectForm.display_name || undefined,
          is_sandbox: connectForm.is_sandbox,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      toast.success('חיבור הושלם בהצלחה')
      setStatus({ ...status, connected: true, display_name: data.display_name, business_phone_number: data.business_phone_number })
    } catch (e) { toast.error(e.message) }
    finally { setConnecting(false) }
  }

  const handleDisconnect = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/whatsapp/disconnect`, { method: 'DELETE', headers: authHeaders() })
      if (r.ok) { setStatus(null); toast.success('החשבון נותק') }
    } catch (e) { toast.error(e.message) }
  }

  const handleAddRule = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/inbox/routing-rules`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({
          ...ruleForm,
          target_agent_id: ruleForm.target_agent_id || null,
          rule_order: rules.length,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setRules([...rules, data.rule])
      setRuleModal(false)
      setRuleForm({ rule_type: 'keyword', match_value: '', channel: 'both', action: 'queue_general', target_agent_id: '', target_department: '', bot_reply_text: '', is_active: true })
      toast.success('כלל נוסף')
    } catch (e) { toast.error(e.message) }
  }

  const statusBadge = (s) => {
    if (s === 'PENDING') return <span style={{ background: '#F59E0B', color: '#000', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>ממתין</span>
    if (s === 'APPROVED') return <span style={{ background: '#22C55E', color: '#000', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>מאושר</span>
    if (s === 'REJECTED') return <span style={{ background: '#EF4444', color: '#fff', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>נדחה</span>
    return null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={sectionH2}>WhatsApp Business API</h2>
      <div style={{ display: 'flex', gap: 8, background: 'var(--v2-dark-2)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'account', label: 'חיבור חשבון', icon: MessageCircleMore },
          { id: 'templates', label: 'תבניות', icon: FileText },
          { id: 'rules', label: 'כללי ניתוב', icon: GitBranch },
          { id: 'flows', label: 'Flows', icon: Workflow },
        ].map(t => (
          <button key={t.id} onClick={() => setWaTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: 'none', background: waTab === t.id ? 'var(--v2-primary)' : 'transparent', color: waTab === t.id ? 'var(--v2-dark)' : 'var(--v2-gray-400)', fontWeight: 500, cursor: 'pointer',
          }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {waTab === 'account' && (
        <>
          {loadingWaStatus ? (
            <>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 24, color: 'var(--v2-gray-400)' }}>
                <RefreshCw size={20} style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                <span>בודק חיבור…</span>
              </div>
            </>
          ) : status?.connected ? (
            <div style={{ padding: 16, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <span style={{ fontWeight: 600, color: '#22C55E' }}>מחובר</span>
                <span style={{ color: 'var(--v2-gray-400)' }}>— {status.display_name} ({status.business_phone_number})</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>סשנים פעילים: {status.active_sessions_count || 0}</div>
              <button onClick={handleDisconnect} style={{ marginTop: 12, padding: '8px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>נתק</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="label">Phone Number ID (מ-Meta)</label><input className="input" value={connectForm.phone_number_id} onChange={e => setConnectForm(f => ({ ...f, phone_number_id: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">WABA ID</label><input className="input" value={connectForm.waba_id} onChange={e => setConnectForm(f => ({ ...f, waba_id: e.target.value }))} dir="ltr" /></div>
              <div><label className="label">Access Token</label><input type="password" className="input" value={connectForm.access_token} onChange={e => setConnectForm(f => ({ ...f, access_token: e.target.value }))} dir="ltr" placeholder="לא יוצג שוב" /></div>
              <div><label className="label">מספר טלפון עסקי</label><input className="input" value={connectForm.business_phone_number} onChange={e => setConnectForm(f => ({ ...f, business_phone_number: e.target.value }))} dir="ltr" placeholder="05X-XXX-XXXX" /></div>
              <div><label className="label">Display Name</label><input className="input" value={connectForm.display_name} onChange={e => setConnectForm(f => ({ ...f, display_name: e.target.value }))} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={connectForm.is_sandbox} onChange={e => setConnectForm(f => ({ ...f, is_sandbox: e.target.checked }))} /> Sandbox</label>
              <button onClick={handleConnect} disabled={connecting} className="btn-primary">חבר חשבון</button>
            </div>
          )}
        </>
      )}

      {waTab === 'templates' && (
        <>
          <h3 style={{ ...sectionH2, fontSize: 15, marginBottom: 8 }}>תבניות העסק</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {templates.map(t => (
              <div key={t.id} style={{ padding: 12, background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{t.template_name}</span>
                {statusBadge(t.meta_status)}
              </div>
            ))}
          </div>

          <h3 style={{ ...sectionH2, fontSize: 15, marginTop: 24, marginBottom: 8 }}>ספריית תבניות מוכנות</h3>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, marginBottom: 12 }}>בחר תבנית וצרף לעסק — התבנית תישלח לאישור Meta</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ position: 'relative', minWidth: 160 }}>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>קטגוריה</label>
              <button type="button" onClick={() => { setOpenLibBusinessTypeDropdown(false); setOpenLibCategoryDropdown(!openLibCategoryDropdown) }} style={{ width: '100%', textAlign: 'right', padding: '8px 12px', fontSize: 13, color: 'var(--text, var(--v2-gray-300))', background: 'var(--card, var(--v2-dark-2))', border: '1px solid var(--border, var(--glass-border))', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                {libCategory === '' ? 'הכל' : libCategory === 'UTILITY' ? 'אישורים ועדכונים (UTILITY)' : libCategory === 'MARKETING' ? 'קמפיינים ומבצעים (MARKETING)' : libCategory === 'AUTHENTICATION' ? 'אימות (AUTHENTICATION)' : libCategory === 'SERVICE' ? 'שירות (SERVICE)' : libCategory}
              </button>
              {openLibCategoryDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setOpenLibCategoryDropdown(false)} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: '100%', maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border, var(--glass-border))', borderRadius: 'var(--radius-md)', background: 'var(--card, var(--v2-dark-2))', padding: '4px 0', zIndex: 151, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                    {[{ value: '', label: 'הכל' }, { value: 'UTILITY', label: 'אישורים ועדכונים (UTILITY)' }, { value: 'MARKETING', label: 'קמפיינים ומבצעים (MARKETING)' }, { value: 'AUTHENTICATION', label: 'אימות (AUTHENTICATION)' }, { value: 'SERVICE', label: 'שירות (SERVICE)' }].map(opt => (
                      <button key={opt.value || 'all'} type="button" onClick={() => { setLibCategory(opt.value); setOpenLibCategoryDropdown(false) }} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'right', border: 'none', background: 'transparent', color: 'var(--text, var(--v2-gray-300))', cursor: 'pointer', fontSize: 13 }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div style={{ position: 'relative', minWidth: 140 }}>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>סוג עסק</label>
              <button type="button" onClick={() => { setOpenLibCategoryDropdown(false); setOpenLibBusinessTypeDropdown(!openLibBusinessTypeDropdown) }} style={{ width: '100%', textAlign: 'right', padding: '8px 12px', fontSize: 13, color: 'var(--text, var(--v2-gray-300))', background: 'var(--card, var(--v2-dark-2))', border: '1px solid var(--border, var(--glass-border))', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                {libBusinessType === '' ? 'הכל' : libBusinessType === 'hotel' ? 'מלון' : libBusinessType === 'restaurant' ? 'מסעדה' : libBusinessType === 'events' ? 'אירועים' : libBusinessType === 'retail' ? 'חנות' : libBusinessType === 'gym' ? 'חדר כושר' : libBusinessType === 'general' ? 'כללי' : libBusinessType}
              </button>
              {openLibBusinessTypeDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setOpenLibBusinessTypeDropdown(false)} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: '100%', maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border, var(--glass-border))', borderRadius: 'var(--radius-md)', background: 'var(--card, var(--v2-dark-2))', padding: '4px 0', zIndex: 151, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                    {[{ value: '', label: 'הכל' }, { value: 'hotel', label: 'מלון' }, { value: 'restaurant', label: 'מסעדה' }, { value: 'events', label: 'אירועים' }, { value: 'retail', label: 'חנות' }, { value: 'gym', label: 'חדר כושר' }, { value: 'general', label: 'כללי' }].map(opt => (
                      <button key={opt.value || 'all'} type="button" onClick={() => { setLibBusinessType(opt.value); setOpenLibBusinessTypeDropdown(false) }} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'right', border: 'none', background: 'transparent', color: 'var(--text, var(--v2-gray-300))', cursor: 'pointer', fontSize: 13 }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {libraryTemplates.map(t => {
              const comps = Array.isArray(t.components) ? t.components : (typeof t.components === 'string' ? (() => { try { return JSON.parse(t.components || '[]') } catch { return [] } })() : [])
              const bodyComp = comps.find(c => c.type === 'BODY')
              const headerComp = comps.find(c => c.type === 'HEADER')
              const previewText = (headerComp?.text ? headerComp.text.replace(/\{\{\d+\}\}/g, '•') + '\n' : '') + (bodyComp?.text || '').replace(/\{\{\d+\}\}/g, '•')
              return (
                <div key={t.id} style={{ padding: 14, background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.display_name_he || t.template_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 6 }}>{t.description_he}</div>
                      <div style={{ fontSize: 12, color: 'var(--v2-gray-300)', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>{previewText || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 999, background: 'rgba(0,195,122,0.15)', color: 'var(--v2-primary)' }}>{t.category}</span>
                      {t.business_type && <span style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>{t.business_type}</span>}
                      <button
                        disabled={adoptBusy === t.id}
                        onClick={async () => {
                          setAdoptBusy(t.id)
                          try {
                            const r = await fetch(`${API_BASE}/api/whatsapp/template-library/${t.id}/adopt`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({}) })
                            const data = await r.json()
                            if (!r.ok) throw new Error(data.error || 'שגיאה')
                            setTemplates(prev => [{ id: data.template?.id, template_name: data.template?.template_name, meta_status: data.template?.meta_status }, ...prev])
                            toast.success('התבנית נוספה ונשלחה לאישור Meta')
                          } catch (e) {
                            toast.error(e.message)
                          } finally {
                            setAdoptBusy(null)
                          }
                        }}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: 13 }}
                      >
                        {adoptBusy === t.id ? '...' : 'הוסף לעסק'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {libraryTemplates.length === 0 && (libCategory || libBusinessType) && (
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}>לא נמצאו תבניות — נסה פילטרים אחרים</p>
          )}
        </>
      )}

      {waTab === 'rules' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map(r => (
              <div key={r.id} style={{ padding: 14, background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><strong>{r.rule_type}</strong> — {r.match_value || '(ברירת מחדל)'} → {r.action}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{r.is_active ? <span style={{ color: '#22C55E' }}>פעיל</span> : <span style={{ color: '#94a3b8' }}>כבוי</span>}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setRuleModal(true)} className="btn-primary">+ הוסף כלל</button>
          {ruleModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setRuleModal(false)}>
              <div dir="rtl" style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => setRuleModal(false)} style={MODAL_CLOSE_X} aria-label="סגור">
                  <X size={20} />
                </button>
                <h3 style={{ marginBottom: 16 }}>כלל ניתוב חדש</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label className="label">סוג</label><CustomSelect value={ruleForm.rule_type} onChange={(val) => setRuleForm(f => ({ ...f, rule_type: val }))} options={[{ value: 'keyword', label: 'מילת מפתח' }, { value: 'department', label: 'מחלקה' }, { value: 'phone_number', label: 'מספר טלפון' }, { value: 'default', label: 'ברירת מחדל' }]} /></div>
                  <div><label className="label">ערך התאמה</label><input className="input" value={ruleForm.match_value} onChange={e => setRuleForm(f => ({ ...f, match_value: e.target.value }))} placeholder="למשל: הזמנה" /></div>
                  <div><label className="label">ערוץ</label><CustomSelect value={ruleForm.channel} onChange={(val) => setRuleForm(f => ({ ...f, channel: val }))} options={[{ value: 'both', label: 'כל הערוצים' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'sms', label: 'SMS' }]} /></div>
                  <div><label className="label">פעולה</label><CustomSelect value={ruleForm.action} onChange={(val) => setRuleForm(f => ({ ...f, action: val }))} options={[{ value: 'assign_agent', label: 'הקצה לנציג' }, { value: 'assign_department', label: 'הקצה למחלקה' }, { value: 'bot_reply', label: 'תשובת בוט' }, { value: 'queue_general', label: 'תור כללי' }]} /></div>
                  {ruleForm.action === 'assign_agent' && <div><label className="label">נציג</label><CustomSelect style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }} value={ruleForm.target_agent_id} onChange={(val) => setRuleForm(f => ({ ...f, target_agent_id: val }))} placeholder="בחר..." options={[{ value: '', label: 'בחר...' }, ...staff.map(s => ({ value: s.id, label: `#${s.role}` }))]} /></div>}
                  {ruleForm.action === 'assign_department' && <div><label className="label">מחלקה</label><input className="input" value={ruleForm.target_department} onChange={e => setRuleForm(f => ({ ...f, target_department: e.target.value }))} /></div>}
                  {ruleForm.action === 'bot_reply' && <div><label className="label">טקסט בוט</label><textarea className="input" value={ruleForm.bot_reply_text} onChange={e => setRuleForm(f => ({ ...f, bot_reply_text: e.target.value }))} rows={3} /></div>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => setRuleModal(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                  <button onClick={handleAddRule} className="btn-primary">שמור</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {waTab === 'flows' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {flows.map(f => (
              <div key={f.id} style={{ padding: 14, background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{f.display_name || f.flow_name}</span>
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,195,122,0.2)', color: 'var(--v2-primary)' }}>{FLOW_TYPES.find(t => t.id === f.flow_type)?.label || f.flow_type}</span>
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: f.meta_status === 'PUBLISHED' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: f.meta_status === 'PUBLISHED' ? '#22C55E' : '#F59E0B' }}>{f.meta_status === 'PUBLISHED' ? 'פורסם' : 'טיוטה'}</span>
                  <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{f.created_at ? new Date(f.created_at).toLocaleDateString('he-IL') : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {f.meta_status === 'DRAFT' && (
                    <button onClick={async () => { try { await fetch(`${API_BASE}/api/whatsapp/flows/${f.id}/publish`, { method: 'POST', headers: authHeaders() }); setFlows(prev => prev.map(x => x.id === f.id ? { ...x, meta_status: 'PUBLISHED' } : x)); toast.success('פורסם'); } catch (e) { toast.error(e.message); } }} style={{ padding: '6px 12px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>פרסם</button>
                  )}
                  <button onClick={() => setFlowSendModal(f)} style={{ padding: '6px 12px', background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>שלח ללקוחות</button>
                  <button onClick={async () => { if (!confirm('למחוק את ה-Flow?')) return; try { await fetch(`${API_BASE}/api/whatsapp/flows/${f.id}`, { method: 'DELETE', headers: authHeaders() }); setFlows(prev => prev.filter(x => x.id !== f.id)); toast.success('נמחק'); } catch (e) { toast.error(e.message); } }} style={{ padding: '6px 12px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>מחק</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { setFlowCreateModal(true); setFlowCreateStep(1); setFlowCreateType(null); setFlowCreateParams({ business_name: '', event_name: '', coupon_title: '' }); setFlowCreateDisplayName(''); setFlowCreateError(null); }} className="btn-primary" style={{ alignSelf: 'flex-start' }}><Plus size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} /> צור Flow חדש</button>

          {flowCreateModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => !flowCreateBusy && setFlowCreateModal(false)}>
              <div dir="rtl" style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => !flowCreateBusy && setFlowCreateModal(false)} style={MODAL_CLOSE_X} aria-label="סגור">
                  <X size={20} />
                </button>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Workflow size={20} /> צור Flow חדש — שלב {flowCreateStep}/3</h3>
                {flowCreateStep === 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                    {FLOW_TYPES.map(t => {
                      const Icon = t.icon
                      return (
                        <button key={t.id} type="button" onClick={() => { setFlowCreateType(t.id); setFlowCreateStep(2); }} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <Icon size={28} style={{ display: 'block', margin: '0 auto 8px', color: 'var(--v2-primary)' }} />
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 4 }}>{t.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {flowCreateStep === 2 && flowCreateType && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label className="label">שם תצוגה</label><input className="input" value={flowCreateDisplayName} onChange={e => setFlowCreateDisplayName(e.target.value)} placeholder="למשל: צ'ק-אין אירוע קיץ" /></div>
                    <div><label className="label">שם עסק</label><input className="input" value={flowCreateParams.business_name} onChange={e => setFlowCreateParams(p => ({ ...p, business_name: e.target.value }))} placeholder="המסעדה שלי" /></div>
                    {['checkin', 'purchase'].includes(flowCreateType) && <div><label className="label">שם אירוע</label><input className="input" value={flowCreateParams.event_name} onChange={e => setFlowCreateParams(p => ({ ...p, event_name: e.target.value }))} placeholder="ערב מוזיקה" /></div>}
                    {flowCreateType === 'validator' && <div><label className="label">שם קופון</label><input className="input" value={flowCreateParams.coupon_title} onChange={e => setFlowCreateParams(p => ({ ...p, coupon_title: e.target.value }))} placeholder="הנחה 20%" /></div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setFlowCreateStep(1)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>הקודם</button>
                      <button type="button" onClick={() => setFlowCreateStep(3)} className="btn-primary">המשך</button>
                    </div>
                  </div>
                )}
                {flowCreateStep === 3 && flowCreateType && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: 12, background: 'var(--v2-dark-3)', borderRadius: 8, fontSize: 13 }}>
                      <div><strong>סוג:</strong> {FLOW_TYPES.find(t => t.id === flowCreateType)?.label}</div>
                      <div><strong>שם תצוגה:</strong> {flowCreateDisplayName || '—'}</div>
                      <div><strong>שם עסק:</strong> {flowCreateParams.business_name || '—'}</div>
                      {['checkin', 'purchase'].includes(flowCreateType) && <div><strong>שם אירוע:</strong> {flowCreateParams.event_name || '—'}</div>}
                      {flowCreateType === 'validator' && <div><strong>שם קופון:</strong> {flowCreateParams.coupon_title || '—'}</div>}
                    </div>
                    {flowCreateError && <div style={{ color: '#EF4444', fontSize: 13 }}>{flowCreateError}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setFlowCreateStep(2)} disabled={flowCreateBusy} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>הקודם</button>
                      <button type="button" disabled={flowCreateBusy || !flowCreateParams.business_name?.trim()} className="btn-primary" onClick={async () => {
                        setFlowCreateBusy(true); setFlowCreateError(null)
                        try {
                          const r = await fetch(`${API_BASE}/api/whatsapp/flows`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ flow_type: flowCreateType, params: { ...flowCreateParams, business_name: flowCreateParams.business_name || 'העסק' }, display_name: flowCreateDisplayName || undefined }) })
                          const data = await r.json().catch(() => ({}))
                          if (!r.ok) throw new Error(data.error || 'שגיאה ביצירת Flow')
                          const flowId = data.flow?.id
                          if (flowId) {
                            const r2 = await fetch(`${API_BASE}/api/whatsapp/flows/${flowId}/publish`, { method: 'POST', headers: authHeaders() })
                            if (!r2.ok) { setFlowCreateError('נוצר אך פרסום נכשל'); setFlowCreateBusy(false); return }
                          }
                          setFlows(prev => [{ ...data.flow, meta_status: 'PUBLISHED' }, ...prev])
                          setFlowCreateModal(false)
                          toast.success('Flow נוצר ופורסם')
                        } catch (e) { setFlowCreateError(e.message || 'שגיאה') }
                        setFlowCreateBusy(false)
                      }}>{flowCreateBusy ? '...' : 'צור ופרסם'}</button>
                    </div>
                  </div>
                )}
                {flowCreateStep > 1 && (
                  <button type="button" onClick={() => setFlowCreateModal(false)} style={{ marginTop: 12, fontSize: 12, color: 'var(--v2-gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}>ביטול</button>
                )}
              </div>
            </div>
          )}

          {flowSendModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => !flowSendBusy && setFlowSendModal(null)}>
              <div dir="rtl" style={{ position: 'relative', background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 420, width: '100%', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => !flowSendBusy && setFlowSendModal(null)} style={MODAL_CLOSE_X} aria-label="סגור">
                  <X size={20} />
                </button>
                <h3 style={{ marginBottom: 16 }}>שלח Flow — {flowSendModal.display_name || flowSendModal.flow_name}</h3>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">טלפונים (מופרדים בפסיק או שורה)</label>
                  <textarea className="input" rows={4} value={flowSendPhones} onChange={e => setFlowSendPhones(e.target.value)} placeholder="0501234567, 0509876543" dir="ltr" style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">שם תבנית WA (אופציונלי)</label>
                  <input className="input" value={flowSendTemplate} onChange={e => setFlowSendTemplate(e.target.value)} placeholder="flow_invite" dir="ltr" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">טקסט כפתור CTA (אופציונלי)</label>
                  <input className="input" value={flowSendCta} onChange={e => setFlowSendCta(e.target.value)} placeholder="התחל" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setFlowSendModal(null)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                  <button disabled={flowSendBusy || !flowSendPhones.trim()} className="btn-primary" onClick={async () => {
                    setFlowSendBusy(true)
                    const phones = flowSendPhones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean)
                    try {
                      const r = await fetch(`${API_BASE}/api/whatsapp/flows/${flowSendModal.id}/send`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ recipient_phones: phones, template_name: flowSendTemplate || 'flow_invite', flow_cta_text: flowSendCta || undefined }) })
                      const data = await r.json().catch(() => ({}))
                      if (!r.ok) throw new Error(data.error || 'שגיאה')
                      const ok = (data.results || []).filter(x => x.success).length
                      toast.success(`נשלח ל-${ok}/${phones.length} נמענים`)
                      setFlowSendModal(null); setFlowSendPhones('')
                    } catch (e) { toast.error(e.message) }
                    setFlowSendBusy(false)
                  }}>{flowSendBusy ? '...' : 'שלח'}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

function formatPhone(p) {
  if (!p) return '—'
  const d = String(p).replace(/\D/g, '')
  if (d.startsWith('972') && d.length >= 12) return `0${d.slice(3, 5)}-${d.slice(5, 8)}-${d.slice(8)}`
  if (d.length >= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return p
}

function toE164(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('972')) return `+${digits}`
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`
  if (digits.length >= 9) return `+972${digits}`
  return null
}

function AccountChangeModal({ type, onClose, updateUser, toE164 }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const isPhone = type === 'phone'

  const handleSubmit = async () => {
    if (!value.trim()) return
    setLoading(true)
    try {
      if (isPhone) {
        const e164 = toE164(value)
        if (!e164) throw new Error('מספר טלפון לא תקין')
        await updateUser({ phone: e164 })
        toast.success('קוד אימות נשלח — אמת בטלפון החדש')
      } else {
        await updateUser({ email: value.trim() })
        toast.success('קישור אימות נשלח למייל')
      }
      onClose()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div dir="rtl" style={{ position: 'relative', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 360, width: '90%' }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={MODAL_CLOSE_X} aria-label="סגור">
          <X size={20} />
        </button>
        <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>שינוי {isPhone ? 'טלפון' : 'מייל'}</h3>
        <input
          className="input"
          type={isPhone ? 'tel' : 'email'}
          dir="ltr"
          placeholder={isPhone ? '05XXXXXXXX' : 'email@example.com'}
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>ביטול</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '10px 20px' }}>
            {loading ? '...' : isPhone ? 'שלח קוד אימות' : 'שלח קישור אימות'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BusinessTypeTab({ businessId, config, onConfigChange }) {
  const [businessTypes, setBusinessTypes] = useState([])
  const [changeModalOpen, setChangeModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedSubType, setSelectedSubType] = useState(null)
  const [savingType, setSavingType] = useState(false)
  const [featuresOverride, setFeaturesOverride] = useState({})
  const [savingFeatures, setSavingFeatures] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/business-types`).then(r => r.ok ? r.json() : []).then(setBusinessTypes).catch(() => [])
  }, [])

  useEffect(() => {
    if (config?.features) setFeaturesOverride(config.features)
  }, [config?.features])

  const handleChangeType = async () => {
    if (!businessId || !selectedType) return
    setSavingType(true)
    try {
      const r = await fetch(`${API_BASE}/api/admin/businesses/${businessId}/type`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_type: selectedType.type_key, business_sub_type: selectedSubType || null }),
      })
      if (!r.ok) throw new Error()
      const data = await r.json()
      onConfigChange?.(data)
      setChangeModalOpen(false)
      setSelectedType(null)
      setSelectedSubType(null)
      toast.success('סוג העסק עודכן')
    } catch {
      toast.error('שגיאה בעדכון סוג העסק')
    } finally {
      setSavingType(false)
    }
  }

  const handleSaveFeatures = async () => {
    if (!businessId) return
    setSavingFeatures(true)
    try {
      const r = await fetch(`${API_BASE}/api/admin/businesses/${businessId}/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features_config: featuresOverride }),
      })
      if (!r.ok) throw new Error()
      const data = await r.json()
      onConfigChange?.({ ...config, features: data.features })
      toast.success('הפיצ\'רים עודכנו')
    } catch {
      toast.error('שגיאה בשמירת פיצ\'רים')
    } finally {
      setSavingFeatures(false)
    }
  }

  const toggleFeature = (key) => {
    setFeaturesOverride(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const featureKeys = Object.keys(FEATURE_LABELS)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={sectionH2}>סוג עסק</h2>
      <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>
        סוג העסק קובע אילו כלים יופיעו בדשבורד שלך. תמיד ניתן לשנות.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4 }}>סוג נוכחי</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {config?.emoji || '🏬'} {config?.type_label || 'עסק כללי'}
          </div>
          {config?.sub_type_label && (
            <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 4 }}>תת-סוג: {config.sub_type_label}</div>
          )}
        </div>
        <button onClick={() => { setChangeModalOpen(true); setSelectedType(null); setSelectedSubType(null) }} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
          שנה סוג עסק
        </button>
      </div>

      <h2 style={{ ...sectionH2, marginTop: 8 }}>פיצ\'רים פעילים</h2>
      <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>התאם אישית את הכלים שלך</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {featureKeys.map(key => {
          const Icon = FEATURE_ICONS[key]
          const label = FEATURE_LABELS[key]
          const checked = !!featuresOverride[key]
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--glass-border)' }}>
              <input type="checkbox" checked={checked} onChange={() => toggleFeature(key)} />
              {Icon && <Icon size={18} style={{ color: 'var(--v2-gray-400)' }} />}
              <span style={{ color: '#fff', fontWeight: 500 }}>{label}</span>
            </label>
          )
        })}
      </div>
      <SaveButton saving={savingFeatures} onClick={handleSaveFeatures} label="שמור פיצ\'רים" />

      {changeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: 24 }} onClick={() => setChangeModalOpen(false)}>
          <div dir="rtl" style={{ position: 'relative', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setChangeModalOpen(false)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>שנה סוג עסק</h3>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 16 }}>
              שינוי סוג העסק ישנה את הלשוניות הזמינות בדשבורד.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              {businessTypes.map(t => {
                const isSelected = selectedType?.type_key === t.type_key
                const desc = TYPE_DESCRIPTIONS[t.type_key] || ''
                return (
                  <button
                    key={t.type_key}
                    type="button"
                    onClick={() => { setSelectedType(t); setSelectedSubType(null) }}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: isSelected ? '2px solid var(--v2-primary)' : '1px solid var(--glass-border)',
                      background: isSelected ? 'rgba(0,195,122,0.08)' : 'transparent',
                      textAlign: 'right',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{t.emoji || '🏬'}</span>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{desc}</div>
                  </button>
                )
              })}
            </div>
            {selectedType && Array.isArray(selectedType.sub_types) && selectedType.sub_types.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 8 }}>ספר לנו יותר:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedType.sub_types.map(s => (
                    <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="radio" name="sub_type" checked={selectedSubType === s.key} onChange={() => setSelectedSubType(s.key)} />
                      <span style={{ color: '#fff' }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setChangeModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
              <button onClick={handleChangeType} disabled={savingType || !selectedType} className="btn-primary" style={{ padding: '10px 20px' }}>
                {savingType ? '...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function Settings() {
  const settingsAllowed = useRequirePermission('can_manage_settings')
  const { user, session, updateUser, businessId } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [saving, setSaving] = useState(false)

  const [businessForm, setBusinessForm] = useState({
    name: 'קפה רוטשילד', phone: '050-1234567',
    email: 'info@rotschild.co.il', address: 'רוטשילד 22, תל אביב',
    website: 'https://rotschild.co.il',
  })

  const [smsForm, setSmsForm] = useState({
    senderName: 'RotschildCafe',
    defaultMessage: 'שלום {שם}, קפה רוטשילד מזמינים אותך...',
    optOutText: 'להסרה שלח STOP',
  })

  const [notifications, setNotifications] = useState({
    campaignSent: true, lowBalance: true, redemption: false, weeklyReport: true,
  })

  const [accountChange, setAccountChange] = useState(null)
  const [stripeStatus, setStripeStatus] = useState({ stripe_account_status: 'not_connected', service_fee_percent: 0 })
  const [stripeLoading, setStripeLoading] = useState(false)
  const [serviceFee, setServiceFee] = useState(0)
  const [businessConfig, setBusinessConfig] = useState(null)

  useEffect(() => {
    if (activeTab === 'businesstype' && businessId) {
      fetch(`${API_BASE}/api/admin/business-config?business_id=${businessId}`)
        .then(r => r.ok ? r.json() : null)
        .then(setBusinessConfig)
        .catch(() => setBusinessConfig(null))
    }
  }, [activeTab, businessId])

  useEffect(() => {
    if (activeTab === 'payments' && businessId) {
      fetch(`${API_BASE}/api/stripe/status/${businessId}`)
        .then(r => r.ok ? r.json() : {})
        .then(data => {
          setStripeStatus(data)
          setServiceFee(data.service_fee_percent ?? 0)
        })
        .catch(() => {})
    }
  }, [activeTab, businessId])

  const handleStripeConnect = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/stripe/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, email: businessForm.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      if (data.onboardingUrl) window.location.href = data.onboardingUrl
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleSaveServiceFee = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/stripe/service-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, service_fee_percent: serviceFee }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      setStripeStatus(s => ({ ...s, service_fee_percent: data.service_fee_percent }))
      toast.success('עמלת התפעול נשמרה')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    toast.success('ההגדרות נשמרו בהצלחה')
  }

  if (!settingsAllowed) return null

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">
      <div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>הגדרות</h1>
        <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>נהל את פרטי העסק והעדפות המערכת</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 4, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                background: isActive ? 'var(--v2-primary)' : 'transparent',
                color: isActive ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--v2-gray-400)' }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>שיתוף חשבון</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>טלפון מקושר</div>
                <div dir="ltr" style={{ fontWeight: 500, color: '#fff' }}>{user?.phone ? formatPhone(user.phone) : '—'}</div>
              </div>
              <button onClick={() => setAccountChange('phone')} style={{ padding: '8px 14px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>שנה</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>מייל מקושר</div>
                <div dir="ltr" style={{ fontWeight: 500, color: '#fff' }}>{user?.email || '—'}</div>
              </div>
              <button onClick={() => setAccountChange('email')} style={{ padding: '8px 14px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>שנה</button>
            </div>
          </div>
          {accountChange && (
            <AccountChangeModal
              type={accountChange}
              onClose={() => setAccountChange(null)}
              updateUser={updateUser}
              toE164={toE164}
            />
          )}
        </motion.div>
      )}

      {/* Business Type Tab */}
      {activeTab === 'businesstype' && (
        <BusinessTypeTab businessId={businessId} config={businessConfig} onConfigChange={setBusinessConfig} />
      )}

      {/* Business Tab */}
      {activeTab === 'business' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>פרטי העסק</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { label: 'שם העסק', key: 'name', type: 'text' },
              { label: 'טלפון', key: 'phone', type: 'text' },
              { label: 'אימייל', key: 'email', type: 'email' },
              { label: 'כתובת', key: 'address', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type={type} className="input" value={businessForm[key]} onChange={e => setBusinessForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">אתר אינטרנט</label>
              <input className="input" value={businessForm.website} onChange={e => setBusinessForm(f => ({ ...f, website: e.target.value }))} />
            </div>
          </div>
          <SaveButton saving={saving} onClick={handleSave} label="שמור שינויים" />
        </motion.div>
      )}

      {/* WhatsApp Business Tab */}
      {activeTab === 'whatsapp' && (
        <WhatsAppTab businessId={businessId} session={session} />
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <LinksTab businessId={businessId} />
      )}

      {/* Webview Analytics Tab */}
      {activeTab === 'webview_analytics' && (
        <WebviewAnalytics
          businessId={businessId}
          authHeaders={() => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'X-Business-Id': businessId,
          })}
        />
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>תשלומים דרך Stripe</h2>
          {stripeStatus.stripe_account_status === 'not_connected' && (
            <>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>חבר חשבון Stripe לקבלת תשלומים מאירועים ומכירת כרטיסים</p>
              <button
                onClick={handleStripeConnect}
                disabled={stripeLoading}
                className="btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                {stripeLoading ? 'טוען...' : 'חבר עכשיו'}
              </button>
            </>
          )}
          {stripeStatus.stripe_account_status === 'pending' && (
            <>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>ממתין לאישור Stripe — השלם את תהליך ההרשמה</p>
              <button
                onClick={handleStripeConnect}
                disabled={stripeLoading}
                className="btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                {stripeLoading ? 'טוען...' : 'המשך הגדרה'}
              </button>
            </>
          )}
          {stripeStatus.stripe_account_status === 'active' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v2-primary)' }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <span style={{ fontWeight: 600 }}>חשבון מחובר ופעיל</span>
              </div>
              <div>
                <label className="label">עמלת תפעול (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={serviceFee}
                  onChange={e => setServiceFee(parseFloat(e.target.value) || 0)}
                  className="input"
                  style={{ maxWidth: 120 }}
                />
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>נוספת ל-5% עמלת פלטפורמה</div>
              </div>
              <SaveButton saving={stripeLoading} onClick={handleSaveServiceFee} label="שמור" />
            </>
          )}
        </motion.div>
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>הגדרות SMS</h2>
          <div>
            <label className="label">שם שולח (Sender ID)</label>
            <input className="input" value={smsForm.senderName} maxLength={11} onChange={e => setSmsForm(f => ({ ...f, senderName: e.target.value }))} />
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>עד 11 תווים, ללא רווחים. זה מה שהנמען יראה כשולח.</div>
          </div>
          <div>
            <label className="label">הודעת ברירת מחדל</label>
            <textarea className="input" style={{ resize: 'none' }} rows={3} value={smsForm.defaultMessage} onChange={e => setSmsForm(f => ({ ...f, defaultMessage: e.target.value }))} />
          </div>
          <div>
            <label className="label">טקסט הסרה (Opt-out)</label>
            <input className="input" value={smsForm.optOutText} onChange={e => setSmsForm(f => ({ ...f, optOutText: e.target.value }))} />
          </div>
          <SaveButton saving={saving} onClick={handleSave} label="שמור" />
        </motion.div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current plan */}
          <div style={cardStyle}>
            <h2 style={sectionH2}>חבילה נוכחית</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(0,195,122,0.08)', border: '1px solid rgba(0,195,122,0.2)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: '#ffffff' }}>Basic</div>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 2 }}>8 אג׳ להודעה • עד 10,000 הודעות</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 26, color: 'var(--v2-primary)', lineHeight: 1 }}>4,820</div>
                <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>הודעות נותרות</div>
              </div>
            </div>
          </div>

          {/* Upgrade options */}
          <div style={cardStyle}>
            <h2 style={sectionH2}>שדרג חבילה</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Business', price: '7', range: '10,001–50,000', highlight: true },
                { name: 'Premium',  price: '6', range: '50,001–200,000', highlight: false },
                { name: 'Enterprise', price: '5', range: '200,001+',    highlight: false },
              ].map(plan => (
                <div key={plan.name}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${plan.highlight ? 'rgba(0,195,122,0.35)' : 'var(--glass-border)'}`,
                    background: plan.highlight ? 'rgba(0,195,122,0.05)' : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => { if (!plan.highlight) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { if (!plan.highlight) e.currentTarget.style.borderColor = 'var(--glass-border)' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 14 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{plan.range} הודעות</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>{plan.price} אג׳</div>
                      <div style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>להודעה</div>
                    </div>
                    <button className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>שדרג</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase credits */}
          <div style={cardStyle}>
            <h2 style={sectionH2}>רכישת קרדיטים</h2>
            <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 16 }}>הקרדיטים לא פגים ואין דמי מנוי. שלם רק על מה ששלחת.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { amount: '5,000', price: '₪40' },
                { amount: '10,000', price: '₪80' },
                { amount: '50,000', price: '₪350' },
              ].map(opt => (
                <button key={opt.amount}
                  style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,195,122,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                >
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>{opt.amount}</div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>הודעות</div>
                  <div style={{ color: 'var(--v2-primary)', fontWeight: 700, fontSize: 14, marginTop: 4 }}>{opt.price}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={sectionH2}>העדפות התראות</h2>
          {[
            { key: 'campaignSent',  label: 'קמפיין נשלח',    desc: 'קבל התראה כשקמפיין מסתיים' },
            { key: 'lowBalance',    label: 'יתרה נמוכה',      desc: 'התראה כשיתרה מתחת ל-500 הודעות' },
            { key: 'redemption',    label: 'מימוש Validator', desc: 'התראה על כל מימוש קופון' },
            { key: 'weeklyReport',  label: 'דוח שבועי',       desc: 'סיכום שבועי באימייל' },
          ].map(({ key, label, desc }, idx, arr) => (
            <div key={key}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: idx < arr.length - 1 ? '1px solid var(--glass-border)' : 'none' }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{desc}</div>
              </div>
              <button onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                style={{ width: 48, height: 24, borderRadius: 9999, background: notifications[key] ? 'var(--v2-primary)' : 'rgba(255,255,255,0.08)', border: notifications[key] ? 'none' : '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: notifications[key] ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
              </button>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <SaveButton saving={saving} onClick={handleSave} label="שמור" />
          </div>
        </motion.div>
      )}
    </div>
  )
}

function SaveButton({ saving, onClick, label }) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {saving
        ? <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--v2-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        : <Save size={16} />
      }
      {label}
    </button>
  )
}
