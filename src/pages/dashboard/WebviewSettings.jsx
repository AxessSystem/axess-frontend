import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Palette, Package, Settings2, Link2, Save, Pencil, Trash2, Plus, ChevronUp, ChevronDown,
  Copy, ExternalLink, Download,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchWithAuth, supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'
const PUBLIC_WEBVIEW_ORIGIN = 'https://axess.pro'

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid var(--glass-border)',
  borderRadius: 12,
  padding: 24,
}

const sectionH2 = {
  fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
  fontWeight: 700,
  fontSize: 17,
  color: '#ffffff',
  marginBottom: 16,
}

const TABS = [
  { id: 'design', label: 'עיצוב', icon: Palette },
  { id: 'items', label: 'פריטים', icon: Package },
  { id: 'settings', label: 'הגדרות', icon: Settings2 },
  { id: 'links', label: 'לינקים', icon: Link2 },
]

const BUSINESS_TYPE_OPTIONS = [
  { value: 'club', label: 'מועדון / מסיבה' },
  { value: 'festival', label: 'פסטיבל' },
  { value: 'venue', label: 'אולם אירועים / כנסים' },
  { value: 'restaurant', label: 'מסעדה / בר' },
  { value: 'gym', label: 'חדר כושר / סטודיו' },
  { value: 'hotel', label: 'מלון / נופש' },
  { value: 'retail', label: 'חנות / ריטייל' },
  { value: 'municipal', label: 'רשויות ומוסדות' },
  { value: 'organization', label: 'ארגונים ועמותות' },
  { value: 'general', label: 'עסק כללי' },
]

const UPSELL_BUSINESS_TYPES = [
  { value: 'hotel', label: 'מלון' },
  { value: 'event', label: 'אירוע' },
  { value: 'retail', label: 'ריטייל' },
  { value: 'restaurant', label: 'מסעדה' },
  { value: 'gym', label: 'חדר כושר' },
  { value: 'general', label: 'כללי' },
]

const defaultBrandAssets = () => ({
  colors: {
    primary: '#22C55E',
    secondary: '#16A34A',
    background: '#0A0A0A',
    text: '#FFFFFF',
    card: '#1A1A2E',
  },
  logo_url: null,
  font_family: 'Inter',
  is_dark_theme: true,
  banner_image: null,
})

function mergeBrandAssets(raw) {
  const d = defaultBrandAssets()
  if (!raw || typeof raw !== 'object') return d
  return {
    ...d,
    ...raw,
    colors: { ...d.colors, ...(raw.colors || {}) },
  }
}

