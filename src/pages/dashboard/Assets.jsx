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

const DEMO_WEBVIEW = {
  id: 'demo-webview',
  type: 'webview',
  name: 'דף Webview — קפה רוטשילד',
  status: 'active',
  stats: {
    visits: 342,
    orders: 28,
    revenue: 4680,
  },
  magic_link: 'axess.pro/w/קפה-רוטשילד',
  source_name: 'קפה-רוטשילד',
}

const DEMO_ASSETS = [DEMO_WEBVIEW]

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

  const displayList = assets

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
            {displayList.map((asset, idx) => {
              const meta = typeMeta(asset.type)
              const Icon = meta.icon
              const st = assetStatusBadgeStyle(asset.status)
              const stats = asset.stats && typeof asset.stats === 'object' ? asset.stats : {}
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
                  {(stats.visits != null || stats.orders != null || stats.revenue != null) && (
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
                      {stats.visits != null && (
                        <span>
                          ביקורים: <strong style={{ color: '#fff' }}>{Number(stats.visits).toLocaleString('he-IL')}</strong>
                        </span>
                      )}
                      {stats.orders != null && (
                        <span>
                          הזמנות: <strong style={{ color: '#fff' }}>{Number(stats.orders).toLocaleString('he-IL')}</strong>
                        </span>
                      )}
                      {stats.revenue != null && (
                        <span>
                          הכנסות: <strong style={{ color: '#fff' }}>₪{Number(stats.revenue).toLocaleString('he-IL')}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
