export default function OTPStep({ phone, code, onCodeChange, onVerify, onBack, verifying, error }) {
  return (
    <div style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
      <p style={{ margin: '0 0 8px' }}>
        נשלח קוד ל־<span dir="ltr">{phone}</span>
      </p>
      <label htmlFor="sr-otp" style={{ display: 'block', marginTop: 16, fontWeight: 700 }}>
        קוד בן 6 ספרות
      </label>
      <input
        id="sr-otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        disabled={verifying}
        style={{
          width: '100%',
          minHeight: 48,
          fontSize: '1.35rem',
          letterSpacing: '0.2em',
          marginTop: 8,
          padding: '0 12px',
          borderRadius: 12,
          border: '2px solid var(--muni-border, #e2e8f0)',
          direction: 'ltr',
          textAlign: 'center',
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
        onClick={onVerify}
        disabled={verifying || code.length !== 6}
      >
        {verifying ? 'מאמת…' : 'אמת והמשך'}
      </button>
      <button
        type="button"
        className="muni-event-btn muni-event-secondary"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
        disabled={verifying}
      >
        חזרה לשינוי מספר (שליחת קוד מחדש)
      </button>
    </div>
  )
}
