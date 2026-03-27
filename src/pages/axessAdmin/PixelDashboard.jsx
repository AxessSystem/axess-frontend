import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { Copy, MousePointerClick, Users, Eye, Link2, KeyRound, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.axess.pro').replace(/\/$/, '')
const PIXEL_EMBED_HOST = (import.meta.env.VITE_PIXEL_SCRIPT_ORIGIN || 'https://api.axess.pro').replace(/\/$/, '')

function copyText(text, msg = 'הועתק') {
  navigator.clipboard.writeText(text).then(() => toast.success(msg)).catch(() => toast.error('העתקה נכשלה'))
}

/**
 * דשבורד Axess Admin — בחירת עסק/עירייה וצפייה בנתוני פיקסל ושותפים מכל המערכת.
 * לבעלי עסק יש דף נפרד: /dashboard/pixel (PixelSettings.jsx).
 */
export default function PixelDashboard() {
  const { session } = useAuth()
  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : {}
  const qc = useQueryClient()

  const [selectedBizId, setSelectedBizId] = useState('')
  const [magicUrl, setMagicUrl] = useState('')
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerSlug, setNewPartnerSlug] = useState('')

  const { data: businesses = [] } = useQuery({
    queryKey: ['axess-admin-businesses-pixel'],
    queryFn: () =>
      fetch(`${API_BASE}/api/axess-admin/businesses`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => {
        if (!r.ok) throw new Error('unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const selectedBiz = businesses.find((b) => b.id === selectedBizId)
  const citySlug = (selectedBiz?.portal_slug || '').trim()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['pixel-stats', citySlug, session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/pixel/stats/${encodeURIComponent(citySlug)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => {
        if (!r.ok) throw new Error('stats')
        return r.json()
      }),
    enabled: !!session?.access_token && !!citySlug,
  })

  const { data: partners = [] } = useQuery({
    queryKey: ['pixel-partners', selectedBizId, session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/pixel/partners?business_id=${encodeURIComponent(selectedBizId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => {
        if (!r.ok) throw new Error('partners')
        return r.json()
      }),
    enabled: !!session?.access_token && !!selectedBizId,
  })

  const createPartner = useMutation({
    mutationFn: (body) =>
      fetch(`${API_BASE}/api/pixel/partners`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }).then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.error || 'שגיאה')
        return j
      }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['pixel-partners', selectedBizId] })
      toast.success('נוצר מפתח API — העתק עכשיו, לא יוצג שוב')
      if (row?.api_key) copyText(row.api_key, 'מפתח הועתק ללוח')
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

  const embedSnippet = `<script src="${PIXEL_EMBED_HOST}/pixel.js?city=${citySlug || '[slug]'}"></script>`
  const goBase = `${API_BASE}/go`
  const magicLink =
    citySlug && magicUrl.trim()
      ? `${goBase}?to=${encodeURIComponent(magicUrl.trim())}&city=${encodeURIComponent(citySlug)}`
      : ''

  return (
    <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff' }}>Pixel &amp; Magic Link</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--v2-gray-400)', fontSize: 14 }}>
          מעקב פיקסל לעיריות, יצירת קישורי מעבר ומפתחות Partner API
        </p>
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: 16,
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
        }}
      >
        <label style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>עסק (פורטל עירוני)</label>
        <CustomSelect
          value={selectedBizId}
          onChange={(val) => setSelectedBizId(val)}
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'var(--v2-dark-3)',
            color: '#fff',
            fontSize: 14,
          }}
          placeholder="בחר עסק…"
          options={[
            { value: '', label: 'בחר עסק…' },
            ...businesses.map((b) => ({
              value: b.id,
              label: `${b.name}${b.portal_slug ? ` — ${b.portal_slug}` : ''}`,
            })),
          ]}
        />
        {!citySlug && selectedBizId && (
          <p style={{ margin: '10px 0 0', fontSize: 13, color: '#f59e0b' }}>לעסק זה אין portal_slug — הגדר בשדות העסק לפני שימוש בפיקסל.</p>
        )}
      </div>

      <section
        style={{
          marginBottom: 20,
          padding: 20,
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 17, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={18} /> קוד הטמעה
        </h2>
        <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 12 }}>
          הוסף לפני <code style={{ color: 'var(--v2-primary)' }}>&lt;/body&gt;</code> באתר העירייה:
        </p>
        <pre
          style={{
            margin: 0,
            padding: 14,
            borderRadius: 8,
            background: '#0d1117',
            color: '#e2e8f0',
            fontSize: 12,
            overflowX: 'auto',
            direction: 'ltr',
            textAlign: 'left',
          }}
        >
          {embedSnippet}
        </pre>
        <button
          type="button"
          className="btn btn--secondary"
          style={{ marginTop: 10 }}
          onClick={() => copyText(embedSnippet)}
        >
          <Copy size={14} style={{ marginLeft: 6 }} /> העתק קוד
        </button>
      </section>

      <section
        style={{
          marginBottom: 20,
          padding: 20,
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 17, color: '#fff' }}>סטטיסטיקות 30 יום</h2>
        {!citySlug ? (
          <p style={{ color: 'var(--v2-gray-500)' }}>בחר עסק עם slug פעיל כדי לטעון נתונים.</p>
        ) : statsLoading ? (
          <p style={{ color: 'var(--v2-gray-400)' }}>טוען…</p>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <Kpi icon={Users} label="סשנים ייחודיים" value={totals.unique_sessions} />
              <Kpi icon={Eye} label="צפיות דף" value={totals.pageviews} />
              <Kpi icon={MousePointerClick} label="לחיצות קישור" value={totals.link_clicks} />
              <Kpi icon={Link2} label="תושבים מזוהים" value={totals.identified_residents} />
            </div>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 280 }}>
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
              <p style={{ color: 'var(--v2-gray-500)' }}>אין עדיין אירועי פיקסל בתקופה זו.</p>
            )}
            {statsData?.magicStats?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--v2-gray-300)' }}>Magic links לפי פלטפורמה</div>
                <ul style={{ margin: 0, paddingRight: 20, color: 'var(--v2-gray-400)', fontSize: 13 }}>
                  {statsData.magicStats.map((m) => (
                    <li key={m.platform || '_'}>
                      {(m.platform || 'לא ידוע')}: {m.clicks} לחיצות
                      {m.conversions ? ` · ${m.conversions} המרות` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <section
        style={{
          marginBottom: 20,
          padding: 20,
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 17, color: '#fff' }}>יצירת Magic Link</h2>
        <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 12 }}>
          פורמט: <code style={{ direction: 'ltr', display: 'inline-block' }}>{goBase}?to=…&amp;city=…</code>
        </p>
        <input
          type="url"
          dir="ltr"
          placeholder="https://…"
          value={magicUrl}
          onChange={(e) => setMagicUrl(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 560,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'var(--v2-dark-3)',
            color: '#fff',
            marginBottom: 10,
            boxSizing: 'border-box',
          }}
        />
        {magicLink && (
          <div>
            <pre
              style={{
                margin: '8px 0',
                padding: 12,
                borderRadius: 8,
                background: '#0d1117',
                color: '#7dd3fc',
                fontSize: 12,
                overflowX: 'auto',
                direction: 'ltr',
                textAlign: 'left',
              }}
            >
              {magicLink}
            </pre>
            <button type="button" className="btn btn--secondary" onClick={() => copyText(magicLink)}>
              <Copy size={14} style={{ marginLeft: 6 }} /> העתק קישור
            </button>
          </div>
        )}
      </section>

      <section
        style={{
          padding: 20,
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 17, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyRound size={18} /> Partner API Keys
        </h2>
        {!selectedBizId ? (
          <p style={{ color: 'var(--v2-gray-500)' }}>בחר עסק לניהול מפתחות.</p>
        ) : (
          <>
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
                    business_id: selectedBizId,
                    partner_name: newPartnerName.trim(),
                    partner_slug: newPartnerSlug.trim().replace(/\s+/g, '_'),
                  })
                }
              >
                <Plus size={16} style={{ marginLeft: 6 }} />
                צור API Key חדש
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--v2-gray-500)', marginBottom: 12 }}>
              אימות תושב: <code style={{ direction: 'ltr' }}>GET {API_BASE}/api/partner/verify/:token</code> עם כותרת{' '}
              <code>X-Api-Key</code>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {partners.length === 0 && (
                <p style={{ color: 'var(--v2-gray-500)', margin: 0 }}>אין שותפים עדיין.</p>
              )}
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
                    {new Date(p.created_at).toLocaleString('he-IL')}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        padding: 14,
        background: 'var(--v2-dark-3)',
        borderRadius: 10,
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'rgba(0,195,122,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color="#00C37A" />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{value ?? 0}</div>
        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{label}</div>
      </div>
    </div>
  )
}