export default function WebviewSettings() {
  const { session, businessId } = useAuth()
  const [tab, setTab] = useState('design')
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState(null)
  const [items, setItems] = useState([])

  const [brandDraft, setBrandDraft] = useState(defaultBrandAssets())
  const [settingsDraft, setSettingsDraft] = useState({
    name: '',
    slug: '',
    business_type: 'general',
    phone: '',
  })

  const [itemModal, setItemModal] = useState(null)
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    business_type: 'general',
    image_url: '',
    sort_order: 0,
  })
  const [savingBrand, setSavingBrand] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const qrRef = useRef(null)

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
      return
    }
    setLoading(true)
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/webview/settings`,
        { headers: authHeaders() },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה בטעינה')
      const b = data.business
      setBusiness(b)
      setItems(Array.isArray(data.items) ? data.items : [])
      if (b) {
        setBrandDraft(mergeBrandAssets(b.brand_assets))
        setSettingsDraft({
          name: b.name || '',
          slug: b.slug || '',
          business_type: b.business_type || 'general',
          phone: b.phone || '',
        })
      }
    } catch (e) {
      toast.error(e.message || 'שגיאה בטעינה')
    } finally {
      setLoading(false)
    }
  }, [businessId, session, authHeaders, onUnauthorized])

  useEffect(() => {
    load()
  }, [load])

  const publicUrl = business?.slug ? `${PUBLIC_WEBVIEW_ORIGIN}/w/${business.slug}` : ''

  const saveBrand = async () => {
    if (!businessId) return
    setSavingBrand(true)
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/webview/settings/brand`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ brand_assets: brandDraft }),
        },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה בשמירה')
      setBusiness((prev) => ({ ...prev, ...data.business }))
      toast.success('העיצוב נשמר')
    } catch (e) {
      toast.error(e.message || 'שגיאה בשמירה')
    } finally {
      setSavingBrand(false)
    }
  }

  const saveSettingsFields = async () => {
    if (!businessId) return
    setSavingSettings(true)
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/webview/settings/brand`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            name: settingsDraft.name,
            slug: settingsDraft.slug,
            business_type: settingsDraft.business_type,
            phone: settingsDraft.phone,
          }),
        },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה בשמירה')
      setBusiness((prev) => ({ ...prev, ...data.business }))
      toast.success('ההגדרות נשמרו')
    } catch (e) {
      toast.error(e.message || 'שגיאה בשמירה')
    } finally {
      setSavingSettings(false)
    }
  }

  const patchItem = async (id, body) => {
    const r = await fetchWithAuth(
      `${API_BASE}/api/webview/items/${id}`,
      { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) },
      session,
      onUnauthorized,
    )
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'שגיאה')
    return data.item
  }

  const toggleItemActive = async (row) => {
    try {
      const updated = await patchItem(row.id, { is_active: !row.is_active })
      setItems((prev) => prev.map((x) => (x.id === row.id ? updated : x)))
    } catch (e) {
      toast.error(e.message)
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('למחוק פריט זה?')) return
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/webview/items/${id}`,
        { method: 'DELETE', headers: authHeaders() },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setItems((prev) => prev.filter((x) => x.id !== id))
      toast.success('נמחק')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const openItemModal = (row) => {
    if (row) {
      setItemForm({
        name: row.name || '',
        description: row.description || '',
        price: row.price != null ? String(row.price) : '',
        category: row.category || '',
        business_type: row.business_type || 'general',
        image_url: row.image_url || '',
        sort_order: row.sort_order ?? 0,
      })
      setItemModal({ mode: 'edit', id: row.id })
    } else {
      setItemForm({
        name: '',
        description: '',
        price: '',
        category: '',
        business_type: 'general',
        image_url: '',
        sort_order: items.length,
      })
      setItemModal({ mode: 'create' })
    }
  }

  const submitItemModal = async () => {
    if (!itemForm.name.trim()) {
      toast.error('נא למלא שם')
      return
    }
    const priceNum = parseFloat(itemForm.price)
    if (Number.isNaN(priceNum)) {
      toast.error('מחיר לא תקין')
      return
    }
    try {
      if (itemModal.mode === 'create') {
        const r = await fetchWithAuth(
          `${API_BASE}/api/webview/items`,
          {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              name: itemForm.name.trim(),
              description: itemForm.description || null,
              price: priceNum,
              category: itemForm.category || null,
              business_type: itemForm.business_type,
              image_url: itemForm.image_url || null,
              sort_order: Number(itemForm.sort_order) || 0,
            }),
          },
          session,
          onUnauthorized,
        )
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'שגיאה')
        setItems((prev) => [...prev, data.item].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
        toast.success('נוסף')
      } else {
        const updated = await patchItem(itemModal.id, {
          name: itemForm.name.trim(),
          description: itemForm.description || null,
          price: priceNum,
          category: itemForm.category || null,
          business_type: itemForm.business_type,
          image_url: itemForm.image_url || null,
          sort_order: Number(itemForm.sort_order) || 0,
        })
        setItems((prev) =>
          prev.map((x) => (x.id === updated.id ? updated : x)).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        )
        toast.success('עודכן')
      }
      setItemModal(null)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const moveItem = async (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= items.length) return
    const reordered = [...items]
    const tmp = reordered[index]
    reordered[index] = reordered[next]
    reordered[next] = tmp
    const payload = reordered.map((it, i) => ({ id: it.id, sort_order: i }))
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/webview/items/reorder`,
        { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ items: payload }) },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setItems(reordered.map((it, i) => ({ ...it, sort_order: i })))
    } catch (e) {
      toast.error(e.message)
    }
  }

  const copyLink = () => {
    if (!publicUrl) return
    navigator.clipboard?.writeText(publicUrl).then(() => toast.success('הועתק'))
  }

  const downloadQr = () => {
    const el = qrRef.current
    if (!el) return
    const svg = el.querySelector('svg')
    if (!svg) return
    const ser = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([ser], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webview-qr-${business?.slug || 'link'}.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('הורד')
  }

  const previewSrc = business?.slug
    ? `${PUBLIC_WEBVIEW_ORIGIN}/w/${encodeURIComponent(business.slug)}?preview=true`
    : ''

  if (loading && !business) {
    return (
      <div style={{ padding: 24, color: 'var(--v2-gray-400)' }} dir="rtl">
        טוען…
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: '#fff',
            marginBottom: 8,
          }}
        >
          הגדרות Webview
        </h1>
        <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
          עיצוב, פריטי upsell, פרטי עסק ולינק ציבורי
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
            borderBottom: '1px solid var(--glass-border)',
            paddingBottom: 16,
          }}
        >
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `1px solid ${active ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
                  background: active ? 'rgba(0,195,122,0.12)' : 'transparent',
                  color: active ? '#fff' : 'var(--v2-gray-400)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Icon size={18} />
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'design' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle}>
              <h2 style={sectionH2}>צבעים וטיפוגרפיה</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {['primary', 'secondary', 'background', 'card', 'text'].map((key) => (
                  <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{key}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="color"
                        value={brandDraft.colors[key] || '#000000'}
                        onChange={(e) =>
                          setBrandDraft((prev) => ({
                            ...prev,
                            colors: { ...prev.colors, [key]: e.target.value },
                          }))
                        }
                        style={{ width: 48, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                      />
                      <input
                        className="input"
                        dir="ltr"
                        value={brandDraft.colors[key] || ''}
                        onChange={(e) =>
                          setBrandDraft((prev) => ({
                            ...prev,
                            colors: { ...prev.colors, [key]: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!brandDraft.is_dark_theme}
                  onChange={(e) => setBrandDraft((prev) => ({ ...prev, is_dark_theme: e.target.checked }))}
                />
                <span style={{ color: '#e5e5e5' }}>ערכת נושא כהה</span>
              </label>
              <div style={{ marginTop: 16 }}>
                <label className="label">גופן (font_family)</label>
                <input
                  className="input"
                  dir="ltr"
                  style={{ marginTop: 6 }}
                  value={brandDraft.font_family || ''}
                  onChange={(e) => setBrandDraft((prev) => ({ ...prev, font_family: e.target.value }))}
                  placeholder='למשל: "Heebo", sans-serif'
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={saveBrand}
                disabled={savingBrand}
              >
                <Save size={18} style={{ marginLeft: 8 }} />
                שמור עיצוב
              </button>
            </div>
            <div style={cardStyle}>
              <h2 style={sectionH2}>תצוגה מקדימה</h2>
              {previewSrc ? (
                <iframe
                  title="webview-preview"
                  src={previewSrc}
                  style={{
                    width: '100%',
                    height: 520,
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    background: '#000',
                  }}
                />
              ) : (
                <p style={{ color: 'var(--v2-gray-400)' }}>הגדר slug בעסק כדי לראות תצוגה מקדימה</p>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'items' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ ...sectionH2, marginBottom: 0 }}>פריטי Upsell</h2>
              <button type="button" className="btn-primary" onClick={() => openItemModal(null)}>
                <Plus size={18} style={{ marginLeft: 8 }} />
                הוסף פריט
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ textAlign: 'right', padding: 12 }}>סדר</th>
                    <th style={{ textAlign: 'right', padding: 12 }}>שם</th>
                    <th style={{ textAlign: 'right', padding: 12 }}>מחיר</th>
                    <th style={{ textAlign: 'right', padding: 12 }}>פעיל</th>
                    <th style={{ textAlign: 'right', padding: 12 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            aria-label="מעלה"
                            onClick={() => moveItem(idx, -1)}
                            style={iconBtnStyle}
                          >
                            <ChevronUp size={18} />
                          </button>
                          <button
                            type="button"
                            aria-label="מטה"
                            onClick={() => moveItem(idx, 1)}
                            style={iconBtnStyle}
                          >
                            <ChevronDown size={18} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>{row.name}</td>
                      <td style={{ padding: 12 }} dir="ltr">
                        {row.price}
                      </td>
                      <td style={{ padding: 12 }}>
                        <input
                          type="checkbox"
                          checked={!!row.is_active}
                          onChange={() => toggleItemActive(row)}
                        />
                      </td>
                      <td style={{ padding: 12, textAlign: 'left' }}>
                        <button type="button" style={iconBtnStyle} onClick={() => openItemModal(row)} title="ערוך">
                          <Pencil size={18} />
                        </button>
                        <button type="button" style={{ ...iconBtnStyle, color: '#f87171' }} onClick={() => deleteItem(row.id)} title="מחק">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <p style={{ color: 'var(--v2-gray-400)', padding: 24, textAlign: 'center' }}>אין פריטים עדיין</p>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
            <h2 style={sectionH2}>פרטי עסק</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
              <div>
                <label className="label">שם עסק</label>
                <input
                  className="input"
                  style={{ marginTop: 6 }}
                  value={settingsDraft.name}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">slug (URL)</label>
                <input
                  className="input"
                  dir="ltr"
                  style={{ marginTop: 6 }}
                  value={settingsDraft.slug}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, slug: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">סוג עסק</label>
                <select
                  className="input"
                  style={{ marginTop: 6 }}
                  value={settingsDraft.business_type}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, business_type: e.target.value }))}
                >
                  {BUSINESS_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">טלפון</label>
                <input
                  className="input"
                  dir="ltr"
                  style={{ marginTop: 6 }}
                  value={settingsDraft.phone}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, phone: e.target.value }))}
                />
              </div>
              <button type="button" className="btn-primary" onClick={saveSettingsFields} disabled={savingSettings}>
                <Save size={18} style={{ marginLeft: 8 }} />
                שמור הגדרות
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'links' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={sectionH2}>לינק ציבורי</h2>
            {publicUrl ? (
              <>
                <div
                  style={{
                    padding: 14,
                    background: 'var(--v2-dark-3, rgba(0,0,0,0.2))',
                    borderRadius: 10,
                    wordBreak: 'break-all',
                    fontSize: 14,
                    direction: 'ltr',
                    textAlign: 'left',
                  }}
                >
                  {publicUrl}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button type="button" className="btn-primary" onClick={copyLink}>
                    <Copy size={18} style={{ marginLeft: 8 }} />
                    העתק לינק
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                    style={secondaryBtnStyle}
                  >
                    <ExternalLink size={18} style={{ marginLeft: 8 }} />
                    פתח Webview
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...secondaryBtnStyle, background: '#25D366', color: '#fff', border: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    שתף ב-WhatsApp
                  </a>
                </div>
                <div ref={qrRef} style={{ padding: 16, background: '#fff', borderRadius: 12, alignSelf: 'flex-start' }}>
                  <QRCodeSVG value={publicUrl} size={200} level="M" includeMargin />
                </div>
                <button type="button" onClick={downloadQr} style={secondaryBtnStyle}>
                  <Download size={18} style={{ marginLeft: 8 }} />
                  הורד QR
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--v2-gray-400)' }}>הגדר slug בעסק כדי לקבל לינק ציבורי</p>
            )}
          </motion.div>
        )}
      </motion.div>

      {itemModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setItemModal(null)}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              padding: 24,
              maxWidth: 440,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16, color: '#fff' }}>{itemModal.mode === 'create' ? 'פריט חדש' : 'עריכת פריט'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">שם</label>
                <input className="input" style={{ marginTop: 4 }} value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">תיאור</label>
                <textarea className="input" style={{ marginTop: 4, minHeight: 72 }} value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">מחיר</label>
                <input className="input" dir="ltr" style={{ marginTop: 4 }} value={itemForm.price} onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="label">קטגוריה</label>
                <input className="input" style={{ marginTop: 4 }} value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label className="label">סוג עסק (פריט)</label>
                <select className="input" style={{ marginTop: 4 }} value={itemForm.business_type} onChange={(e) => setItemForm((f) => ({ ...f, business_type: e.target.value }))}>
                  {UPSELL_BUSINESS_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">כתובת תמונה (אופציונלי)</label>
                <input className="input" dir="ltr" style={{ marginTop: 4 }} value={itemForm.image_url} onChange={(e) => setItemForm((f) => ({ ...f, image_url: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn-primary" onClick={submitItemModal}>
                שמור
              </button>
              <button type="button" onClick={() => setItemModal(null)} style={secondaryBtnStyle}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const iconBtnStyle = {
  padding: 8,
  background: 'transparent',
  border: '1px solid var(--glass-border)',
  borderRadius: 8,
  color: 'var(--v2-gray-300)',
  cursor: 'pointer',
}

const secondaryBtnStyle = {
  padding: '10px 16px',
  background: 'transparent',
  border: '1px solid var(--glass-border)',
  color: 'var(--v2-gray-300)',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
}
