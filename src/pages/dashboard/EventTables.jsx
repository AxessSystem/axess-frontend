import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Plus, Trash2, QrCode, MessageCircle, RotateCcw, Grid, Table as TableIcon, X,
  UtensilsCrossed, Share2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const PUBLIC_TABLE_ORIGIN = 'https://axess.pro'

const STATUS_CONFIG = {
  reserved: { label: 'שמור', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  pending_approval: { label: 'ממתין לאישור', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  active: { label: 'פעיל', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  unpaid: { label: 'לא שולם', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  closed: { label: 'סגור/שולם', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
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
  return { ...order, items }
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

  const commitCellPatch = async (order, field, rawVal) => {
    let payload = { [field]: rawVal }
    if (field === 'base_price' || field === 'discount' || field === 'tip_amount') {
      payload = { [field]: String(rawVal).replace(/[₪%\s,]/g, '') }
    }
    await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    setEditingCell(null)
    loadData()
  }

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
          {tableOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toLocaleString()}
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
                  'הנחה',
                  'סה"כ',
                  'תשלום 1',
                  'תשלום 2',
                  'טיפ',
                  'יחצ"ן',
                  'סטטוס',
                  'פעולות',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 8px',
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

                  const Cell = ({ field, value, type = 'text', width, wrapTd = true }) => {
                    const tdStyle = {
                      padding: '4px 6px',
                      borderLeft: '1px solid var(--glass-border)',
                      minWidth: width || 80,
                    }
                    const editing =
                      editingCell?.orderId === order.id && editingCell?.field === field
                    const inner = editing ? (
                      <input
                        value={tempCellVal}
                        onChange={(e) => setTempCellVal(e.target.value)}
                        onBlur={async () => {
                          pushHistory()
                          await commitCellPatch(order, field, tempCellVal)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingCell(null)
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
                          padding: '4px 6px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 100,
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
                              onBlur={async () => {
                                await fetch(
                                  `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`,
                                  {
                                    method: 'PATCH',
                                    headers: authHeaders(),
                                    body: JSON.stringify({ order_date: tempCellVal }),
                                  },
                                )
                                setEditingCell(null)
                                loadData()
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

                      <td style={{ padding: '4px 6px', borderLeft: '1px solid var(--glass-border)', minWidth: 120 }}>
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
                            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                              method: 'PATCH',
                              headers: authHeaders(),
                              body: JSON.stringify({ category: v }),
                            })
                            loadData()
                          }}
                          options={TABLE_CATEGORIES}
                          style={{ fontSize: 11 }}
                        />
                      </td>

                      <td
                        style={{
                          padding: '4px 6px',
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

                      <td style={{ padding: '4px 6px', borderLeft: '1px solid var(--glass-border)', minWidth: 110 }}>
                        <CustomSelect
                          value={order.waitress_name || ''}
                          onChange={async (v) => {
                            let val = v
                            if (v === '__new__') {
                              const name = prompt('שם מלצרית:')
                              if (!name) return
                              val = name
                            }
                            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                              method: 'PATCH',
                              headers: authHeaders(),
                              body: JSON.stringify({ waitress_name: val }),
                            })
                            loadData()
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

                      <td style={{ padding: '4px 6px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
                        <CustomSelect
                          searchable
                          value={order.drink_item_id || ''}
                          onChange={async (v) => {
                            const item = menuItems.find((m) => m.id === v)
                            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                              method: 'PATCH',
                              headers: authHeaders(),
                              body: JSON.stringify({
                                drink_item_id: v,
                                drink_name: item?.name,
                                base_price: item?.price,
                                total_amount: item?.price || 0,
                              }),
                            })
                            loadData()
                          }}
                          placeholder="בחר שתייה..."
                          options={drinkSelectOptions}
                          style={{ fontSize: 11, minWidth: 160 }}
                        />
                      </td>

                      <Cell field="drink_quantity" value={order.drink_quantity || 1} type="number" width={60} />

                      <td style={{ padding: '4px 6px', borderLeft: '1px solid var(--glass-border)', minWidth: 120 }}>
                        <CustomSelect
                          searchable
                          value={order.extras || ''}
                          onChange={async (v) => {
                            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                              method: 'PATCH',
                              headers: authHeaders(),
                              body: JSON.stringify({ extras: v }),
                            })
                            loadData()
                          }}
                          placeholder="תוספות..."
                          options={menuItems
                            .filter((m) => m.category === 'extras')
                            .map((m) => ({
                              value: m.id,
                              label: m.name,
                            }))}
                          style={{ fontSize: 11, minWidth: 160 }}
                        />
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
                      />

                      <td
                        style={{
                          padding: '4px 8px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 80,
                          fontWeight: 700,
                          color: '#00C37A',
                        }}
                      >
                        ₪
                        {parseFloat(order.total_amount || 0).toLocaleString()}
                      </td>

                      <td style={{ padding: '4px 6px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
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

                      <td style={{ padding: '4px 6px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
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

                      <Cell field="promoter_name" value={order.promoter_name} width={90} />

                      <td style={{ padding: '4px 6px', borderLeft: '1px solid var(--glass-border)', minWidth: 130 }}>
                        <CustomSelect
                          value={order.status || 'reserved'}
                          onChange={async (v) => {
                            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                              method: 'PATCH',
                              headers: authHeaders(),
                              body: JSON.stringify({ status: v }),
                            })
                            loadData()
                          }}
                          options={Object.entries(STATUS_CONFIG).map(([v, { label }]) => ({ value: v, label }))}
                          style={{ fontSize: 11 }}
                        />
                      </td>

                      <td style={{ padding: '4px 8px', borderLeft: '1px solid var(--glass-border)', minWidth: 120 }}>
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
                              padding: '4px 6px',
                              display: 'flex',
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
                              padding: '4px 6px',
                              display: 'flex',
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
                              padding: '4px 6px',
                              display: 'flex',
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
                  {tableOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toLocaleString()}
                </td>
                <td colSpan={6} />
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
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
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
                  {order.total_amount || 0}
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
                                    body: JSON.stringify({ price: parseFloat(editMenuPrice) }),
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
