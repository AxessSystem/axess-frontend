import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Globe,
  MessageCircle,
  Calendar,
  QrCode,
  Ticket,
  Layers,
  Send,
  Pencil,
  Copy,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchWithAuth, supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid var(--glass-border)',
  borderRadius: 12,
  padding: 20,
}

const ASSET_TYPES = [
  { type: 'sms_campaign', label: 'קמפיין SMS', icon: Send, color: '#00C37A' },
  { type: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { type: 'webview', label: 'Webview', icon: Globe, color: '#8B5CF6' },
  { type: 'event', label: 'אירוע', icon: Calendar, color: '#38BDF8' },
  { type: 'validator', label: 'Validator', icon: QrCode, color: '#F97316' },
  { type: 'coupon', label: 'קופון', icon: Ticket, color: '#EC4899' },
  { type: 'combined', label: 'משולב', icon: Layers, color: '#A78BFA' },
]

const DEMO_ASSETS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    type: 'combined',
    name: 'נכס משולב — דוגמה',
    status: 'active',
    stats: { sms_sent: 420, wa_replies: 88, webview_visits: 1200 },
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    type: 'webview',
    name: 'דף Webview — קפה רוטשילד',
    status: 'active',
    stats: { visits: 342, orders: 28, revenue: 4680 },
    magic_link: 'axess.pro/w/קפה-רוטשילד',
    source_name: 'קפה-רוטשילד',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    type: 'sms_campaign',
    name: 'קמפיין SMS — דוגמה',
    status: 'active',
    stats: { sent: 850, opened: 620, clicked: 180 },
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    type: 'event',
    name: 'אירוע — דוגמה',
    status: 'active',
    stats: { tickets_sold: 145, revenue: 12500 },
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    type: 'validator',
    name: 'כרטיס כניסה — דוגמה',
    status: 'active',
    stats: { scanned: 98, total: 145 },
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    type: 'whatsapp',
    name: 'קמפיין WA — דוגמה',
    status: 'active',
    stats: { sent: 320, delivered: 298, replied: 45 },
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    type: 'scan_station',
    name: 'עמדת סריקה — דוגמה',
    status: 'active',
    stats: { scanned_today: 34, total_scanned: 892 },
  },
]

const DEMO_ASSET_IDS = new Set(DEMO_ASSETS.map((a) => a.id))

const STAT_LABELS = {
  visits: 'ביקורים',
  orders: 'הזמנות',
  revenue: 'הכנסות',
  sent: 'נשלחו',
  opened: 'נפתחו',
  clicked: 'קליקים',
  tickets_sold: 'כרטיסים',
  scanned: 'נסרקו',
  total: 'סה״כ',
  delivered: 'נמסרו',
  replied: 'השיבו',
  scanned_today: 'סריקות היום',
  total_scanned: 'סה״כ סריקות',
  sms_sent: 'SMS נשלחו',
  wa_replies: 'תשובות WA',
  webview_visits: 'ביקורי Webview',
}

function formatStatValue(key, value) {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  if (key === 'revenue') return `₪${n.toLocaleString('he-IL')}`
  return n.toLocaleString('he-IL')
}

function typeMeta(t) {
  return ASSET_TYPES.find((x) => x.type === t) || {
    type: t,
    label: t,
    icon: Layers,
    color: 'var(--v2-gray-400)',
  }
}

function assetStatusBadgeStyle(status) {
  const s = String(status || 'draft').toLowerCase()
  if (s === 'active') return { bg: 'rgba(34,197,94,0.2)', color: '#4ade80', label: 'פעיל' }
  if (s === 'paused') return { bg: 'rgba(234,179,8,0.2)', color: '#fbbf24', label: 'מושהה' }
  if (s === 'completed') return { bg: 'rgba(56,189,248,0.2)', color: '#38bdf8', label: 'הושלם' }
  if (s === 'archived') return { bg: 'rgba(148,163,184,0.2)', color: '#94a3b8', label: 'בארכיון' }
  return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'טיוטה' }
}

