import { useState, useEffect, useCallback } from 'react'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  QrCode,
  Ticket,
  Tag,
  Users,
  Star,
  CheckCircle,
  Clock,
  Link,
  Copy,
  ExternalLink,
  X,
  Plus,
  Search,
  Upload,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import CustomSelect from '@/components/ui/CustomSelect'
import { fetchWithAuth } from '@/lib/supabase'


const TYPE_CONFIG = {
  event: { icon: <Ticket size={18} />, color: '#3B82F6', label: 'אירוע' },
  coupon: { icon: <Tag size={18} />, color: '#00C37A', label: 'קופון' },
  membership: { icon: <Users size={18} />, color: '#8B5CF6', label: 'חברות' },
  general: { icon: <Star size={18} />, color: '#F59E0B', label: 'כללי' },
  ticket: { icon: <Ticket size={18} />, color: '#3B82F6', label: 'כרטיס' },
  benefit: { icon: <Star size={18} />, color: '#EC4899', label: 'הטבה' },
  confirm: { icon: <Star size={18} />, color: '#F59E0B', label: 'כללי' },
  custom: { icon: <Star size={18} />, color: '#EC4899', label: 'מותאם אישית' },
}

const STATUS_TABS = ['הכל', 'תבניות', 'פעיל', 'מומש', 'פג תוקף']

function templateToEditForm(t) {
  const dc = t.display_config && typeof t.display_config === 'object' ? t.display_config : {}
  const rc = t.redemption_config && typeof t.redemption_config === 'object' ? t.redemption_config : {}
  return {
    id: t.id,
    name: t.name || '',
    description: dc.subtitle || '',
    type: t.type || 'event',
    customType: t.custom_type_name || '',
    expires_at: t.expires_at ? String(t.expires_at).slice(0, 10) : '',
    no_expiry: !t.expires_at,
    binding_type: t.binding_type || 'standalone',
    binding_id: t.binding_id ? String(t.binding_id) : '',
    channels: Array.isArray(t.channels) && t.channels.length ? [...t.channels] : ['whatsapp'],
    max_uses: t.max_uses ?? null,
    single_use: rc.single_use !== false,
  }
}

