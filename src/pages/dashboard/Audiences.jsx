import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Filter, Users, Phone, Tag, ChevronDown } from 'lucide-react'
import EngagementScore from '@/components/ui/EngagementScore'
import EmptyState from '@/components/ui/EmptyState'

const MOCK_RECIPIENTS = [
  { id: 1,  name: 'דני כהן',      phone: '050-1234567', tags: ['לקוח קבוע', 'VIP'], score: 85, campaigns: 12, lastSeen: '28/02/2026' },
  { id: 2,  name: 'מיכל לוי',     phone: '052-9876543', tags: ['חדש'],               score: 42, campaigns: 2,  lastSeen: '15/02/2026' },
  { id: 3,  name: 'יוסי ברק',     phone: '054-5555555', tags: ['VIP'],               score: 96, campaigns: 28, lastSeen: '01/03/2026' },
  { id: 4,  name: 'שרה גולן',     phone: '058-1111222', tags: ['לקוח קבוע'],        score: 71, campaigns: 8,  lastSeen: '25/02/2026' },
  { id: 5,  name: 'אבי שמיר',     phone: '050-7777888', tags: ['חדש'],               score: 28, campaigns: 1,  lastSeen: '10/02/2026' },
  { id: 6,  name: 'רחל אברהם',    phone: '052-3334455', tags: ['VIP', 'לקוח קבוע'], score: 91, campaigns: 19, lastSeen: '27/02/2026' },
  { id: 7,  name: 'משה כץ',       phone: '054-2223344', tags: ['לקוח קבוע'],        score: 63, campaigns: 6,  lastSeen: '20/02/2026' },
  { id: 8,  name: 'לאה פרידמן',   phone: '058-9998877', tags: ['חדש'],               score: 55, campaigns: 3,  lastSeen: '18/02/2026' },
  { id: 9,  name: 'ניר שפירא',    phone: '050-4445566', tags: ['VIP'],               score: 88, campaigns: 15, lastSeen: '28/02/2026' },
  { id: 10, name: 'תמר הרוש',     phone: '052-7776655', tags: ['לקוח קבוע'],        score: 74, campaigns: 9,  lastSeen: '22/02/2026' },
]

const ALL_TAGS = ['הכל', 'VIP', 'לקוח קבוע', 'חדש']

export default function Audiences() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('הכל')
  const [sortBy, setSortBy] = useState('score')

  const filtered = MOCK_RECIPIENTS
    .filter(r => {
      const matchSearch = r.name.includes(search) || r.phone.includes(search)
      const matchTag = activeTag === 'הכל' || r.tags.includes(activeTag)
      return matchSearch && matchTag
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score
      if (sortBy === 'campaigns') return b.campaigns - a.campaigns
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'he')
      return 0
    })

  const handleExport = () => {
    const csv = [
      'שם,טלפון,תגיות,ציון,קמפיינים',
      ...filtered.map(r => `${r.name},${r.phone},"${r.tags.join(', ')}",${r.score},${r.campaigns}`)
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'קהל_axess.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            קהלים
          </h1>
          <p className="text-muted text-sm mt-0.5">{MOCK_RECIPIENTS.length} אנשי קשר</p>
        </div>
        <button onClick={handleExport} className="btn-secondary gap-2">
          <Download size={16} />
          ייצוא CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'סה"כ אנשי קשר', value: MOCK_RECIPIENTS.length, icon: Users, color: 'text-primary' },
          { label: 'VIP', value: MOCK_RECIPIENTS.filter(r => r.tags.includes('VIP')).length, icon: Tag, color: 'text-yellow-400' },
          { label: 'ממוצע ציון', value: Math.round(MOCK_RECIPIENTS.reduce((s, r) => s + r.score, 0) / MOCK_RECIPIENTS.length), icon: Phone, color: 'text-accent' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon size={20} className={`${color} mx-auto mb-2`} />
            <div className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</div>
            <div className="text-xs text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-muted" />
          <input
            className="input pr-9"
            placeholder="חפש לפי שם או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTag === tag
                  ? 'bg-primary text-white'
                  : 'bg-surface-50 text-subtle border border-border hover:border-border-light'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <select
          className="input w-auto"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="score">מיין: ציון</option>
          <option value="campaigns">מיין: קמפיינים</option>
          <option value="name">מיין: שם</option>
        </select>
      </div>

      {/* Recipients grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="לא נמצאו אנשי קשר"
          description="נסה לשנות את מונחי החיפוש או הסנן"
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card hover:border-border-light transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{r.name.charAt(0)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white truncate">{r.name}</div>
                    <EngagementScore score={r.score} size={40} />
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                    <Phone size={11} />
                    {r.phone}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.tags.map(tag => (
                      <span
                        key={tag}
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          tag === 'VIP'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : tag === 'לקוח קבוע'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-surface-50 text-subtle border border-border'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted">
                      {r.campaigns} קמפיינים
                    </div>
                    <div className="text-xs text-muted">
                      {r.lastSeen}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