export default function Assets() {
  const { session, businessId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState([])
  const [activeType, setActiveType] = useState(null)

  const onUnauthorized = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [])

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      'X-Business-Id': businessId,
    }),
    [session?.access_token, businessId],
  )

  const load = useCallback(async () => {
    if (!businessId || !session?.access_token) {
      setLoading(false)
      setAssets(DEMO_ASSETS)
      return
    }
    setLoading(true)
    try {
      const r = await fetchWithAuth(`${API_BASE}/api/assets`, { headers: authHeaders() }, session, onUnauthorized)
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה בטעינה')
      const list = Array.isArray(data.assets) ? data.assets : []
      if (list.length === 0) {
        setAssets(DEMO_ASSETS)
      } else {
        setAssets(list)
      }
    } catch (e) {
      toast.error(e.message || 'שגיאה')
      setAssets(DEMO_ASSETS)
    } finally {
      setLoading(false)
    }
  }, [businessId, session, authHeaders, onUnauthorized])

  useEffect(() => {
    load()
  }, [load])

  const displayAssets = assets
  const filteredAssets = activeType ? displayAssets.filter((a) => a.type === activeType) : displayAssets

  return (
    <div dir="rtl" style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: '#ffffff',
            marginBottom: 8,
          }}
        >
          הנכסים שלי
        </h1>
        <p style={{ color: 'var(--v2-gray-400)', marginBottom: 8, fontSize: 14 }}>
          ניהול מרכזי לקמפיינים, Webview, אירועים ועוד
        </p>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '8px 0',
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveType(null)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: '1px solid var(--glass-border)',
              background: activeType === null ? 'var(--primary)' : 'var(--card)',
              color: activeType === null ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: 13,
            }}
          >
            הכל
          </button>
          {ASSET_TYPES.map((t) => {
            const TypeIcon = t.icon
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => setActiveType(activeType === t.type ? null : t.type)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: `1px solid ${activeType === t.type ? t.color : 'var(--glass-border)'}`,
                  background: activeType === t.type ? `${t.color}33` : 'var(--card)',
                  color: activeType === t.type ? t.color : 'var(--text)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <TypeIcon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>
        {loading ? (
          <div style={{ ...cardStyle, color: 'var(--v2-gray-400)' }}>טוען נכסים…</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {filteredAssets.map((asset, idx) => {
              const meta = typeMeta(asset.type)
              const Icon = meta.icon
              const st = assetStatusBadgeStyle(asset.status)
              const stats = asset.stats && typeof asset.stats === 'object' ? asset.stats : {}
              const isDemo = DEMO_ASSET_IDS.has(asset.id)
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    ...cardStyle,
                    cursor: 'default',
                    transition: 'border-color 0.2s ease, opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--v2-primary)'
                    e.currentTarget.style.opacity = 1
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.opacity = ''
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `${meta.color}22`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${meta.color}44`,
                        }}
                      >
                        <Icon size={20} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, lineHeight: 1.3 }}>{asset.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{meta.label}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        background: st.bg,
                        color: st.color,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                  {(asset.source_name || asset.magic_link) && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--v2-gray-400)',
                        marginBottom: 10,
                        wordBreak: 'break-word',
                      }}
                    >
                      {asset.source_name && <span>מקור: {asset.source_name}</span>}
                      {asset.magic_link && (
                        <div dir="ltr" style={{ textAlign: 'left', marginTop: 4, opacity: 0.9 }}>
                          {asset.magic_link}
                        </div>
                      )}
                    </div>
                  )}
                  {Object.keys(stats).length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        paddingTop: 12,
                        borderTop: '1px solid var(--glass-border)',
                        fontSize: 12,
                        color: 'var(--v2-gray-400)',
                      }}
                    >
                      {Object.entries(stats).map(([k, v]) => (
                        <span key={k}>
                          {STAT_LABELS[k] || k}:{' '}
                          <strong style={{ color: '#fff' }}>{formatStatValue(k, v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--glass-border)',
                    }}
                  >
                    <button
                      type="button"
                      disabled={isDemo}
                      title={isDemo ? 'זוהי דוגמה' : undefined}
                      style={{
                        ...demoActionBtnStyle,
                        opacity: isDemo ? 0.45 : 1,
                        cursor: isDemo ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={isDemo}
                      title={isDemo ? 'זוהי דוגמה' : undefined}
                      style={{
                        ...demoActionBtnStyle,
                        opacity: isDemo ? 0.45 : 1,
                        cursor: isDemo ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}

const demoActionBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--glass-border)',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--v2-gray-300)',
}
