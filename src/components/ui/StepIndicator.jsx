import { Check } from 'lucide-react'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflowX: 'auto', paddingBottom: 8 }}>
      {steps.map((step, i) => {
        const idx = i + 1
        const isCompleted = idx < currentStep
        const isActive = idx === currentStep
        const isLast = i === steps.length - 1

        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {/* Step circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  background: isCompleted
                    ? 'rgba(0,195,122,0.6)'
                    : isActive
                    ? 'var(--v2-primary)'
                    : 'var(--glass-bg)',
                  color: isCompleted || isActive ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                  border: isActive
                    ? 'none'
                    : isCompleted
                    ? 'none'
                    : '1px solid var(--glass-border)',
                  boxShadow: isActive ? 'var(--shadow-glow-green)' : 'none',
                }}
              >
                {isCompleted ? <Check size={16} /> : idx}
              </div>
              <div
                className="hidden sm:block"
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  color: isActive ? '#ffffff' : isCompleted ? 'var(--v2-primary)' : 'var(--v2-gray-400)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {step}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: '0 8px',
                  background: isCompleted ? 'var(--v2-primary)' : 'var(--glass-border)',
                  transition: 'background 0.3s ease',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