/* ── QR Modal ── */
function QRModal({ validator, onClose }) {
  const [copied, setCopied] = useState(false)
  const url = `https://axess.pro/v/${validator.slug}`

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          width: '100%',
          maxWidth: 380,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: '#ffffff',
            }}
          >
            {validator.title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--v2-gray-400)')}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <QRCodeSVG value={url} size={160} level="M" includeMargin />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <Link size={14} style={{ color: 'var(--v2-gray-400)', flexShrink: 0 }} aria-hidden />
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: 12,
              color: 'var(--v2-gray-400)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {url}
          </div>
          <button
            onClick={copy}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${copied ? 'rgba(99,102,241,0.3)' : 'var(--glass-border)'}`,
              background: copied ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
              color: copied ? 'var(--v2-accent)' : 'var(--v2-gray-400)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--v2-primary)',
              color: 'var(--v2-dark)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <ExternalLink size={16} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 22, color: '#ffffff' }}>
              {validator.total.toLocaleString('he-IL')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>נשלחו</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 22, color: 'var(--v2-accent)' }}>
              {validator.redeemed.toLocaleString('he-IL')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>מומשו</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Validators() {
  const validatorsAllowed = useRequirePermission('can_manage_events')
  const { businessId } = useAuth()
  const [validators, setValidators] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [showEditTemplate, setShowEditTemplate] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [sendTemplate, setSendTemplate] = useState(null)
  const [sendMode, setSendMode] = useState('audience')
  const [selectedAudiences, setSelectedAudiences] = useState([])
  const [manualNumbers, setManualNumbers] = useState('')
  const [audiences, setAudiences] = useState([])
  const [sendChannel, setSendChannel] = useState('whatsapp')
  const [sendSubmitting, setSendSubmitting] = useState(false)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('הכל')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'event',
    customType: '',
    expires_at: '',
    no_expiry: true,
    binding_type: 'standalone',
    binding_id: '',
    channels: ['whatsapp'],
    max_uses: null,
    single_use: true,
  })

  const loadValidators = useCallback(() => {
    if (!businessId) {
      setValidators([])
      setListLoading(false)
      return
    }
    setListLoading(true)
    fetchWithAuth(`/api/validators?business_id=${encodeURIComponent(businessId)}`, { _raw: true })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ validators: [] })))
      .then((d) => setValidators(d.validators || []))
      .catch(() => setValidators([]))
      .finally(() => setListLoading(false))
  }, [businessId])

  const loadTemplates = useCallback(async () => {
    if (!businessId) {
      setTemplates([])
      return
    }
    setTemplatesLoading(true)
    try {
      const r = await fetchWithAuth('/api/validator-templates', { _raw: true })
      const d = r.ok ? await r.json() : { templates: [] }
      setTemplates(d.templates || [])
    } catch {
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    loadValidators()
  }, [loadValidators])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    if (!showSend || !businessId) return
    fetchWithAuth(`/api/audiences?business_id=${encodeURIComponent(businessId)}`, { _raw: true })
      .then((r) => (r.ok ? r.json() : { audiences: [] }))
      .then((d) => setAudiences(d.audiences || []))
      .catch(() => setAudiences([]))
  }, [showSend, businessId])

  const filtered = (activeTab === 'תבניות' ? templates : validators).filter((v) => {
    if (activeTab === 'תבניות') {
      const matchType = typeFilter === 'all' || typeFilter === 'templates' ? true : v.type === typeFilter
      const matchSearch = !search || v.name?.toLowerCase().includes(search.toLowerCase())
      return matchType && matchSearch
    }
    const matchTab =
      activeTab === 'הכל' ||
      (activeTab === 'פעיל' && v.status === 'active') ||
      (activeTab === 'מומש' && v.status === 'redeemed') ||
      (activeTab === 'פג תוקף' && v.status === 'expired')
    const matchType = typeFilter === 'all' || typeFilter === 'templates' ? true : v.type === typeFilter
    const matchSearch =
      !search ||
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.name?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchType && matchSearch
  })

  const recipientCount =
    sendMode === 'manual'
      ? manualNumbers.split('\n').filter((n) => n.trim().length > 8).length
      : sendMode === 'audience'
        ? audiences
            .filter((a) => selectedAudiences.some((sid) => String(sid) === String(a.id)))
            .reduce((sum, a) => sum + (a.recipient_count || 0), 0)
        : 0

  if (!validatorsAllowed) return null

  if (!businessId) {
    return (
      <div dir="rtl" style={{ padding: 24, color: 'var(--v2-gray-400)' }}>
        אין הקשר עסק — התחבר מחדש.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', textAlign: 'right' }}>Validators</h1>
        <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', margin: 0, textAlign: 'right' }}>
          ניהול ויצירת כרטיסי אימות וסריקה מסוגים שונים — אירועים, קופונים, חברי מועדון, הנחות וסוג מותאם אישית
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: activeTab === tab ? 'none' : '1px solid var(--glass-border)',
              background: activeTab === tab ? 'rgba(0,195,122,0.12)' : 'transparent',
              color: activeTab === tab ? 'var(--v2-primary)' : 'var(--text)',
              fontWeight: activeTab === tab ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} /> Validator חדש
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: 'כל הסוגים' },
            { value: 'event', label: 'אירוע' },
            { value: 'coupon', label: 'קופון' },
            { value: 'membership', label: 'חברות' },
            { value: 'general', label: 'כללי' },
            { value: 'templates', label: 'תבניות' },
          ]}
          style={{ width: 140 }}
        />
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--v2-gray-400)',
              pointerEvents: 'none',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש..."
            style={{
              width: '100%',
              height: 36,
              paddingRight: 32,
              paddingLeft: 12,
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {activeTab === 'תבניות' && templatesLoading ? (
        <p style={{ color: 'var(--v2-gray-400)', textAlign: 'center', padding: 24 }}>טוען…</p>
      ) : activeTab !== 'תבניות' && listLoading ? (
        <p style={{ color: 'var(--v2-gray-400)', textAlign: 'center', padding: 24 }}>טוען…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🎫" title="אין פריטים" description="צור תבנית או שלח כרטיסים כדי לראות כאן" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {activeTab === 'תבניות'
            ? filtered.map((t, i) => {
                const config = TYPE_CONFIG[t.type] || TYPE_CONFIG.general
                const typeLabel = t.type === 'custom' && t.custom_type_name ? t.custom_type_name : config.label
                const agg = validators.find((v) => v.title === t.name)
                const totalIssued = agg?.total ?? 0
                const redeemedIssued = agg?.redeemed ?? 0
                const activeIssued = typeof agg?.active_count === 'number' ? agg.active_count : 0
                const redemptionRate = totalIssued > 0 ? Math.round((redeemedIssued / totalIssued) * 100) : 0
                const channelsLabel = Array.isArray(t.channels) && t.channels.length ? t.channels.join(', ') : '—'
                const createdLabel = t.created_at ? new Date(t.created_at).toLocaleDateString('he-IL') : '—'

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      background: 'var(--v2-dark-3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px',
                      cursor: 'default',
                      transition: 'border-color 0.25s, transform 0.25s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--v2-primary)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', color: config.color, flexShrink: 0 }}>{config.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{typeLabel}</div>
                        </div>
                      </div>
                      <Badge variant="scheduled">תבנית</Badge>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--v2-gray-400)',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        marginBottom: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={channelsLabel}
                    >
                      ערוצים: {channelsLabel}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: '#ffffff' }}>
                          {totalIssued.toLocaleString('he-IL')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>מופעים</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: 'var(--v2-accent)' }}>
                          {redeemedIssued.toLocaleString('he-IL')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>מומשו</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: 'var(--v2-primary)' }}>
                          {activeIssued.toLocaleString('he-IL')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>פעילים</div>
                      </div>
                    </div>

                    {totalIssued > 0 && (
                      <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 9999, height: 6, marginBottom: 12 }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 9999,
                            background: 'var(--v2-accent)',
                            width: `${redemptionRate}%`,
                            transition: 'width 1s ease',
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> נוצר {createdLabel}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm(templateToEditForm(t))
                          setShowEditTemplate(true)
                        }}
                        style={{
                          flex: 1,
                          background: 'var(--glass)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 8,
                          padding: '10px 10px',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: 'var(--text)',
                        }}
                      >
                        ✏️ ערוך
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSendTemplate(t)
                          setShowSend(true)
                          setSendMode('audience')
                          setSelectedAudiences([])
                          setManualNumbers('')
                          setSendChannel('whatsapp')
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        שלח לקהל
                      </button>
                    </div>
                  </motion.div>
                )
              })
            : filtered.map((v, i) => {
                const config = TYPE_CONFIG[v.type] || TYPE_CONFIG.general
                const redemptionRate = v.total > 0 ? Math.round((v.redeemed / v.total) * 100) : 0
                const activeCount = typeof v.active_count === 'number' ? v.active_count : 0
                const createdLabel = v.createdLabel || v.expiry

                return (
                  <motion.div
                    key={`${v.id}-${v.title}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelected(v)}
                    style={{
                      background: 'var(--v2-dark-3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px',
                      cursor: 'pointer',
                      transition: 'border-color 0.25s, transform 0.25s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--v2-primary)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', color: config.color, flexShrink: 0 }}>{config.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{v.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{v.campaign}</div>
                        </div>
                      </div>
                      <Badge variant={v.status === 'active' ? 'active' : v.status === 'expired' ? 'danger' : 'scheduled'}>
                        {v.status === 'active' ? 'פעיל' : v.status === 'expired' ? 'פג תוקף' : v.status === 'redeemed' ? 'מומש' : 'מתוזמן'}
                      </Badge>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--v2-gray-400)',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        marginBottom: 14,
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      /v/{v.slug}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: '#ffffff' }}>
                          {v.total.toLocaleString('he-IL')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>נשלחו</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: 'var(--v2-accent)' }}>
                          {v.redeemed.toLocaleString('he-IL')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>מומשו</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: 'var(--v2-primary)' }}>
                          {activeCount.toLocaleString('he-IL')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>פעילים</div>
                      </div>
                    </div>

                    {v.total > 0 && (
                      <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 9999, height: 6, marginBottom: 12 }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 9999,
                            background: 'var(--v2-accent)',
                            width: `${redemptionRate}%`,
                            transition: 'width 1s ease',
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> נוצר {createdLabel}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--v2-primary)' }}>
                        <QrCode size={11} /> QR Code
                      </div>
                    </div>
                  </motion.div>
                )
              })}
        </div>
      )}

      <AnimatePresence>
        {selected && <QRModal validator={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {showSend && sendTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              position: 'relative',
              border: '1px solid var(--glass-border)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => !sendSubmitting && setShowSend(false)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--v2-gray-400)',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>שלח תבנית: {sendTemplate.name}</h3>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, margin: '0 0 20px' }}>כל נמען יקבל כרטיס ייחודי</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>ערוץ שליחה</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['whatsapp', 'sms'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setSendChannel(ch)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: sendChannel === ch ? (ch === 'whatsapp' ? '#22C55E' : '#3B82F6') : 'var(--glass)',
                      color: sendChannel === ch ? '#fff' : 'var(--text)',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {ch === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>קהל יעד</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  { id: 'audience', label: 'קהל שמור' },
                  { id: 'manual', label: 'הזן ידנית' },
                  { id: 'import', label: 'ייבוא קובץ' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSendMode(m.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: sendMode === m.id ? 'var(--primary)' : 'var(--glass)',
                      color: sendMode === m.id ? '#fff' : 'var(--text)',
                      fontSize: 13,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {sendMode === 'audience' && (
                <div>
                  {audiences.length === 0 ? (
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: 8,
                        padding: 16,
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#F59E0B' }}>אין קהלים שמורים עדיין</p>
                      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
                        צור קהל שמור בדף &quot;קהלים&quot; — סגמנט של לקוחות שתרצה לשלוח אליהם
                      </p>
                      <button
                        type="button"
                        onClick={() => window.open('/dashboard/audiences', '_blank')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        עבור לקהלים →
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        maxHeight: 200,
                        overflowY: 'auto',
                      }}
                    >
                      {audiences.map((a) => (
                        <label
                          key={a.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            border: `1px solid ${
                              selectedAudiences.some((sid) => String(sid) === String(a.id))
                                ? 'var(--primary)'
                                : 'var(--glass-border)'
                            }`,
                            background: selectedAudiences.some((sid) => String(sid) === String(a.id))
                              ? 'rgba(0,195,122,0.08)'
                              : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAudiences.some((sid) => String(sid) === String(a.id))}
                            onChange={(e) => {
                              setSelectedAudiences((prev) =>
                                e.target.checked
                                  ? [...prev, a.id]
                                  : prev.filter((id) => String(id) !== String(a.id))
                              )
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{a.name}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--v2-gray-400)' }}>
                              {a.recipient_count || 0} אנשים
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sendMode === 'manual' && (
                <textarea
                  value={manualNumbers}
                  onChange={(e) => setManualNumbers(e.target.value)}
                  placeholder={'הזן מספרי טלפון — כל מספר בשורה נפרדת:\n0501234567\n0521234567'}
                  style={{
                    width: '100%',
                    minHeight: 120,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: 12,
                    fontSize: 13,
                    direction: 'ltr',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {sendMode === 'import' && (
                <div
                  style={{
                    border: '2px dashed var(--glass-border)',
                    borderRadius: 8,
                    padding: 24,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('validator-import-file')?.click()}
                >
                  <input
                    id="validator-import-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const text = await file.text()
                      const numbers = text
                        .split('\n')
                        .map((l) => (l.split(',')[0] || '').trim().replace(/\D/g, ''))
                        .filter((n) => n.length >= 9)
                      setManualNumbers(numbers.join('\n'))
                      setSendMode('manual')
                    }}
                  />
                  <Upload size={24} style={{ color: 'var(--v2-gray-400)', marginBottom: 8 }} />
                  <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, margin: 0 }}>גרור קובץ CSV/Excel או לחץ לבחירה</p>
                </div>
              )}
            </div>

            {recipientCount > 0 && (
              <div
                style={{
                  background: 'rgba(0,195,122,0.1)',
                  border: '1px solid rgba(0,195,122,0.3)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: '#00C37A', fontWeight: 600 }}>
                  ✅ יישלח ל-{recipientCount} נמענים
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                  כל נמען יקבל כרטיס ייחודי עם QR code אישי
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={recipientCount === 0 || sendSubmitting}
              onClick={async () => {
                const numbers = manualNumbers
                  .split('\n')
                  .map((n) => n.trim())
                  .filter((n) => n.replace(/\D/g, '').length >= 9)
                setSendSubmitting(true)
                try {
                  let totalCreated = 0
                  if (sendMode === 'audience') {
                    if (!selectedAudiences.length) {
                      toast.error('בחר לפחות קהל אחד')
                      return
                    }
                    for (const audienceId of selectedAudiences) {
                      const r = await fetchWithAuth(`/api/validator-templates/${sendTemplate.id}/send`, {
                        method: 'POST',
                        body: JSON.stringify({ audience_id: audienceId, channel: sendChannel }),
                        _raw: true,
                      })
                      const d = await r.json().catch(() => ({}))
                      if (!r.ok) {
                        toast.error(d.error || 'שגיאה בשליחה')
                        return
                      }
                      totalCreated += d.created ?? 0
                    }
                  } else {
                    const r = await fetchWithAuth(`/api/validator-templates/${sendTemplate.id}/send`, {
                      method: 'POST',
                      body: JSON.stringify({ phone_numbers: numbers, channel: sendChannel }),
                      _raw: true,
                    })
                    const d = await r.json().catch(() => ({}))
                    if (!r.ok) {
                      toast.error(d.error || 'שגיאה בשליחה')
                      return
                    }
                    totalCreated = d.created ?? 0
                  }
                  setShowSend(false)
                  toast.success(`נשלח ל-${totalCreated} נמענים!`)
                  loadValidators()
                  loadTemplates()
                } finally {
                  setSendSubmitting(false)
                }
              }}
              style={{
                height: 44,
                width: '100%',
                borderRadius: 8,
                border: 'none',
                background: recipientCount > 0 ? '#00C37A' : 'var(--glass)',
                color: recipientCount > 0 ? '#000' : 'var(--v2-gray-400)',
                fontWeight: 700,
                fontSize: 15,
                cursor: recipientCount > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              {recipientCount > 0 ? `שלח ל-${recipientCount} נמענים` : 'בחר קהל לשליחה'}
            </button>
          </div>
        </div>
      )}

      {showEditTemplate && editForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              position: 'relative',
              border: '1px solid var(--glass-border)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => !editSaving && setShowEditTemplate(false)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--v2-gray-400)',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>ערוך תבנית</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="שם התבנית"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                placeholder="תיאור (אופציונלי)"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <CustomSelect
                value={editForm.type}
                onChange={(val) => setEditForm({ ...editForm, type: val })}
                options={[
                  { value: 'event', label: 'אירוע' },
                  { value: 'coupon', label: 'קופון' },
                  { value: 'membership', label: 'חברות' },
                  { value: 'general', label: 'כללי' },
                  { value: 'custom', label: '+ מותאם אישית' },
                ]}
              />
              {editForm.type === 'custom' && (
                <input
                  value={editForm.customType}
                  onChange={(e) => setEditForm({ ...editForm, customType: e.target.value })}
                  placeholder="שם הסוג המותאם (למשל: הנחת עובד)"
                  style={{
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="date"
                  value={editForm.expires_at}
                  onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
                  disabled={editForm.no_expiry}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: editForm.no_expiry ? 'var(--glass)' : 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    opacity: editForm.no_expiry ? 0.5 : 1,
                  }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={editForm.no_expiry}
                    onChange={(e) => setEditForm({ ...editForm, no_expiry: e.target.checked, expires_at: '' })}
                  />
                  ללא תוקף
                </label>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>שיוך</label>
                <CustomSelect
                  value={editForm.binding_type}
                  onChange={(val) => setEditForm({ ...editForm, binding_type: val, binding_id: '' })}
                  options={[
                    { value: 'standalone', label: 'עצמאי — שלח לקהל' },
                    { value: 'event', label: 'קשור לאירוע' },
                    { value: 'campaign', label: 'קשור לקמפיין' },
                    { value: 'webview', label: 'קשור ל-Webview' },
                  ]}
                />
              </div>
              {editForm.binding_type !== 'standalone' && (
                <input
                  placeholder="מזהה שיוך (UUID)"
                  value={editForm.binding_id}
                  onChange={(e) => setEditForm({ ...editForm, binding_id: e.target.value })}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    direction: 'ltr',
                  }}
                />
              )}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>ערוצי שליחה</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['whatsapp', 'sms', 'email'].map((ch) => (
                    <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={editForm.channels?.includes(ch)}
                        onChange={(e) => {
                          const channels = editForm.channels || []
                          setEditForm({
                            ...editForm,
                            channels: e.target.checked ? [...channels, ch] : channels.filter((c) => c !== ch),
                          })
                        }}
                      />
                      {ch === 'whatsapp' ? 'WhatsApp' : ch === 'sms' ? 'SMS' : 'מייל'}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="number"
                  min={0}
                  placeholder="מקס׳ שימושים (ריק = ללא הגבלה)"
                  value={editForm.max_uses ?? ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      max_uses: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  style={{
                    flex: 1,
                    minWidth: 120,
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                  }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editForm.single_use}
                    onChange={(e) => setEditForm({ ...editForm, single_use: e.target.checked })}
                  />
                  שימוש יחיד
                </label>
              </div>
              <button
                type="button"
                disabled={editSaving || !editForm.name}
                onClick={async () => {
                  let expiresAtVal = null
                  if (!editForm.no_expiry && editForm.expires_at && String(editForm.expires_at).trim()) {
                    const d = new Date(`${String(editForm.expires_at).trim()}T23:59:59.999Z`)
                    if (!Number.isNaN(d.getTime())) expiresAtVal = d.toISOString()
                  }
                  const display_config = {
                    title: String(editForm.name).trim(),
                    subtitle: editForm.description ? String(editForm.description).trim() : '',
                  }
                  const redemption_config = {
                    max_uses: editForm.max_uses != null ? editForm.max_uses : null,
                    single_use: editForm.single_use,
                  }
                  const typePayload = editForm.type === 'custom' ? 'custom' : editForm.type
                  const custom_type_name =
                    editForm.type === 'custom' ? (editForm.customType || '').trim() || null : null
                  setEditSaving(true)
                  try {
                    const res = await fetchWithAuth(`/api/validator-templates/${editForm.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({
                        name: editForm.name,
                        type: typePayload,
                        custom_type_name,
                        display_config,
                        channels: editForm.channels?.length ? editForm.channels : ['whatsapp'],
                        max_uses: editForm.max_uses,
                        expires_at: expiresAtVal,
                        binding_type: editForm.binding_type,
                        binding_id: editForm.binding_id || null,
                        redemption_config,
                      }),
                      _raw: true,
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      toast.error(data.error || 'שגיאה בעדכון')
                      return
                    }
                    setShowEditTemplate(false)
                    setEditForm(null)
                    loadTemplates()
                    toast.success('תבנית עודכנה!')
                  } finally {
                    setEditSaving(false)
                  }
                }}
                style={{
                  height: 44,
                  width: '100%',
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                {editSaving ? 'שומר…' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              position: 'relative',
              border: '1px solid var(--glass-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--v2-gray-400)',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>צור תבנית</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="שם התבנית"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                placeholder="תיאור (אופציונלי)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <CustomSelect
                value={form.type}
                onChange={(val) => setForm({ ...form, type: val })}
                options={[
                  { value: 'event', label: 'אירוע' },
                  { value: 'coupon', label: 'קופון' },
                  { value: 'membership', label: 'חברות' },
                  { value: 'general', label: 'כללי' },
                  { value: 'custom', label: '+ מותאם אישית' },
                ]}
              />
              {form.type === 'custom' && (
                <input
                  value={form.customType}
                  onChange={(e) => setForm({ ...form, customType: e.target.value })}
                  placeholder="שם הסוג המותאם (למשל: הנחת עובד)"
                  style={{
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  disabled={form.no_expiry}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: form.no_expiry ? 'var(--glass)' : 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    opacity: form.no_expiry ? 0.5 : 1,
                  }}
                />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.no_expiry}
                    onChange={(e) => setForm({ ...form, no_expiry: e.target.checked, expires_at: '' })}
                  />
                  ללא תוקף
                </label>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>שיוך</label>
                <CustomSelect
                  value={form.binding_type}
                  onChange={(val) => setForm({ ...form, binding_type: val, binding_id: '' })}
                  options={[
                    { value: 'standalone', label: 'עצמאי — שלח לקהל' },
                    { value: 'event', label: 'קשור לאירוע' },
                    { value: 'campaign', label: 'קשור לקמפיין' },
                    { value: 'webview', label: 'קשור ל-Webview' },
                  ]}
                />
              </div>
              {form.binding_type !== 'standalone' && (
                <input
                  placeholder="מזהה שיוך (UUID)"
                  value={form.binding_id}
                  onChange={(e) => setForm({ ...form, binding_id: e.target.value })}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    direction: 'ltr',
                  }}
                />
              )}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>ערוצי שליחה</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['whatsapp', 'sms', 'email'].map((ch) => (
                    <label
                      key={ch}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}
                    >
                      <input
                        type="checkbox"
                        checked={form.channels?.includes(ch)}
                        onChange={(e) => {
                          const channels = form.channels || []
                          setForm({
                            ...form,
                            channels: e.target.checked ? [...channels, ch] : channels.filter((c) => c !== ch),
                          })
                        }}
                      />
                      {ch === 'whatsapp' ? 'WhatsApp' : ch === 'sms' ? 'SMS' : 'מייל'}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="number"
                  min={0}
                  placeholder="מקס׳ שימושים (ריק = ללא הגבלה)"
                  value={form.max_uses ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_uses: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  style={{
                    flex: 1,
                    minWidth: 120,
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                  }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.single_use}
                    onChange={(e) => setForm({ ...form, single_use: e.target.checked })}
                  />
                  שימוש יחיד
                </label>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!form.name) return
                  let expiresAtVal = null
                  if (!form.no_expiry && form.expires_at && String(form.expires_at).trim()) {
                    const d = new Date(`${String(form.expires_at).trim()}T23:59:59.999Z`)
                    if (!Number.isNaN(d.getTime())) expiresAtVal = d.toISOString()
                  }
                  const display_config = {
                    title: String(form.name).trim(),
                    subtitle: form.description ? String(form.description).trim() : '',
                  }
                  const redemption_config = {
                    max_uses: form.max_uses != null ? form.max_uses : null,
                    single_use: form.single_use,
                  }
                  const typePayload = form.type === 'custom' ? 'custom' : form.type
                  const custom_type_name =
                    form.type === 'custom' ? (form.customType || '').trim() || null : null
                  const res = await fetchWithAuth('/api/validator-templates', {
                    method: 'POST',
                    body: JSON.stringify({
                      name: form.name,
                      type: typePayload,
                      custom_type_name,
                      display_config,
                      channels: form.channels?.length ? form.channels : ['whatsapp'],
                      message_templates: {},
                      max_uses: form.max_uses,
                      expires_at: expiresAtVal,
                      binding_type: form.binding_type,
                      binding_id: form.binding_id || null,
                      redemption_config,
                    }),
                    _raw: true,
                  })
                  const data = await res.json().catch(() => ({}))
                  if (res.ok && data.template) {
                    setShowCreate(false)
                    setForm({
                      name: '',
                      description: '',
                      type: 'event',
                      customType: '',
                      expires_at: '',
                      no_expiry: true,
                      binding_type: 'standalone',
                      binding_id: '',
                      channels: ['whatsapp'],
                      max_uses: null,
                      single_use: true,
                    })
                    toast.success('תבנית נוצרה בהצלחה')
                    loadTemplates()
                  } else {
                    toast.error(data.error || 'שגיאה ביצירה')
                  }
                }}
                style={{
                  height: 44,
                  width: '100%',
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                צור תבנית
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
