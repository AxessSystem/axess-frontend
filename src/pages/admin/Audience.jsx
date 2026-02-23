import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useDebounce } from '@/hooks/useDebounce'
import {
  Search, X, ChevronRight, ChevronLeft,
  User, Phone, Mail, Tag, Filter,
  Instagram, CheckCircle, Clock, Download,
} from 'lucide-react'

const PAGE_SIZE = 50
const STATUS_OPTIONS = [
  { value: 'all',     label: 'הכל',    cls: '' },
  { value: 'lead',    label: 'Lead',   cls: 'text-muted' },
  { value: 'buyer',   label: 'Buyer',  cls: 'text-blue-400' },
  { value: 'vip',     label: 'VIP',    cls: 'text-yellow-400' },
  { value: 'blocked', label: 'חסום',   cls: 'text-red-400' },
]

const STATUS_BADGE = {
  lead:    'badge-gray',
  buyer:   'badge-blue',
  vip:     'badge-yellow',
  blocked: 'badge-red',
}

const GENDER_LABEL = { male: 'זכר', female: 'נקבה', other: 'אחר', unknown: '—' }

// ─── User Drawer ────────────────────────────────────────────
function UserDrawer({ user, onClose }) {
  if (!user) return null
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'ללא שם'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed top-0 left-0 h-screen w-80 bg-surface-100 border-r border-border z-50 overflow-y-auto animate-slide-in-left shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-white">פרופיל משתמש</h3>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-wa flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-white">
                {(user.first_name || user.phone)?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-tight">{fullName}</p>
              <span className={`badge mt-1 ${STATUS_BADGE[user.status] || 'badge-gray'}`}>
                {user.status}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            <DetailRow icon={Phone} label="טלפון" value={user.phone} mono dir="ltr" />
            <DetailRow icon={Mail} label="אימייל" value={user.email} />
            <DetailRow icon={User} label="מגדר" value={GENDER_LABEL[user.gender] || '—'} />
            {user.date_of_birth && (
              <DetailRow icon={Clock} label="ת. לידה"
                value={new Date(user.date_of_birth).toLocaleDateString('he-IL')} />
            )}
            {user.instagram_url && (
              <DetailRow icon={Instagram} label="אינסטגרם" value={user.instagram_url} />
            )}
            {user.identification_number && (
              <DetailRow icon={User} label="ת.ז." value={user.identification_number} mono />
            )}
            {user.salesperson && (
              <DetailRow icon={User} label="איש מכירות" value={user.salesperson} />
            )}
          </div>

          {/* Auto approve */}
          {user.auto_approve && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-wa/10 border border-wa/20">
              <CheckCircle size={16} className="text-wa flex-shrink-0" />
              <p className="text-sm text-wa font-medium">אישור אוטומטי פעיל</p>
            </div>
          )}

          {/* Tags */}
          {user.user_tags?.length > 0 && (
            <div>
              <p className="text-xs text-muted mb-2 flex items-center gap-1.5">
                <Tag size={12} /> תגיות
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.user_tags.map((ut) => (
                  <span
                    key={ut.tags?.name}
                    className="text-xs px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: (ut.tags?.color || '#6366f1') + '20',
                      borderColor:     (ut.tags?.color || '#6366f1') + '40',
                      color:           ut.tags?.color || '#6366f1',
                    }}
                  >
                    {ut.tags?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted space-y-1 pt-2 border-t border-border">
            <p>נרשם: {user.created_at ? new Date(user.created_at).toLocaleString('he-IL') : '—'}</p>
            {user.last_seen_at && (
              <p>פעילות אחרונה: {new Date(user.last_seen_at).toLocaleString('he-IL')}</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function DetailRow({ icon: Icon, label, value, mono, dir }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-surface-300 flex items-center justify-center flex-shrink-0">
        <Icon size={13} className="text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p
          className={`text-sm text-white truncate ${mono ? 'font-mono' : ''}`}
          dir={dir}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Tag Filter Pill ─────────────────────────────────────────
function TagFilterBadge({ tag, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        text-xs px-2.5 py-1 rounded-full border transition-all
        ${selected
          ? 'ring-1'
          : 'opacity-60 hover:opacity-100'}
      `}
      style={{
        backgroundColor: (tag.color || '#6366f1') + (selected ? '30' : '15'),
        borderColor:     (tag.color || '#6366f1') + (selected ? '60' : '30'),
        color:           tag.color || '#6366f1',
        ringColor:       tag.color || '#6366f1',
      }}
    >
      {tag.name}
    </button>
  )
}

// ─── Pagination ──────────────────────────────────────────────
function Pagination({ page, total, onPrev, onNext, onGo }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null

  const from  = page * PAGE_SIZE + 1
  const to    = Math.min((page + 1) * PAGE_SIZE, total)

  // Build page windows: first, ...prev, cur, next..., last
  const pages = []
  const range = 2
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= range) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
      <p className="text-xs text-muted">
        מציג {from.toLocaleString('he-IL')}–{to.toLocaleString('he-IL')} מתוך{' '}
        <strong className="text-white">{total.toLocaleString('he-IL')}</strong> רשומות
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle
                     hover:text-white hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronRight size={15} />
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`e${idx}`} className="text-muted text-xs px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onGo(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                p === page
                  ? 'bg-wa/10 text-wa border border-wa/30'
                  : 'text-subtle hover:text-white hover:bg-surface-50'
              }`}
            >
              {p + 1}
            </button>
          )
        )}

        <button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-subtle
                     hover:text-white hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminAudience() {
  const [searchRaw, setSearchRaw] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTags, setSelectedTags] = useState([])   // array of tag IDs
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showTagFilter, setShowTagFilter] = useState(false)

  const search = useDebounce(searchRaw, 350)

  // Reset page when filters change
  const resetPage = useCallback(() => setPage(0), [])

  // Fetch all tags for filter
  const { data: allTags } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tags')
        .select('id, name, color')
        .order('name')
      return data || []
    },
    staleTime: Infinity,
  })

  // Main audience query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-audience', search, statusFilter, selectedTags, page],
    queryFn: async () => {
      let q = supabase
        .from('users')
        .select(
          `id, phone, first_name, last_name, email,
           status, gender, date_of_birth, age,
           instagram_url, identification_number,
           salesperson, auto_approve,
           created_at, last_seen_at,
           user_tags(tag_id, tags(id, name, color))`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (search.trim()) {
        q = q.or(
          `phone.ilike.%${search.trim()}%,` +
          `first_name.ilike.%${search.trim()}%,` +
          `last_name.ilike.%${search.trim()}%,` +
          `email.ilike.%${search.trim()}%,` +
          `identification_number.ilike.%${search.trim()}%`
        )
      }
      if (statusFilter !== 'all') {
        q = q.eq('status', statusFilter)
      }

      const { data, count, error } = await q
      if (error) throw error

      // Client-side tag filter (Supabase doesn't support nested WHERE on joins easily)
      let rows = data || []
      if (selectedTags.length > 0) {
        rows = rows.filter(u =>
          selectedTags.every(tagId =>
            u.user_tags?.some(ut => ut.tag_id === tagId)
          )
        )
      }

      return { rows, total: count || 0 }
    },
    placeholderData: prev => prev,
  })

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    )
    resetPage()
  }

  const clearFilters = () => {
    setSearchRaw('')
    setStatusFilter('all')
    setSelectedTags([])
    setPage(0)
  }

  const hasActiveFilters = searchRaw || statusFilter !== 'all' || selectedTags.length > 0

  return (
    <div className="animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-black text-white">ניהול קהל</h1>
          <p className="text-muted text-sm mt-0.5">
            {isFetching && !isLoading && (
              <span className="inline-block w-2 h-2 bg-wa rounded-full animate-pulse ml-1.5" />
            )}
            {data?.total != null
              ? `${data.total.toLocaleString('he-IL')} רשומות`
              : 'טוען...'}
          </p>
        </div>
        <button className="btn-secondary text-sm">
          <Download size={14} /> ייצוא CSV
        </button>
      </div>

      {/* Search + Status filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, טלפון, אימייל, ת.ז..."
            value={searchRaw}
            onChange={(e) => { setSearchRaw(e.target.value); resetPage() }}
            className="input pr-9"
          />
          {searchRaw && (
            <button
              onClick={() => { setSearchRaw(''); resetPage() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map(({ value, label, cls }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); resetPage() }}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                statusFilter === value
                  ? 'bg-wa/10 text-wa border-wa/30'
                  : `bg-surface-100 border-border hover:border-border-light ${cls || 'text-muted'}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tag filter toggle */}
        <button
          onClick={() => setShowTagFilter(!showTagFilter)}
          className={`btn-secondary text-sm relative ${showTagFilter ? 'border-wa/30 text-wa' : ''}`}
        >
          <Filter size={14} />
          תגיות
          {selectedTags.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-wa text-white text-[10px] flex items-center justify-center font-bold">
              {selectedTags.length}
            </span>
          )}
        </button>

        {/* Clear all */}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-ghost text-sm text-red-400 hover:text-red-300">
            <X size={14} /> נקה הכל
          </button>
        )}
      </div>

      {/* Tag filter panel */}
      {showTagFilter && allTags?.length > 0 && (
        <div className="card mb-3 animate-slide-up p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white flex items-center gap-1.5">
              <Tag size={14} className="text-muted" />
              סנן לפי תגיות
            </p>
            {selectedTags.length > 0 && (
              <button
                onClick={() => { setSelectedTags([]); resetPage() }}
                className="text-xs text-muted hover:text-white"
              >
                נקה תגיות
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <TagFilterBadge
                key={tag.id}
                tag={tag}
                selected={selectedTags.includes(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-300">
                <th className="table-th">שם</th>
                <th className="table-th">טלפון</th>
                <th className="table-th">אימייל</th>
                <th className="table-th hidden lg:table-cell">מגדר</th>
                <th className="table-th">סטטוס</th>
                <th className="table-th">תגיות</th>
                <th className="table-th hidden xl:table-cell">נרשם</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="table-td">
                          <div className="h-4 bg-surface-50 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.rows?.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="text-muted" />
                          <p className="text-white font-medium">לא נמצאו תוצאות</p>
                          <p className="text-muted text-sm">נסה לשנות את מונחי החיפוש</p>
                          {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn-secondary text-xs mt-2">
                              נקה פילטרים
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                : data?.rows?.map((u) => {
                    const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'
                    return (
                      <tr
                        key={u.id}
                        className="table-row cursor-pointer"
                        onClick={() => setSelectedUser(u)}
                      >
                        {/* Name */}
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-surface-50 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white">
                              {(u.first_name || u.phone)?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium leading-tight">
                                {name}
                              </p>
                              {u.auto_approve && (
                                <p className="text-[10px] text-wa flex items-center gap-0.5">
                                  <CheckCircle size={9} /> אוטו
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="table-td">
                          <span className="font-mono text-sm" dir="ltr">{u.phone}</span>
                        </td>

                        {/* Email */}
                        <td className="table-td text-subtle">
                          {u.email
                            ? <span className="truncate max-w-[180px] block">{u.email}</span>
                            : <span className="text-muted">—</span>}
                        </td>

                        {/* Gender */}
                        <td className="table-td hidden lg:table-cell">
                          {GENDER_LABEL[u.gender] || '—'}
                        </td>

                        {/* Status */}
                        <td className="table-td">
                          <span className={`badge ${STATUS_BADGE[u.status] || 'badge-gray'}`}>
                            {u.status}
                          </span>
                        </td>

                        {/* Tags */}
                        <td className="table-td">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {u.user_tags?.slice(0, 3).map((ut) => (
                              <span
                                key={ut.tags?.id}
                                className="text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap"
                                style={{
                                  backgroundColor: (ut.tags?.color || '#6366f1') + '20',
                                  borderColor:     (ut.tags?.color || '#6366f1') + '40',
                                  color:           ut.tags?.color || '#6366f1',
                                }}
                              >
                                {ut.tags?.name}
                              </span>
                            ))}
                            {(u.user_tags?.length || 0) > 3 && (
                              <span className="text-[10px] text-muted bg-surface-50 px-1.5 py-0.5 rounded-full border border-border">
                                +{u.user_tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="table-td hidden xl:table-cell tabular-nums">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('he-IL')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          total={data?.total || 0}
          onPrev={() => setPage(p => Math.max(0, p - 1))}
          onNext={() => setPage(p => p + 1)}
          onGo={setPage}
        />
      </div>

      {/* User Detail Drawer */}
      <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  )
}
