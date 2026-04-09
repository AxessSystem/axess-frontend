export default function FormField({
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error,
  isValid,
  required,
  ...props
}) {
  return (
    <div style={{ marginBottom: 12, position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: 48,
            padding: '12px 40px 12px 16px',
            borderRadius: 10,
            background: 'var(--glass)',
            border: `1px solid ${error ? '#ff4444' : isValid ? '#00C37A' : 'var(--glass-border)'}`,
            color: 'var(--text)',
            fontSize: 16,
            textAlign: 'right',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s',
            WebkitAppearance: 'none',
          }}
          {...props}
        />
        {(isValid || error) && (
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: error ? '#ff4444' : '#00C37A',
              pointerEvents: 'none',
            }}
          >
            {error ? '✗' : '✓'}
          </span>
        )}
      </div>
      {error && (
        <p
          style={{
            margin: '4px 4px 0',
            fontSize: 12,
            lineHeight: 1.4,
            color: '#ff4444',
            textAlign: 'right',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
