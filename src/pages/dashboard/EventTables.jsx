import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Trash2, QrCode, MessageCircle, RotateCcw, Grid, Table as TableIcon, X,
  UtensilsCrossed, Share2, Link, Users, Pencil,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const PUBLIC_TABLE_ORIGIN = 'https://axess.pro'

const STAFF_TEMPLATE = [
  { role: 'manager', label: 'מנהל ערב' },
  { role: 'table_manager', label: 'מנהל שולחנות' },
  { role: 'bar_manager', label: 'מנהלת בר' },
  { role: 'waitress', label: 'מלצרית' },
  { role: 'selector', label: 'סלקטורית' },
  { role: 'cashier', label: 'קופאית' },
  { role: 'owner', label: 'בעלים' },
]

const STATUS_CONFIG = {
  reserved: { label: 'שמור', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  pending_approval: { label: 'ממתין לאישור', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  active: { label: 'פעיל', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  unpaid: { label: 'לא שולם', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  closed: { label: 'סגור/שולם', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
}

function parseMenuIncludedExtras(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeOrderItems(order) {
  let items = order.items
  if (items == null) items = []
  else if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch {
      items = []
    }
  }
  if (!Array.isArray(items)) items = []
  let extras_list = order.extras_list
  if (extras_list == null) extras_list = []
  else if (typeof extras_list === 'string') {
    try {
      extras_list = JSON.parse(extras_list)
    } catch {
      extras_list = []
    }
  }
  if (!Array.isArray(extras_list)) extras_list = []
  return { ...order, items, extras_list }
}

function tablesAssignedList(ta) {
  if (ta == null) return []
  if (Array.isArray(ta)) return ta
  if (typeof ta === 'string') {
    try {
      const p = JSON.parse(ta)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}

function normalizePayments(order) {
  let p = order.payments
  if (p == null) p = []
  else if (typeof p === 'string') {
    try {
      p = JSON.parse(p)
    } catch {
      p = []
    }
  }
  if (!Array.isArray(p)) p = []
  return p
}

function orderLineTotal(o) {
  const q = parseInt(String(o.drink_quantity || 1), 10)
  const qty = Number.isFinite(q) && q > 0 ? q : 1
  const basePrice = parseFloat(o.base_price || 0) * qty
  const discount = parseFloat(o.discount || 0)
  const b = Number.isFinite(basePrice) ? basePrice : 0
  const d = Number.isFinite(discount) ? discount : 0
  return Math.max(0, b - d)
}

function waPromoterDigits(phone) {
  if (phone == null || phone === '') return ''
  let d = String(phone).replace(/\D/g, '')
  if (d.startsWith('0')) d = `972${d.slice(1)}`
  return d
}

const EDIT_FIELD_SEQUENCE = [
  'order_date',
  'table_number_display',
  'guest_count',
  'customer_name',
  'customer_last_name',
  'customer_phone',
  'customer_email',
  'drink_quantity',
  'base_price',
  'discount',
  'tip_amount',
  'promoter_name',
  'promoter_commission_pct',
]

function getEditFieldValue(order, table, field) {
  if (field === 'table_number_display') {
    return table?.table_number != null ? String(table.table_number) : ''
  }
  if (field === 'order_date') {
    return order.order_date || new Date().toISOString().split('T')[0]
  }
  if (field === 'guest_count') {
    return String(
      order.guest_count ?? (Array.isArray(order.guests) ? order.guests.length + 1 : 1),
    )
  }
  if (field === 'promoter_commission_pct') {
    if (!order.promoter_name) return '0'
    return String(order.promoter_commission_pct ?? 10)
  }
  const v = order[field]
  return v != null && v !== '' ? String(v) : ''
}

function coerceOptimisticLocal(field, rawVal) {
  if (field === 'guest_count' || field === 'drink_quantity') {
    const n = parseInt(String(rawVal), 10)
    return Number.isFinite(n) ? n : 1
  }
  if (field === 'promoter_commission_pct') {
    const n = parseFloat(String(rawVal))
    return Number.isFinite(n) ? n : 10
  }
  if (field === 'base_price' || field === 'discount' || field === 'tip_amount') {
    const n = parseFloat(String(rawVal).replace(/[₪%\s,]/g, ''))
    return Number.isFinite(n) ? n : rawVal
  }
  if (field === 'extras_list') {
    return Array.isArray(rawVal) ? rawVal : []
  }
  return rawVal
}

export default function EventTables({
  eventId,
  businessId,
  authHeaders,
  eventTitle,
  eventDate,
}) {
  const [tables, setTables] = useState([])
  const [tableOrders, setTableOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('table')
  const [tableRowHistory, setTableRowHistory] = useState([])
  const [tableFilter, setTableFilter] = useState({ category: 'all', status: 'all' })
  const [menuItems, setMenuItems] = useState([])
  const [staffList, setStaffList] = useState([])
  const [customCategories, setCustomCategories] = useState([])
  const [editingCell, setEditingCell] = useState(null)
  const [tempCellVal, setTempCellVal] = useState('')
  const [selectedTable, setSelectedTable] = useState(null)
  const [showQR, setShowQR] = useState(null)
  const [showMenuManager, setShowMenuManager] = useState(false)
  const [menuFilter, setMenuFilter] = useState('all')
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category: '',
    price: '',
    unit: 'bottle',
    free_entries: 3,
    free_extras: 5,
  })
  const [editMenuItemId, setEditMenuItemId] = useState(null)
  const [editMenuPrice, setEditMenuPrice] = useState('')
  const [editingExtrasFor, setEditingExtrasFor] = useState(null)
  const [openExtrasOrder, setOpenExtrasOrder] = useState(null)
  const [showStaffPanel, setShowStaffPanel] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    role: 'waitress',
    tables_assigned: '',
    wa_notifications: true,
  })
  const [showTemplateStaff, setShowTemplateStaff] = useState(false)
  const [templateStaffData, setTemplateStaffData] = useState({})
  const [staffErrors, setStaffErrors] = useState({})
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [editStaffData, setEditStaffData] = useState({})
  const extrasMenuWrapRef = useRef(null)
  const suppressCellBlurSave = useRef(false)
  const [extrasDropdownDir, setExtrasDropdownDir] = useState('down')

  useEffect(() => {
    if (openExtrasOrder == null) return
    const onDown = (e) => {
      if (extrasMenuWrapRef.current && !extrasMenuWrapRef.current.contains(e.target)) {
        setOpenExtrasOrder(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openExtrasOrder])

  const drinkSelectOptions = useMemo(() => {
    const grouped = menuItems
      .filter((m) => m.category !== 'נישנושים')
      .reduce((acc, m) => {
        const cat = m.category || 'אחר'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push({ value: m.id, label: `${m.name} — ₪${m.price}` })
        return acc
      }, {})
    return Object.entries(grouped).flatMap(([cat, items]) => [
      { value: `__header_${cat}`, label: `── ${cat} ──`, disabled: true },
      ...items,
    ])
  }, [menuItems])

  const uniqueMenuItems = useMemo(
    () =>
      menuItems.reduce((acc, item) => {
        const existing = acc.find((i) => i.name === item.name && i.category === item.category)
        if (!existing) acc.push(item)
        else if (!item.is_template) {
          const idx = acc.indexOf(existing)
          acc[idx] = item
        }
        return acc
      }, []),
    [menuItems],
  )

  const TABLE_CATEGORIES = useMemo(
    () => [
      { value: 'regular', label: 'שולחן רגיל' },
      { value: 'vip', label: 'VIP' },
      { value: 'dj_booth', label: 'DJ Booth' },
      { value: 'bar', label: 'בר' },
      { value: 'special', label: 'כניסה מיוחדת' },
      ...customCategories,
      { value: '__new__', label: '+ קטגוריה חדשה' },
    ],
    [customCategories],
  )

  const loadData = useCallback(async () => {
    if (!eventId || !businessId) return
    setLoading(true)
    try {
      const hdrs = authHeaders()
      const [t, o, m, s] = await Promise.all([
        fetch(`${API_BASE}/api/admin/events/${eventId}/tables`, { headers: hdrs }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders`, { headers: hdrs }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu`, { headers: hdrs }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, { headers: hdrs }).then((r) => r.json()),
      ])
      setTables(t.tables || [])
      setTableOrders((o.orders || []).map(normalizeOrderItems))
      setMenuItems(m.menu || [])
      setStaffList(s.staff || [])
    } catch (e) {
      console.error(e)
      toast.error('טעינת נתוני שולחנות נכשלה')
    } finally {
      setLoading(false)
    }
  }, [eventId, businessId, authHeaders])

  useEffect(() => {
    loadData()
  }, [loadData])

  const pushHistory = useCallback(() => {
    setTableRowHistory((h) => [...h, tableOrders.map((o) => ({ ...o }))].slice(-10))
  }, [tableOrders])

  const addNewRow = async () => {
    try {
      const tableNum = `${tables.length + 1}`
      const tableRes = await fetch(`${API_BASE}/api/admin/events/${eventId}/tables`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ table_number: tableNum, capacity: 4 }),
      })
      const tableData = await tableRes.json()
      if (!tableRes.ok) {
        toast.error('יצירת שולחן נכשלה')
        return
      }
      const oRes = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          event_table_id: tableData.table?.id,
          customer_name: 'לקוח חדש',
          customer_phone: '-',
          status: 'reserved',
        }),
      })
      if (!oRes.ok) {
        toast.error('יצירת הזמנה נכשלה')
        return
      }
      await loadData()
      toast.success('נוסף שולחן והזמנה')
    } catch (e) {
      console.error(e)
      toast.error('שגיאה')
    }
  }

  const sendToStaff = (order) => {
    const table = tables.find((t) => t.id === order.event_table_id)
    const tn = table?.table_number ?? '?'
    const text = `שולחן ${tn}: ${order.customer_name || ''} · ₪${order.total_amount || 0}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const updateOrder = useCallback(
    async (orderId, field, value) => {
      const payload = { [field]: value }
      if (field === 'base_price' || field === 'discount' || field === 'tip_amount') {
        payload[field] = String(value).replace(/[₪%\s,]/g, '')
      }
      if (field === 'promoter_commission_pct') {
        payload[field] = parseFloat(value) || 10
      }
      if (field === 'extras_list') {
        payload[field] = Array.isArray(value) ? value : []
      }

      if (field === 'table_number_display') {
        setTableOrders((prev) => {
          const ord = prev.find((o) => o.id === orderId)
          if (ord?.event_table_id) {
            setTables((tprev) =>
              tprev.map((t) =>
                t.id === ord.event_table_id ? { ...t, table_number: String(value ?? '') } : t,
              ),
            )
          }
          return prev
        })
      } else {
        const merge = { [field]: coerceOptimisticLocal(field, payload[field]) }
        setTableOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...merge } : o)))
      }

      try {
        const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${orderId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('fail')
      } catch (e) {
        loadData()
        toast.error('שגיאה בשמירה')
      }
    },
    [eventId, authHeaders, loadData],
  )

  const patchOrder = useCallback(
    async (orderId, patch) => {
      setTableOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)))
      try {
        const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${orderId}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error('fail')
      } catch (e) {
        loadData()
        toast.error('שגיאה בשמירה')
      }
    },
    [eventId, authHeaders, loadData],
  )

  if (loading) {
    return (
      <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, padding: 24, textAlign: 'center' }}>
        טוען שולחנות…
      </p>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>
          ניהול שולחנות — {eventTitle}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
          {eventDate ? new Date(eventDate).toLocaleDateString('he-IL') : ''}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--v2-gray-400)' }}>
          {tableOrders.filter((o) => o.status === 'active').length}
          {' '}
          פעילים ·
          {tableOrders.filter((o) => o.status === 'reserved').length}
          {' '}
          שמורים · ₪
          {tableOrders.reduce((s, o) => s + orderLineTotal(o), 0).toLocaleString()}
          {' '}
          הכנסות
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setView('table')}
              style={{
                padding: '6px 12px',
                border: 'none',
                cursor: 'pointer',
                background: view === 'table' ? 'rgba(0,195,122,0.15)' : 'transparent',
                color: view === 'table' ? '#00C37A' : 'var(--text)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <TableIcon size={14} />
              טבלה
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              style={{
                padding: '6px 12px',
                border: 'none',
                cursor: 'pointer',
                background: view === 'grid' ? 'rgba(0,195,122,0.15)' : 'transparent',
                color: view === 'grid' ? '#00C37A' : 'var(--text)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Grid size={14} />
              מפה
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowMenuManager(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass)',
              color: 'var(--text)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <UtensilsCrossed size={14} color="#00C37A" />
            ניהול תפריט
          </button>
          {process.env.NODE_ENV === 'development' || true && (
            <button
              type="button"
              onClick={async () => {
                const res = await fetch(
                  `${API_BASE}/api/admin/events/${eventId}/table-orders`,
                  {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      customer_name: 'לקוח בדיקה',
                      customer_last_name: 'טסט',
                      customer_phone: '0501234567',
                      guest_count: 2,
                      status: 'pending_approval',
                      total_amount: 0,
                      source: 'manual',
                      approval_status: 'pending_approval',
                    }),
                  },
                )
                if (res.ok) {
                  toast.success('הזמנת בדיקה נוצרה ✓')
                  loadData()
                } else {
                  toast.error('שגיאה')
                }
              }}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b', cursor: 'pointer',
              }}
            >
              🧪 הזמנת בדיקה
            </button>
          )}
          <button
            type="button"
            onClick={addNewRow}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#00C37A',
              color: '#000',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={14} />
            שולחן חדש
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <CustomSelect
          value={tableFilter.category}
          onChange={(v) => setTableFilter((f) => ({ ...f, category: v }))}
          options={[
            { value: 'all', label: 'שם/סוג שולחן' },
            ...TABLE_CATEGORIES.filter((c) => c.value !== '__new__'),
          ]}
          style={{ width: 150 }}
        />
        <CustomSelect
          value={tableFilter.status}
          onChange={(v) => setTableFilter((f) => ({ ...f, status: v }))}
          options={[
            { value: 'all', label: 'כל הסטטוסים' },
            ...Object.entries(STATUS_CONFIG).map(([v, { label }]) => ({ value: v, label })),
          ]}
          style={{ width: 140 }}
        />
        {tableRowHistory.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setTableRowHistory((h) => {
                if (h.length === 0) return h
                const prevSnap = h[h.length - 1]
                setTableOrders(prevSnap)
                return h.slice(0, -1)
              })
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass)',
              color: '#F59E0B',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RotateCcw size={14} />
            ביטול (
            {tableRowHistory.length}
            )
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowStaffPanel(true)}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'var(--glass)',
            color: 'var(--text)',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginRight: 'auto',
          }}
        >
          <Users size={14} color="#00C37A" />
          צוות (
          {staffList.length}
          )
        </button>
      </div>

      {view === 'table' && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
            <thead>
              <tr style={{ background: 'var(--glass)', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                {[
                  'תאריך',
                  'מ\' שולחן',
                  'קטגוריה',
                  'כמות אנשים',
                  'לקוח',
                  'שם משפחה',
                  'טלפון',
                  'מייל',
                  'מלצרית',
                  'שתייה',
                  'כמות',
                  'תוספות',
                  'מחיר',
                  'הנחה ₪',
                  'סה"כ',
                  'תשלום 1',
                  'תשלום 2',
                  'טיפ',
                  'יחצ"ן',
                  'עמלה %',
                  'סטטוס',
                  'פעולות',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      borderLeft: '1px solid var(--glass-border)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableOrders
                .filter((o) => tableFilter.category === 'all' || o.category === tableFilter.category)
                .filter((o) => tableFilter.status === 'all' || o.status === tableFilter.status)
                .map((order, idx) => {
                  const table = tables.find((t) => t.id === order.event_table_id)

                  const Cell = ({
                    field,
                    value,
                    type = 'text',
                    width,
                    wrapTd = true,
                    onSave,
                    placeholder,
                  }) => {
                    const tdStyle = {
                      padding: '8px 10px',
                      borderLeft: '1px solid var(--glass-border)',
                      minWidth: width || 80,
                      minHeight: 40,
                      cursor: 'text',
                    }
                    const editing =
                      editingCell?.orderId === order.id && editingCell?.field === field
                    const runSave = () => {
                      pushHistory()
                      if (onSave) {
                        onSave(tempCellVal)
                      } else {
                        updateOrder(order.id, field, tempCellVal)
                      }
                    }
                    const inner = editing ? (
                      <input
                        value={tempCellVal}
                        onChange={(e) => setTempCellVal(e.target.value)}
                        placeholder={placeholder || ''}
                        onBlur={() => {
                          if (suppressCellBlurSave.current) {
                            suppressCellBlurSave.current = false
                            return
                          }
                          runSave()
                          setEditingCell(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            suppressCellBlurSave.current = true
                            runSave()
                            setEditingCell(null)
                          }
                          if (e.key === 'Escape') {
                            suppressCellBlurSave.current = true
                            setEditingCell(null)
                          }
                          if (e.key === 'Tab') {
                            e.preventDefault()
                            suppressCellBlurSave.current = true
                            runSave()
                            const i = EDIT_FIELD_SEQUENCE.indexOf(field)
                            const next = e.shiftKey
                              ? EDIT_FIELD_SEQUENCE[i - 1]
                              : EDIT_FIELD_SEQUENCE[i + 1]
                            if (next) {
                              const merged = { ...order, [field]: coerceOptimisticLocal(field, tempCellVal) }
                              let tbl = table
                              if (field === 'table_number_display' && table) {
                                tbl = { ...table, table_number: tempCellVal }
                              }
                              setEditingCell({ orderId: order.id, field: next })
                              setTempCellVal(getEditFieldValue(merged, tbl, next))
                            } else {
                              setEditingCell(null)
                            }
                          }
                        }}
                        type={type}
                        autoFocus
                        style={{
                          width: '100%',
                          background: 'var(--glass)',
                          border: '1px solid #00C37A',
                          borderRadius: 4,
                          padding: '2px 6px',
                          color: 'var(--text)',
                          fontSize: 12,
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setEditingCell({ orderId: order.id, field })
                          setTempCellVal(value != null ? String(value) : '')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setEditingCell({ orderId: order.id, field })
                            setTempCellVal(value != null ? String(value) : '')
                          }
                        }}
                        style={{
                          fontSize: 12,
                          cursor: 'text',
                          display: 'block',
                          minHeight: 20,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {value != null && value !== '' ? (
                          value
                        ) : (
                          <span style={{ color: 'var(--v2-gray-400)', fontSize: 11 }}>—</span>
                        )}
                      </span>
                    )
                    if (!wrapTd) return inner
                    return <td style={tdStyle}>{inner}</td>
                  }

                  const pay = normalizePayments(order)

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderTop: '1px solid var(--glass-border)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,195,122,0.02)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <td
                        style={{
                          padding: '8px 10px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 100,
                          minHeight: 40,
                          cursor: 'text',
                        }}
                        role="presentation"
                      >
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setEditingCell({ orderId: order.id, field: 'order_date' })
                            setTempCellVal(
                              order.order_date || new Date().toISOString().split('T')[0],
                            )
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setEditingCell({ orderId: order.id, field: 'order_date' })
                              setTempCellVal(
                                order.order_date || new Date().toISOString().split('T')[0],
                              )
                            }
                          }}
                          style={{ display: 'block' }}
                        >
                          {editingCell?.orderId === order.id && editingCell?.field === 'order_date' ? (
                            <input
                              value={tempCellVal}
                              onChange={(e) => setTempCellVal(e.target.value)}
                              onBlur={() => {
                                if (suppressCellBlurSave.current) {
                                  suppressCellBlurSave.current = false
                                  return
                                }
                                updateOrder(order.id, 'order_date', tempCellVal)
                                setEditingCell(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  suppressCellBlurSave.current = true
                                  updateOrder(order.id, 'order_date', tempCellVal)
                                  setEditingCell(null)
                                }
                                if (e.key === 'Escape') {
                                  suppressCellBlurSave.current = true
                                  setEditingCell(null)
                                }
                                if (e.key === 'Tab') {
                                  e.preventDefault()
                                  suppressCellBlurSave.current = true
                                  updateOrder(order.id, 'order_date', tempCellVal)
                                  const i = EDIT_FIELD_SEQUENCE.indexOf('order_date')
                                  const next = e.shiftKey
                                    ? EDIT_FIELD_SEQUENCE[i - 1]
                                    : EDIT_FIELD_SEQUENCE[i + 1]
                                  if (next) {
                                    const merged = { ...order, order_date: tempCellVal }
                                    setEditingCell({ orderId: order.id, field: next })
                                    setTempCellVal(getEditFieldValue(merged, table, next))
                                  } else {
                                    setEditingCell(null)
                                  }
                                }
                              }}
                              type="date"
                              autoFocus
                              style={{
                                background: 'var(--glass)',
                                border: '1px solid #00C37A',
                                borderRadius: 4,
                                padding: '2px 6px',
                                color: 'var(--text)',
                                fontSize: 12,
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: 12, cursor: 'text' }}>
                              {order.order_date
                                ? new Date(order.order_date).toLocaleDateString('he-IL')
                                : new Date().toLocaleDateString('he-IL')}
                            </span>
                          )}
                        </span>
                      </td>

                      <Cell field="table_number_display" value={table?.table_number} width={70} />

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 120 }}>
                        <CustomSelect
                          value={order.category || 'regular'}
                          onChange={async (v) => {
                            if (v === '__new__') {
                              const name = prompt('שם קטגוריה חדשה:')
                              if (name) {
                                setCustomCategories((prev) => [
                                  ...prev,
                                  { value: name.toLowerCase().replace(/\s/g, '_'), label: name },
                                ])
                              }
                              return
                            }
                            patchOrder(order.id, { category: v })
                          }}
                          options={TABLE_CATEGORIES}
                          style={{ fontSize: 11 }}
                        />
                      </td>

                      <td
                        style={{
                          padding: '8px 10px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 80,
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            justifyContent: 'center',
                          }}
                        >
                          <Cell
                            field="guest_count"
                            value={order.guest_count ?? (Array.isArray(order.guests) ? order.guests.length + 1 : 1)}
                            type="number"
                            width={50}
                            wrapTd={false}
                          />
                          {(order.guest_count ?? 1) > 3 && (
                            <span style={{ fontSize: 10, color: '#F59E0B', whiteSpace: 'nowrap' }}>
                              +
                              {(order.guest_count ?? 1) - 3}
                              {' '}
                              כרטיסים
                            </span>
                          )}
                        </div>
                      </td>

                      <Cell field="customer_name" value={order.customer_name} width={100} />
                      <Cell field="customer_last_name" value={order.customer_last_name} width={90} />
                      <Cell field="customer_phone" value={order.customer_phone} width={100} />
                      <Cell field="customer_email" value={order.customer_email} width={120} />

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 110 }}>
                        <CustomSelect
                          value={order.waitress_name || ''}
                          onChange={async (v) => {
                            if (v === '__new__') {
                              setShowStaffPanel(true)
                              setNewStaff((f) => ({ ...f, role: 'waitress' }))
                              return
                            }
                            patchOrder(order.id, { waitress_name: v })
                          }}
                          placeholder="בחר מלצרית..."
                          options={[
                            ...staffList
                              .filter((s) => s.role === 'waitress')
                              .map((s) => ({ value: s.name, label: s.name })),
                            { value: '__new__', label: '+ חדשה' },
                          ]}
                          style={{ fontSize: 11 }}
                        />
                      </td>

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
                        <CustomSelect
                          searchable
                          value={order.drink_item_id || ''}
                          onChange={async (v) => {
                            const item = menuItems.find((m) => m.id === v)
                            patchOrder(order.id, {
                              drink_item_id: v,
                              drink_name: item?.name,
                              base_price: item?.price,
                              total_amount: item?.price || 0,
                            })
                          }}
                          placeholder="בחר שתייה..."
                          options={drinkSelectOptions}
                          style={{ fontSize: 11, minWidth: 160 }}
                        />
                      </td>

                      <Cell
                        field="drink_quantity"
                        value={order.drink_quantity || 1}
                        type="number"
                        width={60}
                        onSave={(val) => {
                          const newQty = parseInt(String(val), 10) || 1
                          const currentExtras = order.extras_list || []
                          const trimmedExtras = currentExtras.slice(0, newQty)
                          updateOrder(order.id, 'drink_quantity', newQty)
                          if (trimmedExtras.length < currentExtras.length) {
                            updateOrder(order.id, 'extras_list', trimmedExtras)
                          }
                        }}
                      />

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 160 }}>
                        {(() => {
                          const selectedExtras = order.extras_list || []
                          const maxExtras = parseInt(String(order.drink_quantity || 1), 10) || 1
                          const extrasItems = menuItems.filter((m) => m.category === 'תוספות')
                          return (
                            <div
                              ref={openExtrasOrder === order.id ? extrasMenuWrapRef : undefined}
                              data-extras-dropdown=""
                              style={{ position: 'relative' }}
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(ev) => {
                                  if (openExtrasOrder === order.id) {
                                    setOpenExtrasOrder(null)
                                    return
                                  }
                                  const rect = ev.currentTarget.getBoundingClientRect()
                                  const spaceBelow = window.innerHeight - rect.bottom - 80
                                  const spaceAbove = rect.top
                                  setExtrasDropdownDir(
                                    spaceBelow < 200 && spaceAbove > 200 ? 'up' : 'down',
                                  )
                                  setOpenExtrasOrder(order.id)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setOpenExtrasOrder(openExtrasOrder === order.id ? null : order.id)
                                  }
                                }}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  border: '1px solid var(--glass-border)',
                                  background: 'var(--card)',
                                  minHeight: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: 4,
                                }}
                              >
                                {selectedExtras.length > 0 ? (
                                  selectedExtras.map((e, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        background: 'rgba(0,195,122,0.15)',
                                        color: '#00C37A',
                                        padding: '1px 6px',
                                        borderRadius: 10,
                                        fontSize: 10,
                                      }}
                                    >
                                      {e}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: 'var(--v2-gray-400)' }}>
                                    בחר תוספות (
                                    {maxExtras}
                                    )
                                  </span>
                                )}
                              </div>

                              {openExtrasOrder === order.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    ...(extrasDropdownDir === 'up'
                                      ? { bottom: '100%', marginBottom: 4 }
                                      : { top: '100%', marginTop: 4 }),
                                    right: 0,
                                    zIndex: 50,
                                    maxHeight: 220,
                                    overflowY: 'auto',
                                    background: '#1e2130',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    padding: 8,
                                    minWidth: 180,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: '0 0 6px',
                                      fontSize: 11,
                                      color: 'var(--v2-gray-400)',
                                    }}
                                  >
                                    בחר עד
                                    {' '}
                                    {maxExtras}
                                    {' '}
                                    תוספות
                                  </p>
                                  {extrasItems.map((item) => {
                                    const isSelected = selectedExtras.includes(item.name)
                                    const canAdd = !isSelected && selectedExtras.length < maxExtras
                                    return (
                                      <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                          if (!isSelected && !canAdd) return
                                          const newExtras = isSelected
                                            ? selectedExtras.filter((x) => x !== item.name)
                                            : [...selectedExtras, item.name]
                                          patchOrder(order.id, { extras_list: newExtras })
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            if (!isSelected && !canAdd) return
                                            const newExtras = isSelected
                                              ? selectedExtras.filter((x) => x !== item.name)
                                              : [...selectedExtras, item.name]
                                            patchOrder(order.id, { extras_list: newExtras })
                                          }
                                        }}
                                        style={{
                                          padding: '6px 8px',
                                          borderRadius: 6,
                                          cursor: canAdd || isSelected ? 'pointer' : 'not-allowed',
                                          fontSize: 12,
                                          marginBottom: 2,
                                          background: isSelected ? 'rgba(0,195,122,0.15)' : 'transparent',
                                          color: isSelected ? '#00C37A' : canAdd ? '#fff' : 'rgba(255,255,255,0.3)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                        }}
                                      >
                                        <span style={{ fontSize: 10 }}>{isSelected ? '✅' : '⬜'}</span>
                                        {item.name}
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: 'rgba(255,255,255,0.4)',
                                            marginRight: 'auto',
                                          }}
                                        >
                                          {item.unit === 'pitcher'
                                            ? 'קנקן'
                                            : item.unit === 'unit'
                                              ? 'יח׳'
                                              : ''}
                                        </span>
                                      </div>
                                    )
                                  })}
                                  {selectedExtras.length >= maxExtras && (
                                    <p
                                      style={{
                                        margin: '6px 0 0',
                                        fontSize: 10,
                                        color: '#F59E0B',
                                        textAlign: 'center',
                                      }}
                                    >
                                      הגעת למקסימום —
                                      {' '}
                                      {maxExtras}
                                      {' '}
                                      תוספות
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </td>

                      <Cell
                        field="base_price"
                        value={order.base_price != null ? order.base_price : ''}
                        type="number"
                        width={70}
                      />

                      <Cell
                        field="discount"
                        value={order.discount != null && order.discount !== '' ? order.discount : ''}
                        type="number"
                        width={60}
                        placeholder="הנחה ₪"
                        onSave={(val) => {
                          const base = parseFloat(order.base_price || 0)
                            * parseInt(String(order.drink_quantity || 1), 10)
                          const disc = parseFloat(String(val || '').replace(/[₪%\s,]/g, '')) || 0
                          const newTotal = Math.max(0, (Number.isFinite(base) ? base : 0) - disc)
                          patchOrder(order.id, {
                            discount: disc,
                            total_amount: newTotal,
                          })
                        }}
                      />

                      <td
                        style={{
                          padding: '8px 10px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 80,
                          fontWeight: 700,
                          color: '#00C37A',
                        }}
                      >
                        ₪
                        {orderLineTotal(order).toLocaleString()}
                      </td>

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
                        {pay[0] && (
                          <span style={{ fontSize: 11 }}>
                            {pay[0].type === 'credit'
                              ? 'אשראי'
                              : pay[0].type === 'cash'
                                ? 'מזומן'
                                : pay[0].type === 'bit'
                                  ? 'ביט'
                                  : pay[0].type}
                            {' '}
                            ₪
                            {pay[0].amount}
                            {pay[0].payer && ` (${pay[0].payer})`}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
                        {pay[1] && (
                          <span style={{ fontSize: 11 }}>
                            {pay[1].type === 'credit'
                              ? 'אשראי'
                              : pay[1].type === 'cash'
                                ? 'מזומן'
                                : 'ביט'}
                            {' '}
                            ₪
                            {pay[1].amount}
                          </span>
                        )}
                      </td>

                      <Cell field="tip_amount" value={order.tip_amount != null ? order.tip_amount : ''} type="number" width={70} />

                      <td
                        style={{
                          padding: '8px 10px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 100,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Cell
                              field="promoter_name"
                              value={order.promoter_name}
                              width={90}
                              wrapTd={false}
                              onSave={(val) => {
                                const trimmed = String(val || '').trim()
                                const pct = trimmed ? (order.promoter_commission_pct || 10) : 0
                                patchOrder(order.id, {
                                  promoter_name: trimmed,
                                  promoter_commission_pct: pct,
                                })
                              }}
                            />
                          </div>
                          {order.promoter_name && (
                            <button
                              type="button"
                              title="WhatsApp ליחצ״ן"
                              onClick={() => {
                                const msg = `שלום ${order.promoter_name}! סיכום שולחנות עד כה: ₪${orderLineTotal(order)}. לינק: https://axess.pro/promoter/${eventId}`
                                const waNum = waPromoterDigits(order.promoter_phone) || String(order.promoter_phone || '').replace(/\D/g, '')
                                window.open(
                                  `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`,
                                  '_blank',
                                  'noopener,noreferrer',
                                )
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#22C55E',
                                padding: 0,
                                flexShrink: 0,
                              }}
                            >
                              <MessageCircle size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '8px 10px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 80,
                          minHeight: 40,
                          cursor: 'text',
                        }}
                        role="presentation"
                      >
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setEditingCell({ orderId: order.id, field: 'promoter_commission_pct' })
                            setTempCellVal(
                              String(
                                order.promoter_name
                                  ? (order.promoter_commission_pct ?? 10)
                                  : 0,
                              ),
                            )
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setEditingCell({ orderId: order.id, field: 'promoter_commission_pct' })
                              setTempCellVal(
                                String(
                                  order.promoter_name
                                    ? (order.promoter_commission_pct ?? 10)
                                    : 0,
                                ),
                              )
                            }
                          }}
                          style={{ display: 'block' }}
                        >
                          {editingCell?.orderId === order.id &&
                          editingCell?.field === 'promoter_commission_pct' ? (
                            <input
                              value={tempCellVal}
                              onChange={(e) => setTempCellVal(e.target.value)}
                              onBlur={() => {
                                if (suppressCellBlurSave.current) {
                                  suppressCellBlurSave.current = false
                                  return
                                }
                                updateOrder(
                                  order.id,
                                  'promoter_commission_pct',
                                  parseFloat(tempCellVal) || 10,
                                )
                                setEditingCell(null)
                              }}
                              onKeyDown={(e) => {
                                const v = parseFloat(tempCellVal) || 10
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  suppressCellBlurSave.current = true
                                  updateOrder(order.id, 'promoter_commission_pct', v)
                                  setEditingCell(null)
                                }
                                if (e.key === 'Escape') {
                                  suppressCellBlurSave.current = true
                                  setEditingCell(null)
                                }
                                if (e.key === 'Tab') {
                                  e.preventDefault()
                                  suppressCellBlurSave.current = true
                                  updateOrder(order.id, 'promoter_commission_pct', v)
                                  const i = EDIT_FIELD_SEQUENCE.indexOf('promoter_commission_pct')
                                  const next = e.shiftKey
                                    ? EDIT_FIELD_SEQUENCE[i - 1]
                                    : EDIT_FIELD_SEQUENCE[i + 1]
                                  if (next) {
                                    const merged = {
                                      ...order,
                                      promoter_commission_pct: v,
                                    }
                                    setEditingCell({ orderId: order.id, field: next })
                                    setTempCellVal(getEditFieldValue(merged, table, next))
                                  } else {
                                    setEditingCell(null)
                                  }
                                }
                              }}
                              type="number"
                              min={0}
                              max={100}
                              autoFocus
                              style={{
                                width: 60,
                                background: 'var(--glass)',
                                border: '1px solid #00C37A',
                                borderRadius: 4,
                                padding: '2px 6px',
                                color: 'var(--text)',
                                fontSize: 12,
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: 12,
                                cursor: 'text',
                                color: order.promoter_name ? '#F59E0B' : 'var(--v2-gray-400)',
                              }}
                            >
                              {order.promoter_name ? (order.promoter_commission_pct ?? 10) : 0}
                              %
                              {order.promoter_name && (
                                <span style={{ display: 'block', fontSize: 10, color: '#F59E0B' }}>
                                  ₪
                                  {Math.round(
                                    orderLineTotal(order) *
                                      (parseFloat(order.promoter_commission_pct) || 10) /
                                      100,
                                  )}
                                </span>
                              )}
                            </span>
                          )}
                        </span>
                      </td>

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
                        <CustomSelect
                          value={order.status || 'reserved'}
                          onChange={(v) => {
                            patchOrder(order.id, { status: v })
                          }}
                          options={Object.entries(STATUS_CONFIG).map(([v, { label }]) => ({ value: v, label }))}
                          style={{ fontSize: 11 }}
                        />
                      </td>

                      <td style={{ padding: '8px 10px', borderLeft: '1px solid var(--glass-border)', minWidth: 120 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            title="הצג QR"
                            onClick={() => setShowQR(order)}
                            style={{
                              background: 'rgba(0,195,122,0.1)',
                              border: '1px solid rgba(0,195,122,0.3)',
                              borderRadius: 6,
                              cursor: 'pointer',
                              color: '#00C37A',
                              padding: '8px 10px',
                              minWidth: 36,
                              minHeight: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <QrCode size={13} />
                          </button>
                          <button
                            type="button"
                            title="שלח לצוות"
                            onClick={() => sendToStaff(order)}
                            style={{
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.3)',
                              borderRadius: 6,
                              cursor: 'pointer',
                              color: '#22C55E',
                              padding: '8px 10px',
                              minWidth: 36,
                              minHeight: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MessageCircle size={13} />
                          </button>
                          <button
                            type="button"
                            title="מחק"
                            onClick={async () => {
                              if (!confirm('למחוק הזמנה זו?')) return
                              pushHistory()
                              await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                                method: 'DELETE',
                                headers: authHeaders(),
                              })
                              loadData()
                            }}
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: 6,
                              cursor: 'pointer',
                              color: '#EF4444',
                              padding: '8px 10px',
                              minWidth: 36,
                              minHeight: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

              <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'var(--glass)' }}>
                <td colSpan={14} style={{ padding: '8px 12px', fontWeight: 800, fontSize: 13 }}>
                  סה&quot;כ
                  {' '}
                  {tableOrders.length}
                  {' '}
                  שולחנות
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 800, fontSize: 14, color: '#00C37A' }}>
                  ₪
                  {tableOrders.reduce((s, o) => s + orderLineTotal(o), 0).toLocaleString()}
                </td>
                <td colSpan={7} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {view === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {tableOrders.map((order) => {
            const table = tables.find((t) => t.id === order.event_table_id)
            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.reserved
            const hasPendingUpsell = order.items?.some((i) => i.is_upsell && i.status === 'pending')
            return (
              <div
                key={order.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTable(order)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedTable(order)
                  }
                }}
                style={{
                  background: sc.bg,
                  border: `2px solid ${sc.color}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  position: 'relative',
                  textAlign: 'center',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none'
                }}
              >
                {hasPendingUpsell && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#F59E0B',
                      color: '#000',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    !
                  </div>
                )}
                <div style={{ fontSize: 22, fontWeight: 800, color: sc.color }}>
                  {table?.table_number || '?'}
                </div>
                <div style={{ fontSize: 11, color: sc.color, fontWeight: 600, marginTop: 2 }}>{sc.label}</div>
                <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600 }}>{order.customer_name}</div>
                {order.waitress_name && (
                  <div style={{ fontSize: 10, color: 'var(--v2-gray-400)' }}>
                    👩
                    {order.waitress_name}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#00C37A', fontWeight: 700, marginTop: 4 }}>
                  ₪
                  {orderLineTotal(order)}
                </div>
              </div>
            )
          })}
          <div
            role="button"
            tabIndex={0}
            onClick={addNewRow}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                addNewRow()
              }
            }}
            style={{
              border: '2px dashed var(--glass-border)',
              borderRadius: 12,
              padding: 14,
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 100,
              opacity: 0.6,
            }}
          >
            <Plus size={20} color="var(--v2-gray-400)" />
            <span style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 4 }}>הוסף שולחן</span>
          </div>
        </div>
      )}

      {showStaffPanel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 560,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowStaffPanel(false)
                setStaffErrors({})
                setEditingStaffId(null)
              }}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--v2-gray-400)',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>צוות האירוע</h3>

            {staffList.map((member) => {
              const ta = tablesAssignedList(member.tables_assigned)
              return (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--glass-border)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(0,195,122,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00C37A',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {(member.name && member.name[0]) || '?'}
                  </div>
                  {editingStaffId === member.id ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={editStaffData.name || ''}
                        onChange={(e) => setEditStaffData((f) => ({ ...f, name: e.target.value }))}
                        style={{
                          flex: 1,
                          minWidth: 80,
                          height: 30,
                          borderRadius: 6,
                          border: '1px solid var(--glass-border)',
                          background: 'var(--glass)',
                          color: 'var(--text)',
                          padding: '0 8px',
                          fontSize: 12,
                        }}
                      />
                      <input
                        value={editStaffData.phone || ''}
                        onChange={(e) => setEditStaffData((f) => ({ ...f, phone: e.target.value }))}
                        style={{
                          flex: 1,
                          minWidth: 80,
                          height: 30,
                          borderRadius: 6,
                          border: '1px solid var(--glass-border)',
                          background: 'var(--glass)',
                          color: 'var(--text)',
                          padding: '0 8px',
                          fontSize: 12,
                        }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff/${member.id}`, {
                            method: 'PATCH',
                            headers: {
                              ...authHeaders(),
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(editStaffData),
                          })
                          setEditingStaffId(null)
                          loadData()
                        }}
                        style={{
                          background: '#00C37A',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: '#000',
                          padding: '0 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          height: 30,
                        }}
                      >
                        שמור
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStaffId(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--v2-gray-400)',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{member.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--v2-gray-400)' }}>
                          {member.role === 'manager'
                            ? 'מנהל ערב'
                            : member.role === 'waitress'
                              ? 'מלצרית'
                              : member.role === 'bar_manager'
                                ? 'מנהלת בר'
                                : member.role === 'cashier'
                                  ? 'קופאית'
                                  : member.role === 'selector'
                                    ? 'סלקטורית'
                                    : member.role === 'table_manager'
                                      ? 'מנהל שולחנות'
                                      : member.role === 'owner'
                                        ? 'בעלים'
                                        : member.role}
                          {' · '}
                          {member.phone}
                        </p>
                        {ta.length > 0 && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#00C37A' }}>
                            שולחנות:
                            {' '}
                            {ta.join(', ')}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://axess.pro/staff/table/${member.share_token}`)
                            toast.success('לינק הועתק!')
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A' }}
                        >
                          <Link size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffId(member.id)
                            setEditStaffData({ name: member.name, phone: member.phone })
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff/${member.id}`, {
                              method: 'DELETE',
                              headers: authHeaders(),
                            })
                            loadData()
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {staffList.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, marginBottom: 12 }}>
                  אין צוות מוגדר עדיין
                </p>
                <button
                  type="button"
                  onClick={() => setShowTemplateStaff(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(0,195,122,0.15)',
                    color: '#00C37A',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  טען תבנית צוות מלאה
                </button>
              </div>
            )}

            {showTemplateStaff && (
              <div
                style={{
                  marginTop: 16,
                  background: 'var(--glass)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>מלא פרטי צוות:</p>
                {STAFF_TEMPLATE.map((t) => (
                  <div
                    key={t.role}
                    style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}
                  >
                    <span
                      style={{
                        width: 110,
                        fontSize: 12,
                        color: 'var(--v2-gray-400)',
                        flexShrink: 0,
                      }}
                    >
                      {t.label}
                    </span>
                    <input
                      value={templateStaffData[t.role]?.name || ''}
                      onChange={(e) =>
                        setTemplateStaffData((prev) => ({
                          ...prev,
                          [t.role]: { ...prev[t.role], role: t.role, name: e.target.value },
                        }))}
                      placeholder="שם מלא"
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 12,
                      }}
                    />
                    <input
                      value={templateStaffData[t.role]?.phone || ''}
                      onChange={(e) =>
                        setTemplateStaffData((prev) => ({
                          ...prev,
                          [t.role]: { ...prev[t.role], role: t.role, phone: e.target.value },
                        }))}
                      placeholder="טלפון WA"
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 12,
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={async () => {
                    const toAdd = Object.values(templateStaffData).filter((s) => s.name && s.phone)
                    for (const member of toAdd) {
                      await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({
                          ...member,
                          tables_assigned: [],
                          wa_notifications: true,
                        }),
                      })
                    }
                    setTemplateStaffData({})
                    setShowTemplateStaff(false)
                    loadData()
                    toast.success(`${toAdd.length} אנשי צוות נוספו!`)
                  }}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 8,
                    border: 'none',
                    background: '#00C37A',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    marginTop: 8,
                  }}
                >
                  שמור צוות
                </button>
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>+ הוסף איש צוות</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <input
                    value={newStaff.name || ''}
                    onChange={(e) => {
                      setNewStaff((f) => ({ ...f, name: e.target.value }))
                      setStaffErrors((er) => ({ ...er, name: false }))
                    }}
                    placeholder="שם מלא *"
                    style={{
                      height: 36,
                      width: '100%',
                      boxSizing: 'border-box',
                      borderRadius: 6,
                      border: `1px solid ${staffErrors.name ? '#EF4444' : 'var(--glass-border)'}`,
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      padding: '0 10px',
                      fontSize: 13,
                    }}
                  />
                  {staffErrors.name && (
                    <p style={{ color: '#EF4444', fontSize: 11, margin: '2px 0 0' }}>שם חובה</p>
                  )}
                </div>
                <div>
                  <input
                    value={newStaff.phone || ''}
                    onChange={(e) => {
                      setNewStaff((f) => ({ ...f, phone: e.target.value }))
                      setStaffErrors((er) => ({ ...er, phone: false }))
                    }}
                    placeholder="טלפון WA *"
                    style={{
                      height: 36,
                      width: '100%',
                      boxSizing: 'border-box',
                      borderRadius: 6,
                      border: `1px solid ${staffErrors.phone ? '#EF4444' : 'var(--glass-border)'}`,
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      padding: '0 10px',
                      fontSize: 13,
                    }}
                  />
                  {staffErrors.phone && (
                    <p style={{ color: '#EF4444', fontSize: 11, margin: '2px 0 0' }}>
                      טלפון חובה לקבלת התראות WA
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <CustomSelect
                  value={newStaff.role || 'waitress'}
                  onChange={(v) => setNewStaff((f) => ({ ...f, role: v }))}
                  options={[
                    { value: 'manager', label: 'מנהל ערב' },
                    { value: 'table_manager', label: 'מנהל שולחנות' },
                    { value: 'waitress', label: 'מלצרית' },
                    { value: 'bar_manager', label: 'מנהלת בר' },
                    { value: 'cashier', label: 'קופאית' },
                    { value: 'selector', label: 'סלקטורית' },
                  ]}
                  style={{ fontSize: 13 }}
                />
                <input
                  value={newStaff.tables_assigned || ''}
                  onChange={(e) => setNewStaff((f) => ({ ...f, tables_assigned: e.target.value }))}
                  placeholder="שולחנות (100,101,102)"
                  style={{
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                  }}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  marginBottom: 10,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={newStaff.wa_notifications !== false}
                  onChange={(e) => setNewStaff((f) => ({ ...f, wa_notifications: e.target.checked }))}
                />
                קבל התראות WhatsApp
              </label>
              <button
                type="button"
                onClick={async () => {
                  const errors = {}
                  if (!newStaff.name?.trim()) errors.name = true
                  if (!newStaff.phone?.trim()) errors.phone = true
                  setStaffErrors(errors)
                  if (Object.keys(errors).length > 0) return
                  const tablesArr = newStaff.tables_assigned
                    ? newStaff.tables_assigned.split(',').map((t) => t.trim()).filter(Boolean)
                    : []
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, {
                    method: 'POST',
                    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...newStaff, tables_assigned: tablesArr }),
                  })
                  setNewStaff({
                    name: '',
                    phone: '',
                    role: 'waitress',
                    tables_assigned: '',
                    wa_notifications: true,
                  })
                  setStaffErrors({})
                  loadData()
                  toast.success('איש צוות נוסף!')
                }}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                הוסף לצוות
              </button>
            </div>
          </div>
        </div>
      )}

      {showMenuManager && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 600,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowMenuManager(false)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--v2-gray-400)',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>ניהול תפריט</h3>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>+ הוסף מוצר לתפריט</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem((f) => ({ ...f, name: e.target.value }))}
                  placeholder="שם המוצר"
                  style={{
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                  }}
                />
                <input
                  value={newMenuItem.category}
                  onChange={(e) => setNewMenuItem((f) => ({ ...f, category: e.target.value }))}
                  placeholder="קטגוריה"
                  style={{
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                  }}
                />
                <input
                  value={newMenuItem.price}
                  onChange={(e) => setNewMenuItem((f) => ({ ...f, price: e.target.value }))}
                  placeholder="מחיר ₪"
                  type="number"
                  style={{
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                  }}
                />
                <div />
                <div style={{ display: 'flex', gap: 6, gridColumn: '1 / -1' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: 11,
                        color: 'var(--v2-gray-400)',
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      כניסות חינם לליטר
                    </label>
                    <input
                      value={newMenuItem.free_entries}
                      onChange={(e) => setNewMenuItem((f) => ({ ...f, free_entries: e.target.value }))}
                      placeholder="כניסות חינם לליטר"
                      type="number"
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--glass)',
                        color: 'var(--text)',
                        padding: '0 10px',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: 11,
                        color: 'var(--v2-gray-400)',
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      תוספות חינם (אנרגי/מיצים)
                    </label>
                    <input
                      value={newMenuItem.free_extras}
                      onChange={(e) => setNewMenuItem((f) => ({ ...f, free_extras: e.target.value }))}
                      placeholder="תוספות (אנרגי/מיצים)"
                      type="number"
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--glass)',
                        color: 'var(--text)',
                        padding: '0 10px',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!newMenuItem.name || !newMenuItem.price) return
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify(newMenuItem),
                  })
                  setNewMenuItem({
                    name: '',
                    category: '',
                    price: '',
                    unit: 'bottle',
                    free_entries: 3,
                    free_extras: 5,
                  })
                  loadData()
                }}
                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                הוסף לתפריט
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const menuUrl = `https://axess.pro/menu/${eventId}`
                navigator.clipboard.writeText(menuUrl)
                toast.success('לינק תפריט הועתק!')
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'rgba(0,195,122,0.15)',
                color: '#00C37A',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <Share2 size={14} />
              שלח תפריט ללקוח
            </button>

            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 16,
                overflowX: 'auto',
                flexWrap: 'nowrap',
              }}
            >
              {['all', ...new Set(uniqueMenuItems.map((m) => m.category).filter(Boolean))].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMenuFilter(cat)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: 12,
                    background: menuFilter === cat ? 'var(--primary)' : 'var(--glass)',
                    color: menuFilter === cat ? '#fff' : 'var(--text)',
                  }}
                >
                  {cat === 'all' ? 'הכל' : cat}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              {(() => {
                const filtered = uniqueMenuItems.filter(
                  (m) => menuFilter === 'all' || m.category === menuFilter,
                )
                const byCat = {}
                for (const m of filtered) {
                  const c = m.category || 'אחר'
                  if (!byCat[c]) byCat[c] = []
                  byCat[c].push(m)
                }
                const cats = Object.keys(byCat).sort((a, b) => a.localeCompare(b, 'he'))
                return cats.map((cat) => (
                  <div key={cat} style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        margin: '0 0 8px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--v2-gray-400)',
                      }}
                    >
                      {cat}
                    </p>
                    {byCat[cat]
                      .slice()
                      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 0',
                            borderBottom: '1px solid var(--glass-border)',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--v2-gray-400)' }}>
                              {item.category}
                              {' '}
                              · ₪
                              {item.price}
                              {item.free_entries > 0 && ` · ${item.free_entries} כניסות חינם`}
                              {item.free_extras > 0
                                && ` · ${item.free_extras} ${item.free_extras_type === 'energy' ? 'אנרגי' : 'תוספות'}`}
                            </p>
                          </div>
                          {item.id === editMenuItemId ? (
                            <input
                              value={editMenuPrice}
                              onChange={(e) => setEditMenuPrice(e.target.value)}
                              onBlur={async () => {
                                await fetch(
                                  `${API_BASE}/api/admin/events/${eventId}/table-menu/${item.id}`,
                                  {
                                    method: 'PATCH',
                                    headers: authHeaders(),
                                    body: JSON.stringify({
                                      price: parseFloat(editMenuPrice),
                                      name: item.name,
                                      is_available: item.is_available,
                                      included_extras: parseMenuIncludedExtras(item.included_extras),
                                      free_entries: item.free_entries,
                                      free_extras: item.free_extras,
                                      free_extras_type: item.free_extras_type,
                                    }),
                                  },
                                )
                                setEditMenuItemId(null)
                                loadData()
                              }}
                              type="number"
                              autoFocus
                              style={{
                                width: 70,
                                background: 'var(--glass)',
                                border: '1px solid #00C37A',
                                borderRadius: 4,
                                padding: '2px 6px',
                                color: 'var(--text)',
                                fontSize: 13,
                              }}
                            />
                          ) : (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setEditMenuItemId(item.id)
                                setEditMenuPrice(String(item.price))
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setEditMenuItemId(item.id)
                                  setEditMenuPrice(String(item.price))
                                }
                              }}
                              style={{ cursor: 'text', fontWeight: 700, color: '#00C37A' }}
                            >
                              ₪
                              {item.price}
                            </span>
                          )}
                          {item.category !== 'תוספות' && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingExtrasFor({
                                  ...item,
                                  included_extras: parseMenuIncludedExtras(item.included_extras),
                                })
                              }
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#00C37A',
                                fontSize: 12,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              🥤 {parseMenuIncludedExtras(item.included_extras).length} תוספות
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu/${item.id}`, {
                                method: 'DELETE',
                                headers: authHeaders(),
                              })
                              loadData()
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#EF4444',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      {editingExtrasFor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setEditingExtrasFor(null)}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 16,
              padding: 20,
              maxWidth: 420,
              width: '100%',
              border: '1px solid var(--glass-border)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>
              תוספות ל־{editingExtrasFor.name}
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
              סמן פריטים מקטגוריית &quot;תוספות&quot; בתפריט
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>אנשים חינם לבקבוק</label>
                <input
                  type="number"
                  value={editingExtrasFor.free_entries || 0}
                  onChange={(e) =>
                    setEditingExtrasFor((f) => ({ ...f, free_entries: Number(e.target.value) }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--glass)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text)',
                    textAlign: 'center',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>תוספות לבקבוק</label>
                <input
                  type="number"
                  value={editingExtrasFor.free_extras || 0}
                  onChange={(e) =>
                    setEditingExtrasFor((f) => ({ ...f, free_extras: Number(e.target.value) }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--glass)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text)',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {uniqueMenuItems
                .filter((m) => m.category === 'תוספות')
                .map((extra) => {
                  const isIncluded = (editingExtrasFor.included_extras || []).includes(extra.name)
                  return (
                    <div
                      key={extra.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const current = editingExtrasFor.included_extras || []
                        const updated = isIncluded ? current.filter((e) => e !== extra.name) : [...current, extra.name]
                        setEditingExtrasFor({ ...editingExtrasFor, included_extras: updated })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          const current = editingExtrasFor.included_extras || []
                          const updated = isIncluded ? current.filter((x) => x !== extra.name) : [...current, extra.name]
                          setEditingExtrasFor({ ...editingExtrasFor, included_extras: updated })
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${isIncluded ? 'rgba(0,195,122,0.5)' : 'var(--glass-border)'}`,
                        background: isIncluded ? 'rgba(0,195,122,0.08)' : 'var(--glass)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 14,
                      }}
                    >
                      <span>{extra.name}</span>
                      <span>{isIncluded ? '✅' : '⬜'}</span>
                    </div>
                  )
                })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setEditingExtrasFor(null)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'none',
                  color: 'var(--text)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch(
                    `${API_BASE}/api/admin/events/${eventId}/table-menu/${editingExtrasFor.id}`,
                    {
                      method: 'PATCH',
                      headers: authHeaders(),
                      body: JSON.stringify({
                        price: editingExtrasFor.price,
                        name: editingExtrasFor.name,
                        is_available: editingExtrasFor.is_available,
                        included_extras: editingExtrasFor.included_extras || [],
                        free_entries: editingExtrasFor.free_entries,
                        free_extras: editingExtrasFor.free_extras,
                        free_extras_type: editingExtrasFor.free_extras_type,
                      }),
                    },
                  )
                  setEditingExtrasFor(null)
                  loadData()
                }}
                style={{
                  flex: 2,
                  height: 44,
                  borderRadius: 10,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTable && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedTable(null)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--v2-gray-400)',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>הזמנה</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{selectedTable.customer_name}</p>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--v2-gray-400)' }}>
              ₪
              {selectedTable.total_amount || 0}
            </p>
            {selectedTable.qr_token && (
              <button
                type="button"
                onClick={() => {
                  const u = `${PUBLIC_TABLE_ORIGIN}/table/${selectedTable.qr_token}`
                  navigator.clipboard?.writeText(u)
                  toast.success('הקישור הועתק')
                }}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                העתק קישור QR ללקוח
              </button>
            )}
          </div>
        </div>
      )}

      {showQR && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--card, #1a1d2e)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: '100%',
              border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowQR(null)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--v2-gray-400)',
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>קישור שולחן (QR)</h3>
            {showQR.qr_token ? (
              <>
                <code
                  style={{
                    display: 'block',
                    fontSize: 12,
                    wordBreak: 'break-all',
                    padding: 12,
                    background: 'var(--glass)',
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  {`${PUBLIC_TABLE_ORIGIN}/table/${showQR.qr_token}`}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${PUBLIC_TABLE_ORIGIN}/table/${showQR.qr_token}`)
                    toast.success('הועתק')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#00C37A',
                    color: '#000',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  העתק קישור
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--v2-gray-400)' }}>אין טוקן QR להזמנה זו</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
