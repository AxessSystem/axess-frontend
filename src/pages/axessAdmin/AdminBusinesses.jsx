import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, MoreVertical, Eye, Edit, BarChart2, AlertTriangle, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

export default function AdminBusinesses() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)

  const [newBizName, setNewBizName] = useState('')
  const [newBizType, setNewBizType] = useState('')
  const [newBizPhone, setNewBizPhone] = useState('')
  const [newBizSender, setNewBizSender] = useState('')

  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editType, setEditType] = useState('')
  const [editStatus, setEditStatus] = useState('')

  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('owner')

  const [resetEmail, setResetEmail] = useState('')

  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const { data: bizData, refetch } = useQuery({
    queryKey: ['axess-admin-businesses', search, type, status, session?.access_token],
    queryFn: () => {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (type) q.set('type', type)
      if (status) q.set('status', status)
      return fetch(`${API_BASE}/api/admin/businesses?${q}`, { headers }).then(r => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      })
    },
    enabled: !!session?.access_token,
  })

  const businesses = bizData?.businesses || []

  const handleMenuOpen = (e, bizId) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    })
    setMenuOpen(menuOpen === bizId ? null : bizId)
  }

  const handleOpenCreate = () => {
    setNewBizName('')
    setNewBizType('')
    setNewBizPhone('')
    setNewBizSender('')
    setShowCreateModal(true)
  }

  const handleOpenEdit = (biz) => {
    setSelectedBusiness(biz)
    setEditName(biz.name || '')
    setEditSlug(biz.slug || '')
    setEditType(biz.business_type || '')
    setEditStatus(biz.status || '')
    setShowEditModal(true)
    setMenuOpen(null)
  }

  const handleOpenAddMember = (biz) => {
    setSelectedBusiness(biz)
    setMemberEmail('')
    setMemberRole('owner')
    setShowAddMemberModal(true)
    setMenuOpen(null)
  }

  const handleOpenResetPassword = (biz) => {
    setSelectedBusiness(biz)
    setResetEmail('')
    setShowResetPasswordModal(true)
    setMenuOpen(null)
  }

  const handleCreateBusiness = async (e) => {
    e.preventDefault()
    if (!newBizName) {
      toast.error('שם עסק חובה')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/businesses/create`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBizName,
          business_type: newBizType || null,
          phone: newBizPhone || null,
          sender_name: newBizSender || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'שגיאה ביצירת עסק')
      }
      await res.json()
      toast.success('העסק נוצר בהצלחה')
      setShowCreateModal(false)
      refetch()
    } catch (err) {
      toast.error(err.message || 'שגיאה ביצירת עסק')
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!selectedBusiness) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/businesses/${selectedBusiness.id}/edit`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName || null,
          slug: editSlug || null,
          business_type: editType || null,
          status: editStatus || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'שגיאה בעריכת עסק')
      }
      await res.json()
      toast.success('פרטי העסק עודכנו')
      setShowEditModal(false)
      refetch()
    } catch (err) {
      toast.error(err.message || 'שגיאה בעריכת עסק')
    }
  }

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBusiness) return
    if (!memberEmail) {
      toast.error('מייל חובה')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/businesses/${selectedBusiness.id}/add-member`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: memberEmail,
          role: memberRole || 'owner',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בהוספת משתמש')
      }
      toast.success('המשתמש נוסף לעסק')
      setShowAddMemberModal(false)
      refetch()
    } catch (err) {
      toast.error(err.message || 'שגיאה בהוספת משתמש')
    }
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    const email = resetEmail.trim()
    if (!email) {
      toast.error('מייל חובה')
      return
    }
    try {
      // Endpoint לא משתמש בפועל ב-id, אז נעביר placeholder
      const res = await fetch(`${API_BASE}/api/admin/users/by-email/reset-password`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בשליחת reset password')
      }
      toast.success('קישור reset נשלח למייל')
      setShowResetPasswordModal(false)
    } catch (err) {
      toast.error(err.message || 'שגיאה בשליחת reset password')
    }
  }

  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null)
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleImpersonate = (biz) => {
    if (!confirm(`להיכנס כ-${biz.name}?`)) return
    try {
      sessionStorage.setItem(
        'axess_impersonate',
        JSON.stringify({
          business: {
            id: biz.id,
            name: biz.name,
          },
        })
      )
      window.location.href = '/dashboard'
      toast.success(`מצב Impersonation — ${biz.name}`)
    } catch (e) {
      console.error('impersonate error', e)
      toast.error(e.message || 'שגיאה')
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: '100%', padding: isMobile ? 12 : 24 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 24 }}>ניהול עסקים</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={handleOpenCreate}
          style={{
            padding: '10px 14px',
            borderRadius: 999,
            border: '1px solid var(--glass-border)',
            background: 'var(--v2-primary)',
            color: '#000',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          צור עסק חדש
        </button>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--v2-gray-400)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם/טלפון"
            style={{
              width: '100%',
              padding: '10px 40px 10px 12px',
              background: 'var(--v2-dark-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
            }}
          />
        </div>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ padding: '10px 12px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', fontSize: 14 }}
        >
          <option value="">סוג עסק</option>
          <option value="club">מועדון</option>
          <option value="restaurant">מסעדה</option>
          <option value="municipal">רשות</option>
          <option value="general">כללי</option>
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{ padding: '10px 12px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', fontSize: 14 }}
        >
          <option value="">סטטוס</option>
          <option value="active">פעיל</option>
          <option value="trial">ניסיון</option>
          <option value="suspended">מושעה</option>
        </select>
      </div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {businesses.map(b => (
            <div
              key={b.id}
              style={{
                background: 'var(--v2-dark-2)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{b.name || '—'}</div>
                <button
                  onClick={(e) => handleMenuOpen(e, b.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>
                <span style={{ background: 'var(--v2-dark-3)', padding: '4px 8px', borderRadius: 6 }}>
                  {b.business_type || '—'}
                </span>
                <span>חברים: {b.member_count ?? 0}</span>
                <span>אירועים: {b.event_count ?? 0}</span>
                <span>נרשם: {b.created_at ? new Date(b.created_at).toLocaleDateString('he-IL') : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                  background: b.status === 'active' ? 'rgba(0,195,122,0.2)' : b.status === 'suspended' ? 'rgba(220,38,38,0.2)' : 'var(--v2-dark-3)',
                  color: b.status === 'active' ? 'var(--v2-primary)' : b.status === 'suspended' ? '#ef4444' : 'var(--v2-gray-400)',
                }}>
                  {b.status || '—'}
                </span>
              </div>
              {menuOpen === b.id && (
                <div style={{
                  position: 'fixed',
                  top: menuPosition.top,
                  right: menuPosition.right,
                  zIndex: 9999,
                  background: 'var(--card)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 160,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  <button onClick={() => { handleImpersonate(b); setMenuOpen(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                    <Eye size={14} /> כנס כ-{b.name}
                  </button>
                  <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                    <Edit size={14} /> ערוך פרטים
                  </button>
                  <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                    <BarChart2 size={14} /> סטטיסטיקות
                  </button>
                  <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                    <AlertTriangle size={14} /> השעה
                  </button>
                  <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                    <Trash2 size={14} /> מחק
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden', maxWidth: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>שם</th>
                <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>סוג</th>
                <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>תוכנית</th>
                <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>חברים</th>
                <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>אירועים</th>
                <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>נרשם</th>
                <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>סטטוס</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {businesses.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: 12, color: '#fff', fontSize: 14 }}>{b.name || '—'}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ background: 'var(--v2-dark-3)', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: 'var(--v2-gray-400)' }}>{b.business_type || '—'}</span>
                  </td>
                  <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>—</td>
                  <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{b.member_count ?? 0}</td>
                  <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{b.event_count ?? 0}</td>
                  <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{b.created_at ? new Date(b.created_at).toLocaleDateString('he-IL') : '—'}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      background: b.status === 'active' ? 'rgba(0,195,122,0.2)' : b.status === 'suspended' ? 'rgba(220,38,38,0.2)' : 'var(--v2-dark-3)',
                      color: b.status === 'active' ? 'var(--v2-primary)' : b.status === 'suspended' ? '#ef4444' : 'var(--v2-gray-400)',
                    }}>
                      {b.status || '—'}
                    </span>
                  </td>
                  <td style={{ padding: 8, position: 'relative' }}>
                    <button
                      onClick={(e) => handleMenuOpen(e, b.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen === b.id && (
                      <div style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        right: menuPosition.right,
                        zIndex: 9999,
                        background: 'var(--card)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 8,
                        padding: 4,
                        minWidth: 160,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}>
                        <button onClick={() => { handleImpersonate(b); setMenuOpen(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                          <Eye size={14} /> כנס כ-{b.name}
                        </button>
                        <button onClick={() => handleOpenEdit(b)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                          <Edit size={14} /> ערוך פרטים
                        </button>
                        <button onClick={() => handleOpenAddMember(b)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                          <BarChart2 size={14} /> הוסף משתמש
                        </button>
                        <button onClick={() => handleOpenResetPassword(b)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                          <AlertTriangle size={14} /> Reset Password
                        </button>
                        <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                          <Trash2 size={14} /> מחק
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Business Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              padding: 20,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <h2 style={{ marginBottom: 12, color: '#fff', fontSize: 18 }}>צור עסק חדש</h2>
            <form onSubmit={handleCreateBusiness} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>שם עסק</label>
                <input
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>סוג עסק</label>
                <select
                  value={newBizType}
                  onChange={(e) => setNewBizType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  <option value="">בחר סוג</option>
                  <option value="restaurant">מסעדה</option>
                  <option value="hotel">מלון</option>
                  <option value="retail">חנויות / Retail</option>
                  <option value="event">אולם אירועים / אירוע</option>
                  <option value="gym">חדר כושר / סטודיו</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>טלפון</label>
                <input
                  value={newBizPhone}
                  onChange={(e) => setNewBizPhone(e.target.value)}
                  placeholder="לדוגמה: 0501234567"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>שם שולח SMS</label>
                <input
                  value={newBizSender}
                  onChange={(e) => setNewBizSender(e.target.value)}
                  placeholder="שם שיופיע כשולח ב-SMS"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--v2-primary)',
                    color: '#000',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  שמור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Business Modal */}
      {showEditModal && selectedBusiness && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              padding: 20,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <h2 style={{ marginBottom: 12, color: '#fff', fontSize: 18 }}>ערוך פרטי עסק</h2>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>שם</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>Slug</label>
                <input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>סוג עסק</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  <option value="">בחר סוג</option>
                  <option value="restaurant">מסעדה</option>
                  <option value="hotel">מלון</option>
                  <option value="retail">חנויות / Retail</option>
                  <option value="event">אולם אירועים / אירוע</option>
                  <option value="gym">חדר כושר / סטודיו</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>סטטוס</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  <option value="">ללא שינוי</option>
                  <option value="active">פעיל</option>
                  <option value="trial">ניסיון</option>
                  <option value="suspended">מושעה</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--v2-primary)',
                    color: '#000',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  שמור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedBusiness && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              padding: 20,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <h2 style={{ marginBottom: 12, color: '#fff', fontSize: 18 }}>הוסף משתמש לעסק</h2>
            <p style={{ marginBottom: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>
              {selectedBusiness.name}
            </p>
            <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>מייל משתמש</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>תפקיד</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--v2-primary)',
                    color: '#000',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  שמור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedBusiness && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              padding: 20,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <h2 style={{ marginBottom: 12, color: '#fff', fontSize: 18 }}>Reset Password לבעלים</h2>
            <p style={{ marginBottom: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>
              {selectedBusiness.name}
            </p>
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--v2-gray-300)' }}>מייל בעלים</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="owner@example.com"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--v2-primary)',
                    color: '#000',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  שלח קישור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
