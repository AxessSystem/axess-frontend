import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import {
  Building2, Calendar, MessageSquare, DollarSign,
  Users, AlertTriangle, AlertCircle, TrendingUp
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'


function KPICard({ icon: Icon, label, value, color = 'primary' }) {
  const colors = {
    primary: { bg: 'rgba(0,195,122,0.15)', border: 'rgba(0,195,122,0.3)' },
    blue: { bg: 'rgba(37,99,235,0.15)', border: 'rgba(37,99,235,0.3)' },
    yellow: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)' },
    red: { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)' },
  }
  const c = colors[color] || colors.primary
  return (
    <div style={{
      background: 'var(--v2-dark-2)',
      border: '1px solid var(--glass-border)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} style={{ color: c.border }} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{value ?? '—'}</div>
        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function AdminOverview() {
  const { session } = useAuth()
  const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { data } = useQuery({
    queryKey: ['axess-admin-overview', session?.access_token],
    queryFn: () => fetch(`${API_BASE}/api/axess-admin/overview`, { headers }).then(r => {
      if (!r.ok) throw new Error('Unauthorized')
      return r.json()
    }),
    enabled: !!session?.access_token,
  })

  const b = data?.businesses || {}
  const e = data?.events || {}
  const s = data?.sms || {}
  const u = data?.users || {}
  const r = data?.revenue || {}

  const { data: stats } = useQuery({
    queryKey: ['axess-admin-overview-stats', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/overview-stats`, { headers }).then(r => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const chartBiz = (data?.chart_businesses || []).length
    ? data.chart_businesses
    : Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (11 - i))
        return { month: d.toLocaleDateString('he-IL', { month: 'short' }), count: 0 }
      })
  const chartSms = (data?.chart_sms || []).length
    ? data.chart_sms
    : Array.from({ length: 30 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        return { day: d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }), sent: 0 }
      })

  const recentBiz = data?.recent_businesses || []

  return (
    <div dir="rtl" style={{ maxWidth: '100%', margin: '0 auto', padding: isMobile ? '12px 12px 24px' : '16px 24px 32px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 26, color: '#fff' }}>AXESS Admin</h1>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>{today}</p>
        </div>
      </div>

      <div
        style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KPICard icon={Building2} label="עסקים פעילים" value={stats?.businesses_active?.toLocaleString?.('he-IL')} color="primary" />
        <KPICard icon={Calendar} label="עסקים חדשים החודש" value={stats?.new_businesses_month?.toLocaleString?.('he-IL')} color="blue" />
        <KPICard icon={MessageSquare} label="SMS שנשלחו היום" value={stats?.sms_today?.toLocaleString?.('he-IL')} color="primary" />
        <KPICard icon={DollarSign} label="הכנסה מהזמנות החודש" value={stats ? `₪${Number(stats.revenue_month || 0).toLocaleString('he-IL')}` : '—'} color="primary" />
      </div>

      <div
        style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <KPICard icon={Users} label="סך נמענים" value={stats?.total_recipients?.toLocaleString?.('he-IL')} />
        <KPICard icon={AlertTriangle} label="SMS החודש" value={stats?.sms_month?.toLocaleString?.('he-IL')} color="yellow" />
        <KPICard icon={AlertCircle} label="WhatsApp היום" value={stats?.wa_today?.toLocaleString?.('he-IL')} color="red" />
        <KPICard icon={TrendingUp} label="MRR (עסקים פעילים)" value={stats ? `₪${Number(stats.mrr || 0).toLocaleString('he-IL')}` : '—'} />
      </div>

      <div
        style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>עסקים חדשים לפי חודש</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartBiz}>
                <XAxis dataKey="month" stroke="var(--v2-gray-400)" fontSize={11} />
                <YAxis stroke="var(--v2-gray-400)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--v2-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>SMS שנשלחו לפי יום (30 יום)</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSms}>
                <XAxis dataKey="day" stroke="var(--v2-gray-400)" fontSize={11} />
                <YAxis stroke="var(--v2-gray-400)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                <Bar dataKey="sent" fill="#2563EB" radius={[4, 4, 0, 0]} name="נשלחו" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>עסקים אחרונים (5)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>שם</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>סוג</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>תוכנית</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>נרשם</th>
            </tr>
          </thead>
          <tbody>
            {(recentBiz.length ? recentBiz : []).slice(0, 5).map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '10px 12px', color: '#fff', fontSize: 14 }}>{row.name || '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: 'var(--v2-dark-3)', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: 'var(--v2-gray-400)' }}>{row.business_type || '—'}</span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--v2-gray-400)', fontSize: 13 }}>—</td>
                <td style={{ padding: '10px 12px', color: 'var(--v2-gray-400)', fontSize: 13 }}>{row.created_at ? new Date(row.created_at).toLocaleDateString('he-IL') : '—'}</td>
              </tr>
            ))}
            {(!recentBiz || recentBiz.length === 0) && (
              <tr>
                <td colSpan={4} style={{ padding: 24, color: 'var(--v2-gray-400)', textAlign: 'center' }}>אין עסקים</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
