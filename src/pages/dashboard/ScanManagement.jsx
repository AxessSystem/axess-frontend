import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, X, ScanLine, QrCode, BarChart3 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchWithAuth, supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'
const PUBLIC_ORIGIN = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://axess.pro').replace(/\/$/, '')

const GENERAL_SLUG = 'general'

const cardStyle = {
  background: 'var(--card)',
  border: '1px solid var(--glass-border)',
  borderRadius: 12,
  padding: 20,
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
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid var(--glass-border)',
  background: 'transparent',
  color: 'var(--v2-gray-400)',
  fontSize: 13,
  cursor: 'pointer',
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--glass-border)',
  background: 'var(--v2-dark-2)',
  color: '#fff',
  fontSize: 14,
}

const EXPIRE_OPTIONS = [
  { value: 6, label: '6 שעות' },
  { value: 12, label: '12 שעות' },
  { value: 24, label: '24 שעות' },
  { value: 48, label: '48 שעות' },
  { value: 'never', label: 'קבוע (ללא תפוגה)' },
]

const KIND_LABELS = {
  ticket: 'כרטיס',
  coupon: 'קופון',
  validator: 'Validator',
}

function stationScanUrl(station) {
  if (!station?.token) return null
  const slug = station.event_slug || GENERAL_SLUG
  return `${PUBLIC_ORIGIN}/scan/${slug}?token=${encodeURIComponent(station.token)}`
}

function formatExpiresDate(expiresAt) {
  if (!expiresAt) return 'ללא הגבלת זמן'
  return new Date(expiresAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
}

/** מספר ל-wa.me (972XXXXXXXXX) */
function digitsForWa(phone) {
  const d = String(phone || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('972')) return d
  if (d.startsWith('0')) return `972${d.slice(1)}`
  return `972${d}`
}

function parseScanners(station) {
  const raw = station?.scanners
  if (Array.isArray(raw)) {
    return raw.map((s) => ({
      name: typeof s?.name === 'string' ? s.name : '',
      phone: typeof s?.phone === 'string' ? s.phone : '',
    }))
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      if (Array.isArray(p)) {
        return p.map((s) => ({
          name: typeof s?.name === 'string' ? s.name : '',
          phone: typeof s?.phone === 'string' ? s.phone : '',
        }))
      }
    } catch {
      return []
    }
  }
  return []
}

function waUrlForScanner(station, sc) {
  const link = stationScanUrl(station)
  if (!link || !String(sc?.phone || '').trim()) return null
  const name = String(sc.name || '').trim() || 'שלום'
  const msg = `שלום ${name}! הנה הלינק לעמדת הסריקה שלך:\n${link}\n\nתקף עד: ${formatExpiresDate(station.expires_at)}`
  const num = digitsForWa(sc.phone)
  if (!num) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}

async function openWaForScannersSequentially(station, scannerList) {
  const withPhone = scannerList.filter((s) => String(s.phone || '').trim())
  for (const sc of withPhone) {
    const u = waUrlForScanner(station, sc)
    if (u) {
      window.open(u, '_blank', 'noopener,noreferrer')
      await new Promise((r) => setTimeout(r, 450))
    }
  }
}

function stationStatus(station) {
  if (!station.is_active) return { label: 'כבוי', color: '#888' }
  if (station.expires_at && new Date(station.expires_at) < new Date()) {
    return { label: 'פג תוקף', color: '#f87171' }
  }
  return { label: 'פעיל', color: 'var(--v2-primary)' }
}

