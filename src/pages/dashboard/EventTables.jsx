import { useState, useCallback, useEffect } from 'react'
import { Settings, Plus, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const STATUS_COLORS = {
  available: { bg: 'rgba(0,195,122,0.1)', border: '#00C37A', label: 'פנוי', color: '#00C37A' },
  reserved: { bg: 'rgba(245,158,11,0.1)', border: '#F59E0B', label: 'שמור', color: '#F59E0B' },
  active: { bg: 'rgba(59,130,246,0.1)', border: '#3B82F6', label: 'פעיל', color: '#3B82F6' },
  closed: { bg: 'rgba(107,114,128,0.1)', border: '#6B7280', label: 'סגור', color: '#6B7280' },
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

export default function EventTables({ eventId, businessId, authHeaders }) {
  const [tables, setTables] = useState([])
  const [tableOrders, setTableOrders] = useState([])
  const [menu, setMenu] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [selectedTable, setSelectedTable] = useState(null)
  const [showAddTable, setShowAddTable] = useState(false)
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showAddStaff, setShowAddStaff] = useState(false)

  const [tableForm, setTableForm] = useState({
    table_number: '',
    table_name: '',
    capacity: 4,
    min_spend: 0,
    notes: '',
  })
  const [menuForm, setMenuForm] = useState({ name: '', category: 'drinks', price: '' })
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'waitress' })

  const [orderForm, setOrderForm] = useState({
    event_table_id: '',
    customer_name: '',
    customer_phone: '',
    customer_id_number: '',
    guests: [],
    payments: [{ type: 'credit', amount: '', payer: '' }],
    tip_amount: 0,
    total_amount: 0,
    waitress_name: '',
    promoter_id: '',
    source: 'manual',
  })
  const [newGuest, setNewGuest] = useState({ name: '', phone: '' })

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
      setMenu(m.menu || [])
      setStaff(s.staff || [])
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

  if (loading) {
    return (
      <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, padding: 24, textAlign: 'center' }}>
        טוען שולחנות…
      </p>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[
            { id: 'grid', label: 'גריד' },
            { id: 'list', label: 'רשימה' },
            { id: 'manage', label: 'תפריט וצוות' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: view === v.id ? 'none' : '1px solid var(--glass-border)',
                background: view === v.id ? 'rgba(0,195,122,0.12)' : 'transparent',
                color: view === v.id ? '#00C37A' : 'var(--text)',
                fontWeight: view === v.id ? 700 : 400,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>ניהול שולחנות</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
            {tables.filter((t) => t.status === 'active').length}
            {' '}
            פעילים ·
            {tables.filter((t) => t.status === 'reserved').length}
            {' '}
            שמורים ·
            {tables.filter((t) => t.status === 'available').length}
            {' '}
            פנויים
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowAddTable(true)}
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
            <Settings size={14} color="#00C37A" />
            {' '}
            הגדר שולחנות
          </button>
          <button
            type="button"
            onClick={() => setShowAddOrder(true)}
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
            {' '}
            הוסף הזמנת שולחן
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'סה"כ שולחנות', value: tables.length, color: '#00C37A' },
          { label: 'הזמנות', value: tableOrders.length, color: '#3B82F6' },
          {
            label: 'הכנסות שולחנות',
            value: `₪${tableOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toLocaleString()}`,
            color: '#8B5CF6',
          },
          {
            label: 'אפסייל ממתין',
            value: tableOrders.reduce(
              (s, o) => s + (o.items || []).filter((i) => i.is_upsell && i.status === 'pending').length,
              0,
            ),
            color: '#F59E0B',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: 'var(--card)',
              borderRadius: 10,
              padding: 14,
              border: '1px solid var(--glass-border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {view === 'manage' && (
        <div style={{ marginBottom: 24, display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>תפריט שולחן</h4>
              <button
                type="button"
                onClick={() => setShowAddMenu(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + פריט
              </button>
            </div>
            {menu.length === 0 ? (
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}>אין פריטים</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}>
                {menu.map((it) => (
                  <li
                    key={it.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--glass-border)',
                    }}
                  >
                    <span>{it.name}</span>
                    <span style={{ color: '#00C37A' }}>
                      ₪
                      {Number(it.price || 0).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>צוות</h4>
              <button
                type="button"
                onClick={() => setShowAddStaff(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + איש צוות
              </button>
            </div>
            {staff.length === 0 ? (
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}>אין אנשי צוות</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13 }}>
                {staff.map((st) => (
                  <li
                    key={st.id}
                    style={{ padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}
                  >
                    <strong>{st.name}</strong>
                    {' '}
                    ·
                    {st.phone}
                    {' '}
                    ·
                    {st.role}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div style={{ border: '1px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          {tables.map((table) => {
            const sc = STATUS_COLORS[table.status] || STATUS_COLORS.available
            const order = tableOrders.find((o) => o.event_table_id === table.id && o.status !== 'closed')
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTable(table)}
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid var(--glass-border)',
                  background: 'var(--card)',
                  cursor: 'pointer',
                  textAlign: 'right',
                  color: 'var(--text)',
                }}
              >
                <span style={{ fontWeight: 800, color: sc.color }}>
                  שולחן
                  {table.table_number}
                </span>
                <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>
                  {sc.label}
                  {order ? ` · ${order.customer_name}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {view === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {tables.map((table) => {
            const order = tableOrders.find((o) => o.event_table_id === table.id && o.status !== 'closed')
            const hasPendingUpsell = order?.items?.some((i) => i.is_upsell && i.status === 'pending')
            const sc = STATUS_COLORS[table.status] || STATUS_COLORS.available
            return (
              <div
                key={table.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTable(table)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedTable(table)
                  }
                }}
                style={{
                  background: sc.bg,
                  border: `2px solid ${sc.border}`,
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
                <div style={{ fontSize: 22, fontWeight: 800, color: sc.color }}>{table.table_number}</div>
                {table.table_name && (
                  <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>{table.table_name}</div>
                )}
                <div style={{ fontSize: 11, color: sc.color, marginTop: 4, fontWeight: 600 }}>{sc.label}</div>
                {order && (
                  <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>{order.customer_name}</div>
                )}
                {table.waitress_name && (
                  <div style={{ fontSize: 10, color: 'var(--v2-gray-400)' }}>
                    👩
                    {table.waitress_name}
                  </div>
                )}
              </div>
            )
          })}

          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowAddTable(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setShowAddTable(true)
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
              minHeight: 80,
              opacity: 0.6,
            }}
          >
            <Plus size={20} color="var(--v2-gray-400)" />
            <span style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 4 }}>הוסף שולחן</span>
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
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
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

            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>
              שולחן
              {selectedTable.table_number}
              {selectedTable.table_name && ` — ${selectedTable.table_name}`}
            </h3>

            {(() => {
              const order = tableOrders.find(
                (o) => o.event_table_id === selectedTable.id && o.status !== 'closed',
              )
              if (!order) {
                return (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--v2-gray-400)' }}>
                    <p>אין הזמנה פעילה</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTable(null)
                        setShowAddOrder(true)
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#00C37A',
                        color: '#000',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + הוסף הזמנה
                    </button>
                  </div>
                )
              }

              const pendingUpsells = order.items?.filter((i) => i.is_upsell && i.status === 'pending') || []
              const hdrs = authHeaders()

              return (
                <div>
                  <div style={{ background: 'var(--glass)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{order.customer_name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>{order.customer_phone}</p>
                    {order.waitress_name && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                        👩
                        {order.waitress_name}
                      </p>
                    )}
                  </div>

                  {pendingUpsells.length > 0 && (
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid #F59E0B',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12,
                      }}
                    >
                      <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#F59E0B' }}>
                        ⚡
                        {pendingUpsells.length}
                        {' '}
                        בקשות אפסייל ממתינות
                      </p>
                      {pendingUpsells.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 6,
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 13 }}>
                            {item.name}
                            {' '}
                            ×
                            {item.quantity}
                            {' '}
                            —
                            ₪
                            {item.total}
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch(`${API_BASE}/api/admin/events/${eventId}/table-items/${item.id}`, {
                                  method: 'PATCH',
                                  headers: hdrs,
                                  body: JSON.stringify({ status: 'approved' }),
                                })
                                loadData()
                              }}
                              style={{
                                padding: '3px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#00C37A',
                                color: '#000',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              ✅ אשר
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch(`${API_BASE}/api/admin/events/${eventId}/table-items/${item.id}`, {
                                  method: 'PATCH',
                                  headers: hdrs,
                                  body: JSON.stringify({ status: 'rejected' }),
                                })
                                loadData()
                              }}
                              style={{
                                padding: '3px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'rgba(239,68,68,0.2)',
                                color: '#EF4444',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              ❌ דחה
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>תשלומים:</p>
                    {(order.payments || []).map((p, i) => (
                      <div
                        key={i}
                        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}
                      >
                        <span style={{ color: 'var(--v2-gray-400)' }}>
                          {p.payer}
                          {' '}
                          —
                          {' '}
                          {p.type === 'credit' ? 'אשראי' : p.type === 'cash' ? 'מזומן' : p.type === 'bit' ? 'ביט' : p.type}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          ₪
                          {p.amount}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        fontSize: 15,
                        borderTop: '1px solid var(--glass-border)',
                        paddingTop: 6,
                        marginTop: 6,
                      }}
                    >
                      <span>סה&quot;כ</span>
                      <span style={{ color: '#00C37A' }}>
                        ₪
                        {order.total_amount}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                          method: 'PATCH',
                          headers: hdrs,
                          body: JSON.stringify({ status: 'active' }),
                        })
                        loadData()
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#3B82F6',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      ✅ הכנס
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                          method: 'PATCH',
                          headers: hdrs,
                          body: JSON.stringify({ status: 'closed' }),
                        })
                        loadData()
                        setSelectedTable(null)
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#EF4444',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      🔒 סגור שולחן
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {showAddTable && (
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
              maxWidth: 420,
              width: '100%',
              border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowAddTable(false)}
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
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>הוספת שולחן</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={tableForm.table_number}
                onChange={(e) => setTableForm((f) => ({ ...f, table_number: e.target.value }))}
                placeholder="מספר שולחן *"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={tableForm.table_name}
                onChange={(e) => setTableForm((f) => ({ ...f, table_name: e.target.value }))}
                placeholder="שם (אופציונלי)"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={tableForm.capacity}
                onChange={(e) => setTableForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 4 }))}
                type="number"
                min={1}
                placeholder="קיבולת"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={tableForm.min_spend}
                onChange={(e) => setTableForm((f) => ({ ...f, min_spend: parseFloat(e.target.value) || 0 }))}
                type="number"
                placeholder="מינימום הזמנה"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <textarea
                value={tableForm.notes}
                onChange={(e) => setTableForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="הערות"
                rows={2}
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '8px 12px',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              <button
                type="button"
                disabled={!tableForm.table_number?.trim()}
                onClick={async () => {
                  const r = await fetch(`${API_BASE}/api/admin/events/${eventId}/tables`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      table_number: tableForm.table_number.trim(),
                      table_name: tableForm.table_name || null,
                      capacity: tableForm.capacity || 4,
                      min_spend: tableForm.min_spend || 0,
                      notes: tableForm.notes || null,
                    }),
                  })
                  if (!r.ok) {
                    toast.error('שמירת שולחן נכשלה')
                    return
                  }
                  setShowAddTable(false)
                  setTableForm({ table_number: '', table_name: '', capacity: 4, min_spend: 0, notes: '' })
                  loadData()
                  toast.success('שולחן נוסף')
                }}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  background: tableForm.table_number?.trim() ? '#00C37A' : 'var(--glass)',
                  color: tableForm.table_number?.trim() ? '#000' : 'var(--v2-gray-400)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                שמור שולחן
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMenu && (
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
              onClick={() => setShowAddMenu(false)}
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
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>פריט תפריט</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={menuForm.name}
                onChange={(e) => setMenuForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="שם *"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={menuForm.category}
                onChange={(e) => setMenuForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="קטגוריה"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={menuForm.price}
                onChange={(e) => setMenuForm((f) => ({ ...f, price: e.target.value }))}
                type="number"
                placeholder="מחיר"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                disabled={!menuForm.name?.trim()}
                onClick={async () => {
                  const r = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      name: menuForm.name.trim(),
                      category: menuForm.category || 'drinks',
                      price: parseFloat(menuForm.price) || 0,
                    }),
                  })
                  if (!r.ok) {
                    toast.error('שמירה נכשלה')
                    return
                  }
                  setShowAddMenu(false)
                  setMenuForm({ name: '', category: 'drinks', price: '' })
                  loadData()
                  toast.success('נשמר')
                }}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  background: menuForm.name?.trim() ? '#00C37A' : 'var(--glass)',
                  color: menuForm.name?.trim() ? '#000' : 'var(--v2-gray-400)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                הוסף
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddStaff && (
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
              onClick={() => setShowAddStaff(false)}
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
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>איש צוות</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={staffForm.name}
                onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="שם *"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={staffForm.phone}
                onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="טלפון *"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <CustomSelect
                value={staffForm.role}
                onChange={(v) => setStaffForm((f) => ({ ...f, role: v }))}
                options={[
                  { value: 'waitress', label: 'מלצרית' },
                  { value: 'promoter', label: 'יחצ״ן' },
                ]}
              />
              <button
                type="button"
                disabled={!staffForm.name?.trim() || !staffForm.phone?.trim()}
                onClick={async () => {
                  const r = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      name: staffForm.name.trim(),
                      phone: staffForm.phone.trim(),
                      role: staffForm.role,
                    }),
                  })
                  if (!r.ok) {
                    toast.error('שמירה נכשלה')
                    return
                  }
                  setShowAddStaff(false)
                  setStaffForm({ name: '', phone: '', role: 'waitress' })
                  loadData()
                  toast.success('נוסף')
                }}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  background: staffForm.name?.trim() && staffForm.phone?.trim() ? '#00C37A' : 'var(--glass)',
                  color: staffForm.name?.trim() && staffForm.phone?.trim() ? '#000' : 'var(--v2-gray-400)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddOrder && (
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
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--glass-border)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowAddOrder(false)}
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
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>הזמנת שולחן חדשה</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CustomSelect
                value={orderForm.event_table_id}
                onChange={(v) => setOrderForm((f) => ({ ...f, event_table_id: v }))}
                placeholder="בחר שולחן..."
                options={tables
                  .filter((t) => t.status === 'available')
                  .map((t) => ({
                    value: t.id,
                    label: `שולחן ${t.table_number}${t.table_name ? ` — ${t.table_name}` : ''} (${t.capacity} אנשים)`,
                  }))}
              />

              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)' }}>לקוח ראשי</p>
              <input
                value={orderForm.customer_name}
                onChange={(e) => setOrderForm((f) => ({ ...f, customer_name: e.target.value }))}
                placeholder="שם מלא *"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={orderForm.customer_phone}
                onChange={(e) => setOrderForm((f) => ({ ...f, customer_phone: e.target.value }))}
                placeholder="טלפון *"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />
              <input
                value={orderForm.customer_id_number || ''}
                onChange={(e) => setOrderForm((f) => ({ ...f, customer_id_number: e.target.value }))}
                placeholder="ת.ז (אופציונלי)"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />

              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)' }}>חברי שולחן</p>
              {orderForm.guests.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 13 }}>
                    {g.name}
                    {' '}
                    —
                    {g.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((f) => ({ ...f, guests: f.guests.filter((_, idx) => idx !== i) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={newGuest.name}
                  onChange={(e) => setNewGuest((g) => ({ ...g, name: e.target.value }))}
                  placeholder="שם חבר שולחן"
                  style={{
                    flex: 2,
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 8px',
                    fontSize: 13,
                  }}
                />
                <input
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest((g) => ({ ...g, phone: e.target.value }))}
                  placeholder="טלפון"
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 8px',
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newGuest.name) return
                    setOrderForm((f) => ({ ...f, guests: [...f.guests, newGuest] }))
                    setNewGuest({ name: '', phone: '' })
                  }}
                  style={{
                    height: 36,
                    padding: '0 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#00C37A',
                    color: '#000',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>

              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)' }}>תשלומים</p>
              {orderForm.payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <CustomSelect
                    value={p.type}
                    onChange={(v) =>
                      setOrderForm((f) => ({
                        ...f,
                        payments: f.payments.map((pm, idx) => (idx === i ? { ...pm, type: v } : pm)),
                      }))}
                    options={[
                      { value: 'credit', label: 'אשראי' },
                      { value: 'cash', label: 'מזומן' },
                      { value: 'bit', label: 'ביט' },
                      { value: 'bar_credit', label: 'קופת בר' },
                    ]}
                    style={{ width: 110 }}
                  />
                  <input
                    value={p.payer}
                    onChange={(e) =>
                      setOrderForm((f) => ({
                        ...f,
                        payments: f.payments.map((pm, idx) =>
                          idx === i ? { ...pm, payer: e.target.value } : pm),
                      }))}
                    placeholder="שם משלם"
                    style={{
                      flex: 1,
                      minWidth: 80,
                      height: 36,
                      borderRadius: 6,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      padding: '0 8px',
                      fontSize: 13,
                    }}
                  />
                  <input
                    value={p.amount}
                    onChange={(e) => {
                      const payments = orderForm.payments.map((pm, idx) =>
                        idx === i ? { ...pm, amount: e.target.value } : pm)
                      const total = payments.reduce((s, pm) => s + parseFloat(pm.amount || 0), 0)
                      setOrderForm((f) => ({ ...f, payments, total_amount: total }))
                    }}
                    placeholder="₪"
                    type="number"
                    style={{
                      width: 70,
                      height: 36,
                      borderRadius: 6,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      padding: '0 8px',
                      fontSize: 13,
                    }}
                  />
                  {orderForm.payments.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setOrderForm((f) => ({ ...f, payments: f.payments.filter((_, idx) => idx !== i) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setOrderForm((f) => ({
                    ...f,
                    payments: [...f.payments, { type: 'credit', amount: '', payer: '' }],
                  }))}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: '1px dashed var(--glass-border)',
                  borderRadius: 6,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  color: 'var(--v2-gray-400)',
                  fontSize: 12,
                }}
              >
                + הוסף תשלום
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                    סה&quot;כ
                  </label>
                  <input
                    value={orderForm.total_amount}
                    readOnly
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: '#00C37A',
                      fontWeight: 700,
                      padding: '0 12px',
                      fontSize: 15,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>טיפ</label>
                  <input
                    value={orderForm.tip_amount}
                    onChange={(e) => setOrderForm((f) => ({ ...f, tip_amount: e.target.value }))}
                    type="number"
                    placeholder="₪0"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <input
                value={orderForm.waitress_name || ''}
                onChange={(e) => setOrderForm((f) => ({ ...f, waitress_name: e.target.value }))}
                placeholder="שם מלצרית (אופציונלי)"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />

              <button
                type="button"
                disabled={!orderForm.event_table_id || !orderForm.customer_name || !orderForm.customer_phone}
                onClick={async () => {
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      ...orderForm,
                      event_table_id: orderForm.event_table_id || null,
                      payments: orderForm.payments.map((pm) => ({
                        ...pm,
                        amount: parseFloat(pm.amount) || 0,
                      })),
                      tip_amount: parseFloat(orderForm.tip_amount) || 0,
                      total_amount: parseFloat(orderForm.total_amount) || 0,
                    }),
                  })
                  setShowAddOrder(false)
                  setOrderForm({
                    event_table_id: '',
                    customer_name: '',
                    customer_phone: '',
                    customer_id_number: '',
                    guests: [],
                    payments: [{ type: 'credit', amount: '', payer: '' }],
                    tip_amount: 0,
                    total_amount: 0,
                    waitress_name: '',
                    promoter_id: '',
                    source: 'manual',
                  })
                  loadData()
                  toast.success('הזמנת שולחן נוצרה!')
                }}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  background:
                    orderForm.event_table_id && orderForm.customer_name ? '#00C37A' : 'var(--glass)',
                  color:
                    orderForm.event_table_id && orderForm.customer_name ? '#000' : 'var(--v2-gray-400)',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                צור הזמנת שולחן
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
