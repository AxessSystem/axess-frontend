import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

export default function ExportButton({ businessId, segment = 'all', label = 'ייצוא' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const download = async (format) => {
    if (!businessId) return
    setOpen(false)
    const url = `${API_BASE}/api/admin/export/audiences?business_id=${encodeURIComponent(businessId)}&format=${format}&segment=${encodeURIComponent(segment)}`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      const blob = await res.blob()
      const name = res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)/)?.[1] || `audience_${segment}_${Date.now()}.${format}`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      console.error(err)
      alert(err.message || 'שגיאה בייצוא')
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)', color: '#fff', fontWeight: 600, cursor: 'pointer',
        }}
      >
        <Download size={16} />
        {label}
        <ChevronDown size={16} style={{ opacity: open ? 1 : 0.7 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8, minWidth: 200,
            background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden',
          }}
        >
          <button
            onClick={() => download('xlsx')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'right',
            }}
          >
            <FileSpreadsheet size={18} style={{ color: 'var(--v2-primary)' }} />
            ייצוא Excel (.xlsx)
          </button>
          <button
            onClick={() => download('csv')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'right',
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            <FileText size={18} style={{ color: 'var(--v2-primary)' }} />
            ייצוא CSV
          </button>
        </div>
      )}
    </div>
  )
}
