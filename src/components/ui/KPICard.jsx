import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary', loading = false }) {
  const colors = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
    success: { bg: 'bg-accent/10', text: 'text-accent', icon: 'text-accent' },
    warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: 'text-yellow-400' },
    danger: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'text-red-400' },
  }

  const c = colors[color] || colors.primary

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-surface-50" />
          <div className="w-16 h-5 rounded-full bg-surface-50" />
        </div>
        <div className="w-24 h-8 rounded-lg bg-surface-50 mb-2" />
        <div className="w-32 h-4 rounded bg-surface-50" />
      </div>
    )
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon size={20} className={c.icon} />
          </div>
        )}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? 'text-accent' : trend < 0 ? 'text-red-400' : 'text-muted'
          }`}>
            {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {trendValue || `${Math.abs(trend)}%`}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {value}
        </div>
        <div className="text-sm font-medium text-subtle mt-0.5">{title}</div>
        {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
      </div>
    </div>
  )
}
