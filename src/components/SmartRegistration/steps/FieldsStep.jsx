function tierLabel(event) {
  const c = event?.city_name || event?.city_code || 'העיר'
  return { resident: `תושב/ת ${c}`, visitor: 'אורח/ת (מחוץ לעיר)' }
}

export default function FieldsStep({
  event,
  ticketTypes,
  ticketTypeId,
  quantity,
  onTicketChange,
  onQuantityChange,
  customFields,
  onCustomFieldChange,
  idNumber,
  onIdNumberChange,
  pricingTier,
  onPricingTierChange,
  onNext,
  disabled,
}) {
  const regFields = Array.isArray(event?.registration_fields) ? event.registration_fields : []
  const requiresId = event?.requires_id === true
  const cityCode = event?.city_code
  const labels = tierLabel(event)

  return (
    <div style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800 }}>פרטי הרשמה</h3>

      <label htmlFor="sr-ticket" style={{ display: 'block', fontWeight: 700 }}>
        סוג כניסה
      </label>
      <select
        id="sr-ticket"
        value={ticketTypeId || ''}
        onChange={(e) => onTicketChange(e.target.value ? Number(e.target.value) : '')}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: 48,
          fontSize: '1.1rem',
          marginTop: 8,
          padding: '0 12px',
          borderRadius: 12,
          border: '2px solid var(--muni-border, #e2e8f0)',
        }}
      >
        <option value="">בחרו…</option>
        {ticketTypes.map((tt) => (
          <option key={tt.id} value={tt.id}>
            {tt.name} — ₪{Number(tt.price || 0).toFixed(0)}
          </option>
        ))}
      </select>

      <label htmlFor="sr-qty" style={{ display: 'block', marginTop: 16, fontWeight: 700 }}>
        כמות
      </label>
      <input
        id="sr-qty"
        type="number"
        min={1}
        max={10}
        value={quantity}
        onChange={(e) => onQuantityChange(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: 48,
          fontSize: '1.1rem',
          marginTop: 8,
          padding: '0 12px',
          borderRadius: 12,
          border: '2px solid var(--muni-border, #e2e8f0)',
        }}
      />

      {cityCode && (
        <fieldset style={{ marginTop: 16, border: 'none', padding: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: 8 }}>מחירון</legend>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <input
              type="radio"
              name="sr-tier"
              checked={pricingTier === 'resident'}
              onChange={() => onPricingTierChange('resident')}
              disabled={disabled}
            />
            {labels.resident}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="radio"
              name="sr-tier"
              checked={pricingTier === 'visitor'}
              onChange={() => onPricingTierChange('visitor')}
              disabled={disabled}
            />
            {labels.visitor}
          </label>
        </fieldset>
      )}

      {regFields.map((f) => (
        <div key={f.id} style={{ marginTop: 16 }}>
          <label htmlFor={`sr-cf-${f.id}`} style={{ display: 'block', fontWeight: 700 }}>
            {f.label}
            {f.required ? ' *' : ''}
          </label>
          <input
            id={`sr-cf-${f.id}`}
            type="text"
            value={customFields[f.id] ?? ''}
            onChange={(e) => onCustomFieldChange(f.id, e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              minHeight: 44,
              fontSize: '1.05rem',
              marginTop: 6,
              padding: '0 12px',
              borderRadius: 12,
              border: '2px solid var(--muni-border, #e2e8f0)',
            }}
          />
        </div>
      ))}

      {requiresId && (
        <div style={{ marginTop: 16 }}>
          <label htmlFor="sr-id" style={{ display: 'block', fontWeight: 700 }}>
            תעודת זהות (9 ספרות) *
          </label>
          <input
            id="sr-id"
            inputMode="numeric"
            maxLength={9}
            value={idNumber}
            onChange={(e) => onIdNumberChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
            disabled={disabled}
            style={{
              width: '100%',
              minHeight: 44,
              fontSize: '1.05rem',
              marginTop: 6,
              padding: '0 12px',
              borderRadius: 12,
              border: '2px solid var(--muni-border, #e2e8f0)',
              direction: 'ltr',
              textAlign: 'right',
            }}
          />
        </div>
      )}

      <button type="button" className="muni-event-btn" style={{ width: '100%', marginTop: 24 }} onClick={onNext} disabled={disabled}>
        המשך לאישור
      </button>
    </div>
  )
}
