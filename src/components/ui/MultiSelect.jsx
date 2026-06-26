export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  label,
  required = false,
}) {
  const selected = Array.isArray(value) ? value : []

  const toggle = (optValue) => {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue))
    } else {
      onChange([...selected, optValue])
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: '#fff',
          }}
        >
          {label}
          {required && <span style={{ color: '#EF4444' }}> *</span>}
        </div>
      )}
      <div
        dir="rtl"
        style={{
          background: 'var(--v2-dark-3)',
          border: '1px solid var(--v2-gray-200)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        {options.map((opt, i) => {
          const checked = selected.includes(opt.value)
          const isLast = i === options.length - 1
          return (
            <label
              key={String(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: isLast ? 'none' : '1px solid var(--v2-gray-200)',
                background: checked ? 'rgba(0,195,122,0.08)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: checked ? '#fff' : 'var(--v2-gray-400)',
                  lineHeight: 1.5,
                }}
              >
                {opt.label}
              </span>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: `2px solid ${checked ? '#00C37A' : 'var(--v2-gray-400)'}`,
                  background: checked ? '#00C37A' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {checked && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}
