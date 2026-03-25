import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Copy, MousePointerClick, Users, Eye, KeyRound, Plus, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = (import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app').replace(/\/$/, '')
const PIXEL_EMBED_HOST = (import.meta.env.VITE_PIXEL_SCRIPT_ORIGIN || 'https://api.axess.pro').replace(/\/$/, '')
/** קישור מעקב — בדרך כלל בכתובת ה-API שמריצה את /go */
const GO_DISPLAY_ORIGIN = (import.meta.env.VITE_MAGIC_LINK_ORIGIN || API_BASE).replace(/\/$/, '')

function copyToClipboard(text, msg = 'הועתק') {
  navigator.clipboard.writeText(text).then(() => toast.success(msg)).catch(() => toast.error('העתקה נכשלה'))
}

export default function PixelSettings() {
  const { session, businessId, role } = useAuth()
  const qc = useQueryClient()
  const [businessSlug, setBusinessSlug] = useState('')
  const [magicUrl, setMagicUrl] = useState('')
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerSlug, setNewPartnerSlug] = useState('')

  const authHeaders =
    session?.access_token && businessId
      ? {
          Authorization: `Bearer ${session.access_token}`,
          'X-Business-Id': businessId,
          'Content-Type': 'application/json',
        }
      : null

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
