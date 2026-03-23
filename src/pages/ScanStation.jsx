import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import jsQR from 'jsqr'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

// ─── Audio helpers ───────────────────────────────────────────────────────────
function playBeep(freq = 800, duration = 150) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration / 1000)
  } catch (_) {}
}

// ─── Result screens ───────────────────────────────────────────────────────────
function ScreenValid({ holder_name, ticket_type, seat }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100])
    playBeep(800, 150)
  }, [])
  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00C37A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 120, marginBottom: 24 }}>✅</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{holder_name}</div>
      <div style={{ fontSize: 18, opacity: 0.9 }}>{ticket_type}</div>
      {seat && <div style={{ fontSize: 16, opacity: 0.8, marginTop: 4 }}>מושב: {seat}</div>}
    </div>
  )
}

function ScreenInvalid({ reason, redeemed_at }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    playBeep(300, 200)
  }, [])

  const messages = {
    already_used: 'כבר נסרק',
    not_found: 'כרטיס לא נמצא',
    wrong_event: 'כרטיס לאירוע אחר',
    expired: 'כרטיס פג תוקף',
  }
  const msg = messages[reason] || reason

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#EF4444',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 120, marginBottom: 24 }}>❌</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{msg}</div>
      {reason === 'already_used' && redeemed_at && (
        <div style={{ fontSize: 16, opacity: 0.9 }}>
          זמן הסריקה הקודמת: {new Date(redeemed_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
        </div>
      )}
    </div>
  )
}

function ScreenNetworkError() {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
  }, [])
  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#F59E0B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 80, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>בעיית חיבור — נסה שוב</div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ScanStation() {
  const { eventSlug } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const stationType = searchParams.get('type') || 'event'

  const [eventInfo, setEventInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [invalidLink, setInvalidLink] = useState(false)
  const [result, setResult] = useState(null) // { type: 'valid'|'invalid'|'network', ... }
  const [scansCount, setScansCount] = useState(0)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const scanningRef = useRef(true)

  useEffect(() => {
    if (!token) {
      setInvalidLink(true)
      setLoading(false)
      return
    }
    fetch(
      `${API_BASE}/scan/${encodeURIComponent(eventSlug)}?token=${encodeURIComponent(token)}&type=${encodeURIComponent(stationType)}`,
    )
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setInvalidLink(true)
        } else {
          setEventInfo(data)
          setScansCount(data.scans_count || 0)
        }
        setLoading(false)
      })
      .catch(() => {
        setInvalidLink(true)
        setLoading(false)
      })
  }, [eventSlug, token, stationType])

  useEffect(() => {
    if (!eventInfo || result) return

    let stream = null
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        tick()
      } catch (e) {
        console.error('Camera error:', e)
      }
    }
    startCamera()
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [eventInfo, result])

  const tick = () => {
    if (!scanningRef.current || result) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code && code.data) {
      scanningRef.current = false
      verifyQr(code.data)
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const verifyQr = async qrData => {
    try {
      const res = await fetch(`${API_BASE}/scan/${encodeURIComponent(eventSlug)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_data: qrData, token, type: stationType }),
      })
      const data = await res.json()

      if (data.valid) {
        setResult({ type: 'valid', ...data })
        setScansCount(c => c + 1)
        setTimeout(() => {
          setResult(null)
          scanningRef.current = true
          tick()
        }, 2500)
      } else {
        setResult({
          type: 'invalid',
          reason: data.reason || 'not_found',
          redeemed_at: data.redeemed_at,
        })
        setTimeout(() => {
          setResult(null)
          scanningRef.current = true
          tick()
        }, 2500)
      }
    } catch {
      setResult({ type: 'network' })
      setTimeout(() => {
        setResult(null)
        scanningRef.current = true
        tick()
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 40, height: 40, border: '3px solid #00C37A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (invalidLink) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: '#000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 60, marginBottom: 16 }}>🔗</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>לינק לא תקין</div>
        <div style={{ color: '#888', marginTop: 8 }}>יש להשתמש בלינק שקיבלת מאדמין האירוע</div>
      </div>
    )
  }

  if (result?.type === 'valid') {
    return <ScreenValid holder_name={result.holder_name} ticket_type={result.ticket_type} seat={result.seat} />
  }
  if (result?.type === 'invalid') {
    return <ScreenInvalid reason={result.reason} redeemed_at={result.redeemed_at} />
  }
  if (result?.type === 'network') {
    return <ScreenNetworkError />
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: 20, borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{eventInfo?.event?.title}</div>
        {eventInfo?.event?.date && (
          <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
            {new Date(eventInfo.event.date).toLocaleDateString('he-IL', { dateStyle: 'full' })}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ color: '#00C37A', fontSize: 14 }}>{eventInfo?.label || 'עמדת סריקה'}</span>
          <span style={{ color: '#888', fontSize: 14 }}>סרוק היום: {scansCount}</span>
        </div>
      </div>

      {/* Scan area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 280,
            height: 280,
            border: '3px solid var(--v2-primary, #00C37A)',
            borderRadius: 16,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            }}
            muted
            playsInline
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#00C37A',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          כוון מצלמה לQR
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
