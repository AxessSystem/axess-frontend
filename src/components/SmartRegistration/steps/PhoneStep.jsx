export default function PhoneStep({ phone, onPhoneChange, onSubmit, sending, error }) {
  return (
    <div style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
      <p style={{ margin: '0 0 16px', color: 'var(--muni-muted, #475569)' }}>נשלח אליכם קוד SMS לאימות המספר.</p>
      <label htmlFor="sr-phone" style={{ display: 'block', fontWeight: 700 }}>
        מספר נייד (ישראלי)
      </label>
      <input
        id="sr-phone"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="05XXXXXXXX"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        disabled={sending}
        style={{
          width: '100%',
          minHeight: 48,
          fontSize: '1.2rem',
          marginTop: 8,
          padding: '0 12px',
          borderRadius: 12,
          border: '2px solid var(--muni-border, #e2e8f0)',
          direction: 'ltr',
          textAlign: 'right',
        }}
      />
      {error && (
        <p role="alert" style={{ color: '#b91c1c', marginTop: 10, fontWeight: 600 }}>
          {error}
        </p>
      )}
      <button
        type="button"
        className="muni-event-btn"
        style={{ width: '100%', marginTop: 20 }}
        onClick={onSubmit}
        disabled={sending}
      >
        {sending ? 'שולח…' : 'שלח קוד אימות'}
      </button>
    </div>
  )
}
