import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, X, ScanLine, QrCode, BarChart3 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchWithAuth, supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'
const PUBLIC_ORIGIN = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://axess.pro').replace(/\/$/, '')

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
  if (!station?.event_slug || !station?.token) return null
  return `${PUBLIC_ORIGIN}/scan/${station.event_slug}?token=${encodeURIComponent(station.token)}`
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

function scannerWaUrl(station) {
  const link = stationScanUrl(station)
  if (!link || !station?.scanner_phone) return null
  const name = (station.scanner_name || '').trim() || 'שלום'
  const msg = `שלום ${name}! הנה הלינק לעמדת הסריקה שלך:\n${link}\n\nתקף עד: ${formatExpiresDate(station.expires_at)}`
  const num = digitsForWa(station.scanner_phone)
  if (!num) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
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
  const [formScannerName, setFormScannerName] = useState('')
  const [formScannerPhone, setFormScannerPhone] = useState('')

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
    setFormScannerName('')
    setFormScannerPhone('')
    setModalOpen(true)
  }

  const createStation = async () => {
    if (!formName.trim()) {
      toast.error('נא למלא שם עמדה')
      return
    }
    if (!formEventId) {
      toast.error('נא לבחור אירוע')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: formName.trim(),
        event_id: formEventId,
        never_expires: formExpire === 'never',
        expires_hours: formExpire === 'never' ? 'never' : Number(formExpire),
        scannerName: formScannerName.trim() || undefined,
        scannerPhone: formScannerPhone.trim() || undefined,
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

      const link = station ? stationScanUrl(station) : null
      const phone = formScannerPhone.trim()
      if (link && phone) {
        const scannerName = formScannerName.trim() || 'שלום'
        const waMessage = `שלום ${scannerName}! הנה הלינק לעמדת הסריקה שלך:\n${link}\n\nתקף עד: ${formatExpiresDate(station?.expires_at)}`
        const waUrl = `https://wa.me/${digitsForWa(phone)}?text=${encodeURIComponent(waMessage)}`
        window.open(waUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSaving(false)
    }
  }

  const copyStationLink = (station) => {
    const u = stationScanUrl(station)
    if (!u) {
      toast.error('אין לינק — חסר אירוע')
      return
    }
    navigator.clipboard.writeText(u).then(() => toast.success('הועתק'))
  }

  const waResendToScanner = (station) => {
    const url = scannerWaUrl(station)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!stationScanUrl(station)) {
      toast.error('אין לינק — חסר אירוע')
      return
    }
    toast.error('לא הוגדר טלפון סורק — הוסיפו ביצירת עמדה או עדכנו במסד')
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
                return (
                  <motion.div key={s.id} layout style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{s.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 4 }}>
                          {s.event_title || 'ללא אירוע'}
                        </div>
                        {(s.scanner_name || s.scanner_phone) && (
                          <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 8, lineHeight: 1.5 }}>
                            {s.scanner_name ? (
                              <div>
                                סורק: <strong style={{ color: '#fff' }}>{s.scanner_name}</strong>
                              </div>
                            ) : null}
                            {s.scanner_phone ? (
                              <div dir="ltr" style={{ textAlign: 'right' }}>
                                טלפון: <strong style={{ color: '#fff' }}>{s.scanner_phone}</strong>
                              </div>
                            ) : null}
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
                      <button type="button" style={btnGhost} onClick={() => waResendToScanner(s)}>
                        📱 שלח שוב ב-WA
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
                maxWidth: 420,
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
                  <option value="">— בחרו —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title || ev.slug}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>
                  שם הסורק (אופציונלי)
                </span>
                <input
                  style={inputStyle}
                  placeholder="שם הסורק (למשל: יוסי שומר)"
                  value={formScannerName}
                  onChange={(e) => setFormScannerName(e.target.value)}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>
                  טלפון הסורק (אופציונלי)
                </span>
                <input
                  type="tel"
                  style={inputStyle}
                  placeholder="050-0000000"
                  value={formScannerPhone}
                  onChange={(e) => setFormScannerPhone(e.target.value)}
                  dir="ltr"
                />
              </label>
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