function ValidatorQrRow({ item, onStats }) {
  const canvasRef = useRef(null)
  const url = `${PUBLIC_ORIGIN}/v/${item.slug}`
  const title =
    item.metadata?.buyer_name ||
    item.metadata?.title ||
    item.metadata?.event_name ||
    item.slug

  const downloadPng = () => {
    const c = canvasRef.current
    if (!c) return
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = `qr-${item.slug}.png`
    a.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => toast.success('הועתק'))
  }

  return (
    <div
      style={{
        ...cardStyle,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 16,
        alignItems: 'start',
      }}
      className="validator-qr-row"
    >
      <div style={{ background: '#fff', padding: 8, borderRadius: 10 }}>
        <QRCodeCanvas ref={canvasRef} value={url} size={120} level="M" includeMargin />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: '#fff', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>
          {KIND_LABELS[item.kind] || item.kind}
          {item.event_title ? ` · ${item.event_title}` : ''}
          {item.campaign_name ? ` · ${item.campaign_name}` : ''}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" style={btnGhost} onClick={downloadPng}>
            הורד PNG
          </button>
          <button type="button" style={btnGhost} onClick={copyLink}>
            <Copy size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
            העתק לינק
          </button>
          <button type="button" style={btnGhost} onClick={() => onStats(item)}>
            <BarChart3 size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
            סטטיסטיקות
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ScanManagement() {
  const { session, businessId } = useAuth()
  const [tab, setTab] = useState('stations')
  const [stations, setStations] = useState([])
  const [library, setLibrary] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [libLoading, setLibLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [statsItem, setStatsItem] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState('')
  const [formEventId, setFormEventId] = useState('')
  const [formExpire, setFormExpire] = useState('24')
  const [scanners, setScanners] = useState([{ name: '', phone: '' }])

  const [editStation, setEditStation] = useState(null)
  const [editScanners, setEditScanners] = useState([])
  const [savingEdit, setSavingEdit] = useState(false)

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

  const loadStations = useCallback(async () => {
    if (!businessId || !session?.access_token) return
    const r = await fetchWithAuth(`${API_BASE}/api/scan-stations`, { headers: authHeaders() }, session, onUnauthorized)
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'שגיאה')
    setStations(Array.isArray(data.stations) ? data.stations : [])
  }, [businessId, session, authHeaders, onUnauthorized])

  const loadLibrary = useCallback(async () => {
    if (!businessId || !session?.access_token) return
    setLibLoading(true)
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/scan-stations/qr-library`,
        { headers: authHeaders() },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setLibrary(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLibLoading(false)
    }
  }, [businessId, session, authHeaders, onUnauthorized])

  const loadEvents = useCallback(async () => {
    if (!businessId) return
    const r = await fetch(
      `${API_BASE}/api/admin/events?business_id=${encodeURIComponent(businessId)}`,
      { headers: { Authorization: `Bearer ${session?.access_token}` } },
    )
    const rows = await r.json()
    if (Array.isArray(rows)) setEvents(rows)
  }, [businessId, session?.access_token])

  useEffect(() => {
    if (!businessId || !session?.access_token) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([loadStations(), loadEvents()])
      .catch((e) => toast.error(e.message || 'שגיאה בטעינה'))
      .finally(() => setLoading(false))
  }, [businessId, session?.access_token, loadStations, loadEvents])

  useEffect(() => {
    if (tab === 'library' && businessId && session?.access_token) {
      loadLibrary()
    }
  }, [tab, businessId, session?.access_token, loadLibrary])

  const openModal = () => {
    setFormName('')
    setFormEventId('')
    setFormExpire('24')
    setScanners([{ name: '', phone: '' }])
    setModalOpen(true)
  }

  const openEditScanners = (station) => {
    const list = parseScanners(station)
    setEditStation(station)
    setEditScanners(list.length ? list.map((s) => ({ ...s })) : [{ name: '', phone: '' }])
  }

  const saveEditScanners = async () => {
    if (!editStation) return
    setSavingEdit(true)
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/scan-stations/${editStation.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ scanners: editScanners }),
        },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      toast.success('נשמר')
      setEditStation(null)
      await loadStations()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSavingEdit(false)
    }
  }

  const createStation = async () => {
    if (!formName.trim()) {
      toast.error('נא למלא שם עמדה')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: formName.trim(),
        event_id: formEventId || null,
        never_expires: formExpire === 'never',
        expires_hours: formExpire === 'never' ? 'never' : Number(formExpire),
        scanners,
      }
      const r = await fetchWithAuth(
        `${API_BASE}/api/scan-stations`,
        { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      const station = data.station
      toast.success('נוצרה עמדה')
      setModalOpen(false)
      await loadStations()

      const merged = { ...station, scanners: station.scanners ?? scanners }
      await openWaForScannersSequentially(merged, scanners)
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSaving(false)
    }
  }

  const copyStationLink = (station) => {
    const u = stationScanUrl(station)
    if (!u) {
      toast.error('אין לינק')
      return
    }
    navigator.clipboard.writeText(u).then(() => toast.success('הועתק'))
  }

  const deactivateStation = async (id) => {
    if (!confirm('לבטל את העמדה?')) return
    try {
      const r = await fetchWithAuth(
        `${API_BASE}/api/scan-stations/${id}`,
        { method: 'DELETE', headers: authHeaders() },
        session,
        onUnauthorized,
      )
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      toast.success('בוטל')
      await loadStations()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const tabBtn = (active) => ({
    padding: '10px 18px',
    borderRadius: 10,
    border: '1px solid var(--glass-border)',
    background: active ? 'var(--glass-bg)' : 'transparent',
    color: active ? '#fff' : 'var(--v2-gray-400)',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  })

  const scannerRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  }

  return (
    <div dir="rtl" style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <ScanLine size={28} style={{ color: 'var(--v2-primary)' }} />
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: '#fff',
            margin: 0,
          }}
        >
          עמדות סריקה
        </h1>
      </div>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        ניהול לינקי עמדה וספריית QR של ולידטורים
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button type="button" style={tabBtn(tab === 'stations')} onClick={() => setTab('stations')}>
          עמדות סריקה
        </button>
        <button type="button" style={tabBtn(tab === 'library')} onClick={() => setTab('library')}>
          <QrCode size={16} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
          ספריית QR
        </button>
      </div>

      {tab === 'stations' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button type="button" style={btnPrimary} onClick={openModal}>
              <Plus size={18} />
              עמדה חדשה
            </button>
          </div>

          {loading ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--v2-gray-400)' }}>טוען…</div>
          ) : stations.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--v2-gray-400)' }}>
              אין עמדות עדיין — צרו עמדה חדשה
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stations.map((s) => {
                const st = stationStatus(s)
                const link = stationScanUrl(s)
                const scList = parseScanners(s)
                return (
                  <motion.div key={s.id} layout style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{s.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 4 }}>
                          {s.event_title || 'ללא שיוך לאירוע (כללי)'}
                        </div>
                        {scList.length > 0 && (
                          <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 8, lineHeight: 1.6 }}>
                            <div style={{ fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 4 }}>סורקים</div>
                            <ul style={{ margin: 0, paddingRight: 18 }}>
                              {scList.map((sc, i) => (
                                <li key={i}>
                                  {sc.name || '(ללא שם)'}
                                  {sc.phone ? (
                                    <span dir="ltr" style={{ display: 'inline-block', marginRight: 6 }}>
                                      {' '}
                                      · {sc.phone}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 10 }}>
                      סריקות: <strong style={{ color: '#fff' }}>{s.scans_count ?? 0}</strong>
                    </div>
                    {link && (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          color: 'var(--v2-gray-400)',
                          wordBreak: 'break-all',
                          direction: 'ltr',
                          textAlign: 'right',
                        }}
                      >
                        {link}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      <button type="button" style={btnGhost} onClick={() => copyStationLink(s)}>
                        📋 העתק לינק
                      </button>
                      <button type="button" style={btnGhost} onClick={() => openEditScanners(s)}>
                        ✏️ ערוך סורקים
                      </button>
                      <button
                        type="button"
                        style={{ ...btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.35)' }}
                        onClick={() => deactivateStation(s.id)}
                      >
                        ❌ בטל
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'library' && (
        <>
          {libLoading ? (
            <div style={{ ...cardStyle, textAlign: 'center' }}>טוען ספרייה…</div>
          ) : library.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--v2-gray-400)' }}>
              אין ולידטורים להצגה
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {library.map((item) => (
                <ValidatorQrRow key={item.id} item={item} onStats={setStatsItem} />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => !saving && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
              style={{
                width: '100%',
                maxWidth: 480,
                maxHeight: '90vh',
                overflow: 'auto',
                background: 'var(--card)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>עמדה חדשה</span>
                <button type="button" style={{ ...btnGhost, padding: 6 }} onClick={() => setModalOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>שם העמדה</span>
                <input
                  style={inputStyle}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="כניסה ראשית / שער 2"
                />
              </label>
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>אירוע</span>
                <select style={inputStyle} value={formEventId} onChange={(e) => setFormEventId(e.target.value)}>
                  <option value="">ללא שיוך לאירוע (כללי)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title || ev.slug}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 8 }}>סורקים</span>
                {scanners.map((row, idx) => (
                  <div key={idx} style={{ ...scannerRowStyle, gridTemplateColumns: '1fr 1fr auto auto' }}>
                    <input
                      style={inputStyle}
                      placeholder="שם הסורק"
                      value={row.name}
                      onChange={(e) => {
                        const next = [...scanners]
                        next[idx] = { ...next[idx], name: e.target.value }
                        setScanners(next)
                      }}
                    />
                    <input
                      type="tel"
                      style={inputStyle}
                      placeholder="050-0000000"
                      value={row.phone}
                      dir="ltr"
                      onChange={(e) => {
                        const next = [...scanners]
                        next[idx] = { ...next[idx], phone: e.target.value }
                        setScanners(next)
                      }}
                    />
                    {scanners.length > 1 ? (
                      <button
                        type="button"
                        style={{ ...btnGhost, padding: '8px 10px' }}
                        onClick={() => setScanners(scanners.filter((_, i) => i !== idx))}
                        aria-label="הסר סורק"
                      >
                        ✕
                      </button>
                    ) : (
                      <span style={{ width: 36 }} />
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  style={{ ...btnGhost, marginTop: 4 }}
                  onClick={() => setScanners([...scanners, { name: '', phone: '' }])}
                >
                  + הוסף סורק
                </button>
              </div>

              <label style={{ display: 'block', marginBottom: 20 }}>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>תוקף</span>
                <select style={inputStyle} value={formExpire} onChange={(e) => setFormExpire(e.target.value)}>
                  {EXPIRE_OPTIONS.map((o) => (
                    <option key={String(o.value)} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }} disabled={saving} onClick={createStation}>
                {saving ? 'יוצר…' : 'צור עמדה'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editStation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 205,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => !savingEdit && setEditStation(null)}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
              style={{
                width: '100%',
                maxWidth: 520,
                maxHeight: '90vh',
                overflow: 'auto',
                background: 'var(--card)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>עריכת סורקים — {editStation.name}</span>
                <button type="button" style={{ ...btnGhost, padding: 6 }} onClick={() => setEditStation(null)}>
                  <X size={22} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 14 }}>
                שם וטלפון לכל סורק. &quot;שלח WA&quot; שולח את לינק העמדה לטלפון שצוין.
              </p>
              {editScanners.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-2)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>סורק {idx + 1}</div>
                  <div style={{ ...scannerRowStyle, gridTemplateColumns: '1fr 1fr', marginBottom: 8 }}>
                    <input
                      style={inputStyle}
                      placeholder="שם"
                      value={row.name}
                      onChange={(e) => {
                        const next = [...editScanners]
                        next[idx] = { ...next[idx], name: e.target.value }
                        setEditScanners(next)
                      }}
                    />
                    <input
                      type="tel"
                      style={inputStyle}
                      placeholder="טלפון"
                      value={row.phone}
                      dir="ltr"
                      onChange={(e) => {
                        const next = [...editScanners]
                        next[idx] = { ...next[idx], phone: e.target.value }
                        setEditScanners(next)
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      style={btnGhost}
                      disabled={!row.phone?.trim()}
                      onClick={() => {
                        const u = waUrlForScanner(editStation, row)
                        if (u) window.open(u, '_blank', 'noopener,noreferrer')
                        else toast.error('נא למלא טלפון תקין')
                      }}
                    >
                      📱 שלח WA לסורק
                    </button>
                    {editScanners.length > 1 ? (
                      <button
                        type="button"
                        style={{ ...btnGhost, color: '#f87171' }}
                        onClick={() => setEditScanners(editScanners.filter((_, i) => i !== idx))}
                      >
                        הסר סורק
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              <button
                type="button"
                style={{ ...btnGhost, marginBottom: 16 }}
                onClick={() => setEditScanners([...editScanners, { name: '', phone: '' }])}
              >
                + הוסף סורק חדש
              </button>
              <button
                type="button"
                style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}
                disabled={savingEdit}
                onClick={saveEditScanners}
              >
                {savingEdit ? 'שומר…' : 'שמור'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {statsItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 210,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setStatsItem(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
              style={{
                ...cardStyle,
                maxWidth: 400,
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 800, color: '#fff' }}>סטטיסטיקות</span>
                <button type="button" style={btnGhost} onClick={() => setStatsItem(null)}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', lineHeight: 1.7 }}>
                <div>
                  <strong style={{ color: '#fff' }}>סטטוס:</strong> {statsItem.status}
                </div>
                <div>
                  <strong style={{ color: '#fff' }}>Slug:</strong>{' '}
                  <span style={{ direction: 'ltr', display: 'inline-block' }}>{statsItem.slug}</span>
                </div>
                {statsItem.redeemed_at && (
                  <div>
                    <strong style={{ color: '#fff' }}>מומש:</strong> {new Date(statsItem.redeemed_at).toLocaleString('he-IL')}
                  </div>
                )}
                {statsItem.expires_at && (
                  <div>
                    <strong style={{ color: '#fff' }}>תפוגה:</strong> {new Date(statsItem.expires_at).toLocaleString('he-IL')}
                  </div>
                )}
                {statsItem.event_title && (
                  <div>
                    <strong style={{ color: '#fff' }}>אירוע:</strong> {statsItem.event_title}
                  </div>
                )}
                {statsItem.campaign_name && (
                  <div>
                    <strong style={{ color: '#fff' }}>קמפיין:</strong> {statsItem.campaign_name}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
