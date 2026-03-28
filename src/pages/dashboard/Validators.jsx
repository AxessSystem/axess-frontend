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
  LayoutGrid,
  CircleDot,
  Ban,
  Plus,
  Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const TYPE_CONFIG = {
  event: { icon: <Ticket size={18} />, color: '#3B82F6', label: 'אירוע' },
  coupon: { icon: <Tag size={18} />, color: '#00C37A', label: 'קופון' },
  membership: { icon: <Users size={18} />, color: '#8B5CF6', label: 'חברות' },
  general: { icon: <Star size={18} />, color: '#F59E0B', label: 'כללי' },
  ticket: { icon: <Ticket size={18} />, color: '#3B82F6', label: 'כרטיס' },
  benefit: { icon: <Star size={18} />, color: '#EC4899', label: 'הטבה' },
  confirm: { icon: <Star size={18} />, color: '#F59E0B', label: 'כללי' },
}

const FILTER_TABS_META = [
  { value: 'all', label: 'הכל', Icon: LayoutGrid },
  { value: 'active', label: 'פעיל', Icon: CircleDot },
  { value: 'redeemed', label: 'מומש', Icon: CheckCircle },
  { value: 'expired', label: 'פג תוקף', Icon: Ban },
]

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
  const { session, businessId } = useAuth()
  const [validators, setValidators] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'event',
    expires_at: '',
    no_expiry: true,
  })

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      'X-Business-Id': businessId,
    }),
    [session, businessId]
  )

  const loadValidators = useCallback(() => {
    if (!businessId || !session?.access_token) {
      setValidators([])
      setListLoading(false)
      return
    }
    setListLoading(true)
    fetch(`${API_BASE.replace(/\/$/, '')}/api/validators?business_id=${encodeURIComponent(businessId)}`, {
      headers: authHeaders(),
    })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ validators: [] })))
      .then((d) => setValidators(d.validators || []))
      .catch(() => setValidators([]))
      .finally(() => setListLoading(false))
  }, [businessId, session?.access_token, authHeaders])

  useEffect(() => {
    loadValidators()
  }, [loadValidators])

  useEffect(() => {
    if (!showCreate || slugEdited || !form.name) return
    const auto = form.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 30)
    setCustomSlug(auto || '')
  }, [form.name, slugEdited, showCreate])

  useEffect(() => {
    if (!showCreate) {
      setCustomSlug('')
      setSlugEdited(false)
    }
  }, [showCreate])

  const filtered = validators.filter((v) => {
    const matchTab = filter === 'all' || v.status === filter
    const matchType = typeFilter === 'all' || v.type === typeFilter
    const matchSearch = !search || v.title?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchType && matchSearch
  })

  const filterCounts = {
    all: validators.length,
    active: validators.filter((v) => v.status === 'active').length,
    redeemed: validators.filter((v) => v.status === 'redeemed').length,
    expired: validators.filter((v) => v.status === 'expired').length,
  }

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 4,
          flexWrap: 'wrap',
        }}
      >
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
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Validators</h1>
          <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', margin: 0 }}>ניהול כרטיסי אימות וסריקה לאירועים</p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 16,
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        {FILTER_TABS_META.map((tab) => {
          const Icon = tab.Icon
          const isActive = filter === tab.value
          const count = filterCounts[tab.value]
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                border: `1px solid ${isActive ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
                background: isActive ? 'rgba(0,195,122,0.12)' : 'transparent',
                color: isActive ? '#fff' : 'var(--v2-gray-400)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <Icon size={18} />
              {tab.label}
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 9999,
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: 'כל הסוגים' },
            { value: 'event', label: 'אירוע' },
            { value: 'coupon', label: 'קופון' },
            { value: 'membership', label: 'חברות' },
            { value: 'general', label: 'כללי' },
          ]}
          style={{ width: 140 }}
        />
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
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

      {listLoading ? (
        <p style={{ color: 'var(--v2-gray-400)', textAlign: 'center', padding: 24 }}>טוען…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🎫" title="אין Validators" description="צור Validator חדש כדי לראות אותם כאן" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((v, i) => {
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
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>צור Validator חדש</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="שם ה-Validator"
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
                  { value: 'event', label: 'כניסה לאירוע' },
                  { value: 'coupon', label: 'קופון' },
                  { value: 'membership', label: 'חברות' },
                  { value: 'general', label: 'כללי' },
                ]}
              />
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
              <div style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4, display: 'block' }}>לינק מעקב</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    border: '1px solid var(--glass-border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      padding: '0 10px',
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--glass)',
                      color: 'var(--v2-gray-400)',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      borderLeft: '1px solid var(--glass-border)',
                    }}
                  >
                    axess.pro/v/
                  </span>
                  <input
                    value={customSlug}
                    onChange={(e) => {
                      setCustomSlug(e.target.value)
                      setSlugEdited(true)
                    }}
                    placeholder="my-validator"
                    style={{
                      flex: 1,
                      height: 40,
                      border: 'none',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: 14,
                      outline: 'none',
                      direction: 'ltr',
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--v2-gray-400)', margin: '4px 0 0' }}>
                  axess.pro/v/{customSlug || '...'} ← לינק מעקב ייחודי
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!form.name) return
                  const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/validators`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ ...form, slug: customSlug || undefined, business_id: businessId }),
                  })
                  const data = await res.json().catch(() => ({}))
                  if (res.ok && data.validator) {
                    const validatorUrl = data.validator_url || `https://axess.pro/v/${data.validator.slug}`
                    setShowCreate(false)
                    setForm({
                      name: '',
                      description: '',
                      type: 'event',
                      expires_at: '',
                      no_expiry: true,
                    })
                    toast.success(`Validator נוצר — ${validatorUrl}`)
                    loadValidators()
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
                צור Validator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
