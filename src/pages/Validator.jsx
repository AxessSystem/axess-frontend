import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app/api'

// ─── Status screens ───────────────────────────────────────────────────────────
function ScreenError({ title, message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white px-6">
      <div className="text-6xl mb-6">❌</div>
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      <p className="text-white/50 text-center max-w-xs">{message}</p>
    </div>
  )
}

function ScreenRedeemed({ validator }) {
  const date = validator.redeemed_at
    ? new Date(validator.redeemed_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
    : '—'
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white px-6">
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-2xl font-bold mb-2">כרטיס זה כבר מומש</h1>
      <p className="text-white/50 text-center">תאריך מימוש: {date}</p>
      {validator.redeemed_by && (
        <p className="text-white/30 text-sm mt-2">מומש על ידי: {validator.redeemed_by}</p>
      )}
    </div>
  )
}

function ScreenExpired() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white px-6">
      <div className="text-6xl mb-6">⏰</div>
      <h1 className="text-2xl font-bold mb-2">הכרטיס פג תוקף</h1>
      <p className="text-white/50 text-center">הכרטיס אינו בתוקף עוד.</p>
    </div>
  )
}

function ScreenCancelled() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white px-6">
      <div className="text-6xl mb-6">🚫</div>
      <h1 className="text-2xl font-bold mb-2">הכרטיס בוטל</h1>
      <p className="text-white/50 text-center">כרטיס זה בוטל ואינו ניתן למימוש.</p>
    </div>
  )
}

// ─── Redemption success animation ────────────────────────────────────────────
function ScreenSuccess({ validator }) {
  const [elapsed, setElapsed] = useState(0)
  const redeemedAt = new Date(validator.redeemed_at)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - redeemedAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1a0a] text-white px-6">
      <div className="text-8xl mb-6 animate-bounce">✅</div>
      <h1 className="text-3xl font-bold mb-2 text-[#25D366]">מומש בהצלחה!</h1>
      <p className="text-white/50 mb-8">
        {redeemedAt.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
      </p>
      <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-center">
        <p className="text-white/40 text-sm mb-1">זמן מאז מימוש</p>
        <p className="text-4xl font-mono font-bold text-[#25D366]">{fmt(elapsed)}</p>
      </div>
      {validator.business_name && (
        <p className="mt-8 text-white/30 text-sm">{validator.business_name}</p>
      )}
    </div>
  )
}

// ─── Active validator card ────────────────────────────────────────────────────
function ScreenActive({ validator, onRedeem }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const meta = validator.metadata || {}
  const displayFields = validator.display_fields || []
  const ctaButtons    = validator.cta_buttons    || []
  const branding      = validator.branding       || {}

  const accentColor = branding.accent_color || '#25D366'

  async function handleRedeem() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/v/${validator.slug}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'invalid_pin') setError('קוד PIN שגוי')
        else if (data.error === 'already_redeemed') setError('כרטיס זה כבר מומש')
        else setError('שגיאה במימוש — נסה שוב')
      } else {
        onRedeem(data.validator)
      }
    } catch {
      setError('שגיאת תקשורת — בדוק חיבור')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 text-center">
        {branding.logo_url ? (
          <img src={branding.logo_url} alt="logo" className="h-12 mx-auto mb-3 object-contain" />
        ) : (
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-black font-bold text-xl"
               style={{ backgroundColor: accentColor }}>
            {(validator.business_name || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-bold">{validator.business_name || 'AXESS'}</h1>
        {validator.template_name && (
          <p className="text-white/40 text-sm mt-1">{validator.template_name}</p>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 px-6 pb-6 space-y-4">
        {/* Metadata fields */}
        {displayFields.length > 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            {displayFields.map((field) => (
              meta[field.key] ? (
                <div key={field.key} className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">{field.label}</span>
                  <span className="font-medium">{meta[field.key]}</span>
                </div>
              ) : null
            ))}
          </div>
        ) : (
          Object.keys(meta).filter(k => k !== 'phone').length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              {Object.entries(meta).filter(([k]) => k !== 'phone').map(([k, v]) => (
                <div key={k} className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">{k}</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          )
        )}

        {/* Expiry */}
        {validator.expires_at && (
          <p className="text-white/30 text-xs text-center">
            תוקף עד: {new Date(validator.expires_at).toLocaleDateString('he-IL')}
          </p>
        )}

        {/* CTA buttons */}
        {ctaButtons.map((btn, i) => (
          <a key={i} href={btn.url} target="_blank" rel="noreferrer"
             className="block w-full text-center border border-white/20 hover:border-white/40 text-white py-3 rounded-xl transition-colors">
            {btn.label}
          </a>
        ))}

        {/* PIN input (optional) */}
        <div className="mt-2">
          <input
            type="number"
            placeholder="קוד PIN (אם נדרש)"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-lg tracking-widest placeholder-white/20 focus:outline-none focus:border-white/30"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Redeem button */}
        <button
          onClick={handleRedeem}
          disabled={loading}
          className="w-full py-5 rounded-2xl text-black font-bold text-xl transition-all active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {loading ? '⏳ ממש...' : '✅ מימוש'}
        </button>

        <p className="text-white/20 text-xs text-center">
          slug: {validator.slug}
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Validator() {
  const { slug } = useParams()
  const [state, setState] = useState('loading') // loading | active | redeemed | expired | cancelled | error | success
  const [validator, setValidator] = useState(null)

  useEffect(() => {
    if (!slug) { setState('error'); return }
    fetch(`${API_BASE}/v/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error === 'not_found') { setState('error'); return }
        setValidator(data)
        setState(data.status || 'active')
      })
      .catch(() => setState('error'))
  }, [slug])

  function handleRedeemed(updatedValidator) {
    setValidator(updatedValidator)
    setState('success')
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="w-8 h-8 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'error')     return <ScreenError title="הכרטיס לא נמצא" message="הקישור שגוי או שהכרטיס הוסר." />
  if (state === 'redeemed')  return <ScreenRedeemed validator={validator} />
  if (state === 'expired')   return <ScreenExpired />
  if (state === 'cancelled') return <ScreenCancelled />
  if (state === 'success')   return <ScreenSuccess validator={validator} />
  return <ScreenActive validator={validator} onRedeem={handleRedeemed} />
}
