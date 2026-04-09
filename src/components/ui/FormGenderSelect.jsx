export default function FormGenderSelect({ value, onChange, required, error, label = 'מין' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p
        style={{
          fontSize: 12,
          color: 'var(--v2-gray-400)',
          textAlign: 'right',
          margin: '0 0 8px',
        }}
      >
        {label}
        {required ? ' *' : ''}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        {['זכר', 'נקבה', 'אחר'].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            style={{
              flex: 1,
              minHeight: 44,
              padding: '10px 0',
              borderRadius: 10,
              border: `2px solid ${value === g ? '#00C37A' : error ? '#ff4444' : 'var(--glass-border)'}`,
              background: value === g ? 'rgba(0,195,122,0.1)' : 'var(--glass)',
              color: value === g ? '#00C37A' : 'var(--text)',
              fontSize: 15,
              cursor: 'pointer',
              fontWeight: value === g ? 700 : 400,
              transition: 'all 0.2s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {g}
          </button>
        ))}
      </div>
      {error && (
        <p style={{ margin: '4px 4px 0', fontSize: 12, lineHeight: 1.4, color: '#ff4444', textAlign: 'right' }}>
          {error}
        </p>
      )}
    </div>
  )
}
