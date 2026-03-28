import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import CustomSelect from '@/components/ui/CustomSelect'
import {
  Copy,
  MousePointerClick,
  Users,
  Eye,
  KeyRound,
  Plus,
  TrendingUp,
  Search,
  Share2,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.axess.pro').replace(/\/$/, '')
const PIXEL_EMBED_HOST = (import.meta.env.VITE_PIXEL_SCRIPT_ORIGIN || 'https://api.axess.pro').replace(/\/$/, '')
/** קישור מעקב — בדרך כלל בכתובת ה-API שמריצה את /go */
const GO_DISPLAY_ORIGIN = (import.meta.env.VITE_MAGIC_LINK_ORIGIN || API_BASE).replace(/\/$/, '')
/** דף Auth Connect ציבורי */
const AUTH_SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN || 'https://axess.pro').replace(/\/$/, '')

const LINK_COLORS = {
  event: '#3B82F6',
  portal: '#8B5CF6',
  webview: '#F59E0B',
  magic: '#00C37A',
  auth: '#EC4899',
  validator: '#F97316',
  campaign: '#06B6D4',
  custom: '#6B7280',
}

const LINK_TYPE_LABELS = {
  event: 'אירוע',
  portal: 'פורטל',
  webview: 'Webview',
  magic: 'Magic Link',
  auth: 'Auth Connect',
  validator: 'Validator',
  campaign: 'קמפיין',
  custom: 'מותאם',
}

function copyToClipboard(text, msg = 'הועתק') {
  navigator.clipboard.writeText(text).then(() => toast.success(msg)).catch(() => toast.error('העתקה נכשלה'))
}

