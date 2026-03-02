import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary', loading = false }) {
  const iconColor = 'var(--v2-primary)'
  const iconBg = 'rgba(0,195,122,0.12)'

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--v2-dark-3)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ width: 60, height: 20, borderRadius: 9999, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ width: 90, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
        <div style={{ width: 120, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--v2-dark-3)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--v2-primary)'
        e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {Icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} style={{ color: iconColor }} />
          </div>
        )}
        {trend !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: trend > 0 ? 'var(--v2-primary)' : trend < 0 ? '#F87171' : 'var(--v2-gray-400)',
            }}
          >
            {trend > 0 ? <TrendingUp size={13} /> : trend < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
            {trendValue || `${Math.abs(trend)}%`}
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontFamily: "'Bricolage Grotesque', 'Outfit', monospace",
            fontWeight: 800,
            fontSize: 28,
            color: '#ffffff',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', marginTop: 6 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 3 }}>{subtitle}</div>}
      </div>
    </div>
  )
}
