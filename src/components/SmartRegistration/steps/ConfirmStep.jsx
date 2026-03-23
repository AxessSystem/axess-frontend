export default function ConfirmStep({
  externalMode,
  event,
  ticketTypes,
  ticketTypeId,
  quantity,
  customFields,
  idNumber,
  pricingTier,
  phone,
  loading,
  error,
  onSubmit,
  onBack,
}) {
  const tt = ticketTypes.find((t) => t.id === ticketTypeId)
  const regFields = Array.isArray(event?.registration_fields) ? event.registration_fields : []

  if (externalMode) {
    return (
      <div style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
        <p>ההמשך מתבצע באתר חיצוני. המעקב (אופציונלי) יבוצע לפי הנייד שאומת.</p>
        <p style={{ fontWeight: 700, marginTop: 12 }}>
          נייד: <span dir="ltr">{phone}</span>
        </p>
        {error && (
          <p role="alert" style={{ color: '#b91c1c', marginTop: 12, fontWeight: 600 }}>
            {error}
          </p>
        )}
        <button type="button" className="muni-event-btn" style={{ width: '100%', marginTop: 20 }} onClick={onSubmit} disabled={loading}>
          {loading ? 'מעביר…' : 'מעבר לאתר ההרשמה'}
        </button>
        <button
          type="button"
          className="muni-event-btn muni-event-secondary"
          style={{ width: '100%', marginTop: 12 }}
          onClick={onBack}
          disabled={loading}
        >
          חזרה
        </button>
      </div>
    )
  }

  const nameParts = [customFields.first_name, customFields.last_name].filter(Boolean).join(' ')

  return (
    <div style={{ fontSize: '1.05rem', lineHeight: 1.65 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800 }}>אישור פרטים</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <li>
          <strong>כניסה:</strong> {tt?.name || '—'} × {quantity} (₪{Number(tt?.price || 0).toFixed(0)} ליחידה)
        </li>
        {event?.city_code && (
          <li>
            <strong>מחירון:</strong> {pricingTier === 'resident' ? 'תושב' : 'אורח'}
          </li>
        )}
        {nameParts && (
          <li>
            <strong>שם:</strong> {nameParts}
          </li>
        )}
        <li>
          <strong>נייד:</strong> <span dir="ltr">{phone}</span>
        </li>
        {regFields.map((f) =>
          customFields[f.id] ? (
            <li key={f.id}>
              <strong>{f.label}:</strong> {customFields[f.id]}
            </li>
          ) : null
        )}
        {event?.requires_id && idNumber && (
          <li>
            <strong>ת״ז:</strong> <span dir="ltr">{idNumber}</span>
          </li>
        )}
      </ul>
      {error && (
        <p role="alert" style={{ color: '#b91c1c', marginTop: 12, fontWeight: 600 }}>
          {error}
        </p>
      )}
      <button type="button" className="muni-event-btn" style={{ width: '100%', marginTop: 20 }} onClick={onSubmit} disabled={loading}>
        {loading ? 'שולח…' : 'אשר והמשך'}
      </button>
      <button
        type="button"
        className="muni-event-btn muni-event-secondary"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
        disabled={loading}
      >
        חזרה לעריכה
      </button>
    </div>
  )
}