export default function PixelSettings() {
  const { session, businessId, role } = useAuth()
  const qc = useQueryClient()
  const [businessSlug, setBusinessSlug] = useState('')
  const [magicUrl, setMagicUrl] = useState('')
  const [authReturnUrl, setAuthReturnUrl] = useState('')
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerSlug, setNewPartnerSlug] = useState('')
  const [activeTab, setActiveTab] = useState('pixel')
  const [links, setLinks] = useState([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linkFilter, setLinkFilter] = useState('all')
  const [linkSearch, setLinkSearch] = useState('')
  const [showAddLink, setShowAddLink] = useState(false)
  const [newLink, setNewLink] = useState({ name: '', url: '', type: 'custom' })

  const authHeaders =
    session?.access_token && businessId
      ? {
          Authorization: `Bearer ${session.access_token}`,
          'X-Business-Id': businessId,
          'Content-Type': 'application/json',
        }
      : null

  const fetchWithAuth = useCallback(
    (url, options = {}) =>
      fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'X-Business-Id': businessId,
          ...(options.headers || {}),
        },
      }),
    [session?.access_token, businessId]
  )

  useEffect(() => {
    if (activeTab !== 'mylinks') return
    setLinksLoading(true)
    fetchWithAuth(`${API_BASE}/api/pixel/my-links`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links || []))
      .finally(() => setLinksLoading(false))
  }, [activeTab, businessId, fetchWithAuth])

  useEffect(() => {
    if (!businessId) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('businesses').select('portal_slug').eq('id', businessId).maybeSingle()
      if (cancelled) return
      if (!error && data?.portal_slug) setBusinessSlug(String(data.portal_slug).trim())
      else setBusinessSlug('')
    })()
    return () => { cancelled = true }
  }, [businessId])

  const citySlug = businessSlug

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['pixel-stats-business', citySlug, businessId, session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/pixel/stats/${encodeURIComponent(citySlug)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'X-Business-Id': businessId,
        },
      }).then((r) => {
        if (!r.ok) throw new Error('stats')
        return r.json()
      }),
    enabled: !!session?.access_token && !!businessId && !!citySlug,
  })

  const canManagePartners = role === 'owner'

  const { data: partners = [] } = useQuery({
    queryKey: ['pixel-partners-business', businessId, session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/pixel/partners`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'X-Business-Id': businessId,
        },
      }).then((r) => {
        if (!r.ok) throw new Error('partners')
        return r.json()
      }),
    enabled: !!session?.access_token && !!businessId && canManagePartners,
  })

  const createPartner = useMutation({
    mutationFn: (body) =>
      fetch(`${API_BASE}/api/pixel/partners`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      }).then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.error || 'שגיאה')
        return j
      }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['pixel-partners-business', businessId] })
      toast.success('נוצר מפתח API — העתק עכשיו, לא יוצג שוב')
      if (row?.api_key) copyToClipboard(row.api_key, 'מפתח הועתק ללוח')
      setNewPartnerName('')
      setNewPartnerSlug('')
    },
    onError: (e) => toast.error(e.message || 'שגיאה'),
  })

  const totals = statsData?.totals || {}
  const dailyRaw = statsData?.stats || []
  const chartData = [...dailyRaw]
    .reverse()
    .map((r) => ({
      day: r.day ? new Date(r.day).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '',
      pageviews: Number(r.pageviews) || 0,
      link_clicks: Number(r.link_clicks) || 0,
    }))

  const magicLink =
    citySlug && magicUrl.trim()
      ? `${GO_DISPLAY_ORIGIN}/go?to=${encodeURIComponent(magicUrl.trim())}&city=${encodeURIComponent(citySlug)}`
      : ''

  const filteredLinks = links.filter((l) => {
    const matchType = linkFilter === 'all' || l.type === linkFilter
    const matchSearch =
      !linkSearch ||
      l.name?.toLowerCase().includes(linkSearch.toLowerCase()) ||
      l.url?.toLowerCase().includes(linkSearch.toLowerCase())
    return matchType && matchSearch
  })

  if (!businessId) {
    return (
      <div dir="rtl" style={{ padding: 24, color: 'var(--v2-gray-400)' }}>
        אין הקשר עסק — התחבר מחדש.
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px 40px' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#fff' }}>Pixel &amp; לינקים</h1>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--v2-gray-400)' }}>
        מעקב באתר העירייה/הארגון, קישורי מעבר לאירועים ומפתחות לשותפים
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'pixel', label: 'Pixel & כלים' },
          { id: 'mylinks', label: 'הלינקים שלי' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'var(--glass)',
              color: activeTab === tab.id ? '#fff' : 'var(--text)',
              fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pixel' && (
        <>
      {/* 1 — קוד הטמעה */}
      <div style={{ background: 'var(--card, var(--v2-dark-2))', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--glass-border)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#fff' }}>קוד הטמעה לאתר שלך</h3>
        <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', margin: 0 }}>
          הוסף שורה אחת לאתר שלך — תתחיל לאסוף דאטה מיד
        </p>
        {!citySlug && (
          <p style={{ fontSize: 13, color: '#f59e0b', marginTop: 12 }}>
            הגדר <strong>portal slug</strong> לעסק (מחלקות / פורטל) כדי שהפיקסל יזהה את העירייה.
          </p>
        )}
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: 8,
            padding: 12,
            fontFamily: 'monospace, Consolas, monospace',
            fontSize: 13,
            color: '#00C37A',
            marginTop: 12,
            direction: 'ltr',
            textAlign: 'left',
            overflowX: 'auto',
          }}
        >
          {`<script src="https://api.axess.pro/pixel.js?city=${citySlug || '[slug]'}"></script>`}
        </div>
        <button
          type="button"
          className="btn btn--primary"
          style={{ marginTop: 12 }}
          onClick={() =>
            copyToClipboard(
              `<script src="${PIXEL_EMBED_HOST}/pixel.js?city=${citySlug || ''}"></script>`,
              'הועתק'
            )
          }
        >
          העתק קוד
        </button>
      </div>

      {/* 2 — סטטיסטיקות */}
      <div style={{ background: 'var(--card, var(--v2-dark-2))', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--glass-border)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 17, color: '#fff' }}>סטטיסטיקות (30 יום)</h3>
        {!citySlug ? (
          <p style={{ color: 'var(--v2-gray-500)', margin: 0 }}>אין slug פעיל — לא ניתן לטעון סטטיסטיקות.</p>
        ) : statsLoading ? (
          <p style={{ color: 'var(--v2-gray-400)' }}>טועន…</p>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <MiniKpi icon={Users} label="ביקורים ייחודיים" value={totals.unique_sessions} />
              <MiniKpi icon={MousePointerClick} label="לחיצות על לינקים" value={totals.link_clicks} />
              <MiniKpi icon={Eye} label="צפיות דף" value={totals.pageviews} />
              <MiniKpi icon={Users} label="משתמשים מזוהים" value={totals.identified_residents} />
              <MiniKpi icon={TrendingUp} label="המרות (מג׳יק)" value={totals.conversions} />
            </div>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="pageviews" name="צפיות" fill="#00C37A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="link_clicks" name="לחיצות" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: 'var(--v2-gray-500)', margin: 0 }}>אין עדיין נתוני פיקסל בתקופה זו.</p>
            )}
          </>
        )}
      </div>

      {/* 3 — Magic Link */}
      <div style={{ background: 'var(--card, var(--v2-dark-2))', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--glass-border)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#fff' }}>יצירת Magic Link</h3>
        <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 12 }}>
          הזן כתובת יעד חיצונית — הקישור המומלץ:{' '}
          <code style={{ direction: 'ltr' }}>{GO_DISPLAY_ORIGIN}/go?to=…&amp;city=…</code>
        </p>
        <input
          type="url"
          dir="ltr"
          placeholder="https://…"
          value={magicUrl}
          onChange={(e) => setMagicUrl(e.target.value)}
          disabled={!citySlug}
          style={{
            width: '100%',
            maxWidth: 520,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'var(--v2-dark-3)',
            color: '#fff',
            marginBottom: 10,
            boxSizing: 'border-box',
          }}
        />
        {!citySlug && (
          <p style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>נדרש portal slug לעסק.</p>
        )}
        {magicLink && (
          <div>
            <div
              style={{
                background: '#1a1a2e',
                borderRadius: 8,
                padding: 12,
                fontSize: 12,
                color: '#7dd3fc',
                direction: 'ltr',
                textAlign: 'left',
                overflowX: 'auto',
                wordBreak: 'break-all',
              }}
            >
              {magicLink}
            </div>
            <button type="button" className="btn btn--secondary" style={{ marginTop: 10 }} onClick={() => copyToClipboard(magicLink)}>
              <Copy size={14} style={{ marginLeft: 6 }} /> העתק קישור
            </button>
          </div>
        )}
      </div>

      {/* 3b — התחבר עם AXESS */}
      <div
        style={{
          background: 'var(--card, var(--v2-dark-2))',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          marginTop: 16,
          border: '1px solid var(--glass-border)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#fff' }}>🔗 התחבר עם AXESS</h3>
        <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 16 }}>
          אפשר לתושבים/לקוחות להזדהות פעם אחת ולהיזכר בכל אתר שותף אוטומטית.
        </p>

        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--v2-gray-300)' }}>
          כפתור להטמעה באתר שלך:
        </label>
        <div
          style={{
            background: '#1a1d21',
            borderRadius: 8,
            padding: 12,
            fontFamily: 'monospace, Consolas, monospace',
            fontSize: 12,
            color: '#00C37A',
            marginBottom: 12,
            direction: 'ltr',
            overflowX: 'auto',
            textAlign: 'left',
          }}
        >
          {`<a href="${AUTH_SITE_ORIGIN}/auth?city=${citySlug || '[slug]'}&return=YOUR_URL">\n  <img src="${AUTH_SITE_ORIGIN}/btn-connect.svg" alt="התחבר עם AXESS" />\n</a>`}
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() =>
            copyToClipboard(
              `<a href="${AUTH_SITE_ORIGIN}/auth?city=${citySlug || ''}&return=YOUR_URL">\n  <img src="${AUTH_SITE_ORIGIN}/btn-connect.svg" alt="התחבר עם AXESS" />\n</a>`,
              'הועתק'
            )
          }
        >
          📋 העתק קוד
        </button>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--v2-gray-300)' }}>
            תצוגה מקדימה (כהה / בהיר):
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <a
              href={`${AUTH_SITE_ORIGIN}/auth?city=${encodeURIComponent(citySlug || '')}&return=https://example.com`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#0a1628',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontFamily: 'Heebo, sans-serif',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              <span style={{ color: '#00C37A', fontSize: 18, fontWeight: 900 }}>A</span>
              התחבר עם AXESS
            </a>
            <a
              href={`${AUTH_SITE_ORIGIN}/auth?city=${encodeURIComponent(citySlug || '')}&return=https://example.com`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#fff',
                color: '#0a1628',
                border: '2px solid #0a1628',
                borderRadius: 8,
                textDecoration: 'none',
                fontFamily: 'Heebo, sans-serif',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              <span style={{ color: '#00C37A', fontSize: 18, fontWeight: 900 }}>A</span>
              התחבר עם AXESS
            </a>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--v2-gray-300)' }}>
            צור לינק זיהוי לקמפיין:
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              dir="ltr"
              value={authReturnUrl}
              onChange={(e) => setAuthReturnUrl(e.target.value)}
              placeholder="https://example.com/checkout"
              style={{
                flex: 1,
                minWidth: 200,
                height: 36,
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg, var(--v2-dark-3))',
                color: 'var(--text, #fff)',
                padding: '0 12px',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              disabled={!authReturnUrl.trim()}
              onClick={() => {
                const link = `${AUTH_SITE_ORIGIN}/auth?city=${encodeURIComponent(citySlug || '')}&return=${encodeURIComponent(authReturnUrl.trim())}`
                copyToClipboard(link, 'הלינק הועתק')
              }}
              style={{
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: !authReturnUrl.trim() ? '#555' : '#00C37A',
                color: '#000',
                fontWeight: 700,
                cursor: !authReturnUrl.trim() ? 'not-allowed' : 'pointer',
                fontSize: 13,
                height: 36,
              }}
            >
              צור לינק
            </button>
          </div>
        </div>
      </div>

      {/* 4 — Partner API (בעל עסק) */}
      {canManagePartners ? (
        <div style={{ background: 'var(--card, var(--v2-dark-2))', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 17, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={18} /> Partner API — אימות משתמש
          </h3>
          <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 12 }}>
            צור API Key עבור פלטפורמות חיצוניות (אתרי כרטיסים, מערכות הרשמה){' '}
            שיאפשר להן לזהות משתמשים אוטומטית דרך AXESS —{' '}
            ללא מילוי פרטים חוזר.
          </p>
          <p style={{ fontSize: 12, color: 'var(--v2-gray-500)', marginBottom: 12 }}>
            אימות משתמש: <code style={{ direction: 'ltr' }}>GET {API_BASE}/api/partner/verify/:token</code> · כותרת{' '}
            <code>X-Api-Key</code>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-500)', marginBottom: 4 }}>שם שותף</label>
              <input
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  color: '#fff',
                  width: 180,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-500)', marginBottom: 4 }}>מזהה (slug)</label>
              <input
                value={newPartnerSlug}
                onChange={(e) => setNewPartnerSlug(e.target.value)}
                placeholder="eventbrite"
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  color: '#fff',
                  width: 160,
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!newPartnerName.trim() || !newPartnerSlug.trim() || createPartner.isPending}
              onClick={() =>
                createPartner.mutate({
                  business_id: businessId,
                  partner_name: newPartnerName.trim(),
                  partner_slug: newPartnerSlug.trim().replace(/\s+/g, '_'),
                })
              }
            >
              <Plus size={16} style={{ marginLeft: 6 }} />
              צור API Key חדש
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {partners.length === 0 && <p style={{ color: 'var(--v2-gray-500)', margin: 0 }}>אין שותפים עדיין.</p>}
            {partners.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>{p.partner_name}</strong>
                  <span style={{ color: 'var(--v2-gray-500)', fontSize: 13, marginRight: 8 }}>({p.partner_slug})</span>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>
                    מפתח: {p.api_key_preview} · {p.is_active ? 'פעיל' : 'לא פעיל'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--v2-gray-500)' }}>
                  {p.created_at ? new Date(p.created_at).toLocaleString('he-IL') : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--card, var(--v2-dark-2))', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--v2-gray-400)' }}>
            ניהול מפתחות Partner API זמין לבעל העסק בלבד.
          </p>
        </div>
      )}
        </>
      )}

      {activeTab === 'mylinks' && (
        <div style={{ background: 'var(--card, var(--v2-dark-2))', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>הלינקים שלי</h3>
            <button
              type="button"
              onClick={() => setShowAddLink(true)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#00C37A',
                color: '#000',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} /> הוסף לינק
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
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
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                placeholder="חיפוש לינק..."
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
            <CustomSelect
              value={linkFilter}
              onChange={setLinkFilter}
              options={[
                { value: 'all', label: 'כל הסוגים' },
                { value: 'event', label: 'אירועים' },
                { value: 'portal', label: 'פורטל' },
                { value: 'webview', label: 'Webview' },
                { value: 'magic', label: 'Magic Links' },
                { value: 'auth', label: 'Auth Connect' },
                { value: 'validator', label: 'Validators' },
                { value: 'custom', label: 'מותאם' },
              ]}
              style={{ width: 160 }}
            />
          </div>

          {linksLoading ? (
            <p style={{ color: 'var(--v2-gray-400)', textAlign: 'center', padding: 24 }}>טוען...</p>
          ) : filteredLinks.length === 0 ? (
            <p style={{ color: 'var(--v2-gray-400)', textAlign: 'center', padding: 24 }}>אין לינקים</p>
          ) : (
            <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
              {filteredLinks.map((link, idx) => (
                <div
                  key={link.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: idx < filteredLinks.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--glass)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${LINK_COLORS[link.type] || '#6B7280'}22`,
                      color: LINK_COLORS[link.type] || '#6B7280',
                      border: `1px solid ${(LINK_COLORS[link.type] || '#6B7280')}44`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {LINK_TYPE_LABELS[link.type] || link.type}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {link.name}
                    </p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#00C37A',
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {link.url}
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {[
                      {
                        icon: <Copy size={14} />,
                        title: 'העתק',
                        onClick: () => {
                          navigator.clipboard.writeText(link.url)
                          toast.success('הועתק!')
                        },
                      },
                      {
                        icon: <Share2 size={14} />,
                        title: 'שתף',
                        onClick: () =>
                          navigator.share
                            ? navigator.share({ title: link.name, url: link.url })
                            : navigator.clipboard.writeText(link.url),
                      },
                    ].map((btn) => (
                      <button
                        key={btn.title}
                        type="button"
                        onClick={btn.onClick}
                        title={btn.title}
                        style={{
                          background: 'var(--glass)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 8,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          color: 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {btn.icon}
                      </button>
                    ))}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 8,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                      }}
                      title="פתח"
                    >
                      <ExternalLink size={14} />
                    </a>
                    {link.type === 'custom' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const id = link.id.replace('custom_', '')
                          await fetchWithAuth(`${API_BASE}/api/pixel/my-links/${id}`, { method: 'DELETE' })
                          setLinks((prev) => prev.filter((l) => l.id !== link.id))
                          toast.success('נמחק')
                        }}
                        title="מחק"
                        style={{
                          background: 'var(--glass)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 8,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          color: '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddLink && (
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
                  background: 'var(--card, var(--v2-dark-2, #1a1d2e))',
                  borderRadius: 12,
                  padding: 24,
                  width: '100%',
                  maxWidth: 440,
                  position: 'relative',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddLink(false)}
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
                <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#fff' }}>הוסף לינק</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    value={newLink.name}
                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    placeholder="שם הלינק"
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
                  <input
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://..."
                    style={{
                      height: 40,
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: 14,
                      direction: 'ltr',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                  <CustomSelect
                    value={newLink.type}
                    onChange={(val) => setNewLink({ ...newLink, type: val })}
                    options={Object.entries(LINK_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newLink.name || !newLink.url) return
                      await fetchWithAuth(`${API_BASE}/api/pixel/my-links`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newLink),
                      })
                      setShowAddLink(false)
                      setNewLink({ name: '', url: '', type: 'custom' })
                      const d = await fetchWithAuth(`${API_BASE}/api/pixel/my-links`).then((r) => r.json())
                      setLinks(d.links || [])
                      toast.success('לינק נוסף!')
                    }}
                    style={{
                      height: 44,
                      borderRadius: 8,
                      border: 'none',
                      background: '#00C37A',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    שמור לינק
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniKpi({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--v2-dark-3)',
        borderRadius: 10,
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Icon size={18} style={{ color: '#00C37A', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{value ?? 0}</div>
        <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', lineHeight: 1.3 }}>{label}</div>
      </div>
    </div>
  )
}
