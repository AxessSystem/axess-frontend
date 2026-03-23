import { Link } from 'react-router-dom'

export default function SuccessStep({
  pendingApproval,
  paymentDone,
  totalAmount,
  eventSlug,
  citySlug,
  message,
  error,
}) {
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p role="alert" style={{ color: '#b91c1c', fontWeight: 700, fontSize: '1.1rem' }}>
          {error}
        </p>
        <p style={{ color: 'var(--muni-muted, #475569)', marginTop: 12 }}>אפשר לנסות שוב או להשלים בדף ההרשמה המלא.</p>
        {eventSlug && (
          <Link
            to={`/e/${eventSlug}`}
            className="muni-event-btn"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: 20, minWidth: 200 }}
          >
            דף הרשמה מלא
          </Link>
        )}
      </div>
    )
  }

  if (pendingApproval) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>⏳</p>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 800 }}>הבקשה התקבלה</h3>
        <p style={{ color: 'var(--muni-muted, #475569)', lineHeight: 1.7 }}>ההרשמה ממתינה לאישור. תעודכנו ב־SMS.</p>
      </div>
    )
  }

  if (paymentDone) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>🎉</p>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 800 }}>ההרשמה הושלמה</h3>
        <p style={{ color: 'var(--muni-muted, #475569)', lineHeight: 1.7 }}>
          {totalAmount > 0 ? 'התשלום התקבל. הכרטיס בדרך לנייד.' : 'נרשמתם בהצלחה — הכרטיס בדרך לנייד.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <p style={{ fontSize: '2.25rem', margin: '0 0 12px' }}>✓</p>
      <p style={{ fontSize: '1.15rem', lineHeight: 1.7 }}>{message || 'בוצע.'}</p>
      {citySlug && (
        <Link
          to={`/muni/${citySlug}`}
          className="muni-event-btn muni-event-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: 20 }}
        >
          חזרה לפורטל
        </Link>
      )}
    </div>
  )
}
