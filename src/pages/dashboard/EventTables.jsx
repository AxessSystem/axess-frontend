import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Trash2, QrCode, MessageCircle, RotateCcw, Grid, Table as TableIcon, X,
  UtensilsCrossed, Share2, Link, Users, Pencil, Check, AlertTriangle, Armchair,
  Edit, ClipboardList, Wine, CreditCard, Bell, FileText, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'
import TableMenuSelector from '../../components/TableMenuSelector'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const PUBLIC_TABLE_ORIGIN = 'https://axess.pro'

function TableAssignConfirmModal({ title, message, confirmText, confirmColor = '#00C37A', onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10002,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      role="presentation"
    >
      <div style={{
        background: 'var(--card)', borderRadius: 16,
        padding: 28, maxWidth: 380, width: '100%',
        border: '1px solid var(--glass-border)', textAlign: 'center',
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <AlertTriangle size={36} strokeWidth={1.75} color="#F59E0B" aria-hidden />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: '1px solid var(--glass-border)',
              background: 'transparent', color: 'var(--text)',
              fontSize: 15, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10, border: 'none',
              background: confirmColor, color: '#000',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

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

const TABLE_EDIT_TABS = [
  { id: 'details', label: 'פרטים', Icon: ClipboardList },
  { id: 'guests', label: 'חברי שולחן', Icon: Users },
  { id: 'account', label: 'חשבון', Icon: CreditCard },
  { id: 'requests', label: 'בקשות / אפסייל', Icon: Bell },
  { id: 'staff', label: 'צוות', Icon: Users },
  { id: 'menu', label: 'תפריט', Icon: UtensilsCrossed },
]

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

function TableEditDetails({
  order, availableTables, staffList, promoters, authHeaders, eventId, businessId, editModalOpenId, onUpdate, onOpenStaffTab, loadData, onRequestDelete, templateTables, tableNameOptions, setTableNameOptions,
}) {
  const [form, setForm] = useState({
    table_number: order.table_number != null ? String(order.table_number) : '',
    table_name: order.category || order.table_name || '',
    waitress_name: order.waitress_name || '',
    status: order.status || 'pending_approval',
    promoter_name: order.promoter_name || '',
    promoter_commission_pct: order.promoter_commission_pct ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [tableNameOptionsState, setTableNameOptionsState] = useState([
    'VIP', 'בר', 'טרס', 'מרכז', 'כניסה', 'פינה', 'גן', 'גג',
  ])
  const [showAddTableName, setShowAddTableName] = useState(false)
  const [newTableNameInput, setNewTableNameInput] = useState('')
  const [showAddWaitress, setShowAddWaitress] = useState(false)
  const [newWaitress, setNewWaitress] = useState({
    name: '', last_name: '', phone: '',
    tables_assigned: [],
    save_to_venue: true, save_to_event: true, wa_notifications: true,
  })
  const [showAddPromoter, setShowAddPromoter] = useState(false)
  const [newPromoter, setNewPromoter] = useState({
    name: '', phone: '',
    commission_type: 'percent',
    commission_value: 0,
    save_to_venue: true, save_to_event: true, wa_notifications: false,
  })

  const save = async () => {
    setSaving(true)
    try {
      console.log('Saving table details:', {
        orderId: order.id,
        table_number_display: form.table_number,
        form,
      });
      const res = await fetch(
        `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            waitress_name: form.waitress_name,
            status: form.status,
            promoter_name: form.promoter_name,
            promoter_commission_pct: form.promoter_commission_pct,
            table_number_display: form.table_number,
            category: form.table_name,
          }),
        },
      )
      if (res.ok) {
        toast.success('פרטים נשמרו ✓')
        onUpdate(form)
      } else toast.error('שגיאה בשמירה')
    } catch {
      toast.error('שגיאה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--text)' }}>
          בחר שולחן להקצות להזמנה מספר #
          {order.id?.slice(-6).toUpperCase()}
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--v2-gray-400)', textAlign: 'right' }}>
          הקצאת שולחן
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={form.table_number}
            onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value }))}
            placeholder="הקלד מספר..."
            style={{
              flex: 1, minHeight: 48, padding: '12px 16px', borderRadius: 10,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
            }}
          />
          <CustomSelect
            value={form.table_number}
            onChange={(v) => setForm((f) => ({ ...f, table_number: v }))}
            placeholder="בחר מרשימה..."
            searchable
            options={templateTables
              .sort((a, b) => Number(a.table_number) - Number(b.table_number))
              .map((t) => ({
                value: t.table_number,
                label: `${t.table_number}${t.table_name ? ` — ${t.table_name}` : ''}`,
              }))}
            menuStyle={{ maxHeight: 220, overflowY: 'auto' }}
            style={{ width: 160 }}
          />
        </div>
        {form.table_number && (
          <div style={{
            padding: '10px 16px', borderRadius: 10,
            background: 'rgba(0,195,122,0.08)', border: '1px solid rgba(0,195,122,0.2)',
            fontSize: 14, fontWeight: 700, color: '#00C37A', textAlign: 'right',
          }}
          >
            שולחן
            {' '}
            {form.table_number}
            {' '}
            נבחר ✓
          </div>
        )}
      </div>

      <div>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>
          שם/סוג שולחן
        </label>
        <CustomSelect
          value={form.table_name}
          onChange={(v) => {
            if (v === '__add__') {
              setShowAddTableName(true)
              return
            }
            setForm((f) => ({ ...f, table_name: v }))
            setShowAddTableName(false)
          }}
          placeholder="שם/סוג שולחן..."
          searchable
          options={[
            ...(tableNameOptions || tableNameOptionsState).map((n) => ({ value: n, label: n })),
            { value: '__add__', label: '+ הוסף חדש' },
          ]}
          menuStyle={{ maxHeight: 220, overflowY: 'auto' }}
        />
        {showAddTableName && (
          <div style={{
            marginTop: 8, padding: '12px', borderRadius: 10,
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            display: 'flex', gap: 8,
          }}
          >
            <button
              type="button"
              onClick={() => {
                if (!newTableNameInput.trim()) return
                  if (tableNameOptions) {
                    setTableNameOptions((prev) => [...prev, newTableNameInput.trim()])
                  } else {
                    setTableNameOptionsState((prev) => [...prev, newTableNameInput.trim()])
                  }
                setForm((f) => ({ ...f, table_name: newTableNameInput.trim() }))
                setNewTableNameInput('')
                setShowAddTableName(false)
              }}
              style={{
                padding: '8px 16px', borderRadius: 8, background: '#00C37A',
                border: 'none', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                minHeight: 44,
              }}
            >
              הוסף
            </button>
            <input
              value={newTableNameInput}
              onChange={(e) => setNewTableNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!newTableNameInput.trim()) return
                  if (tableNameOptions) {
                    setTableNameOptions((prev) => [...prev, newTableNameInput.trim()])
                  } else {
                    setTableNameOptionsState((prev) => [...prev, newTableNameInput.trim()])
                  }
                  setForm((f) => ({ ...f, table_name: newTableNameInput.trim() }))
                  setNewTableNameInput('')
                  setShowAddTableName(false)
                }
              }}
              placeholder="שם חדש..."
              autoFocus
              style={{
                flex: 1, minHeight: 44, padding: '10px 14px', borderRadius: 8,
                background: 'var(--card)', border: '1px solid var(--glass-border)',
                color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>
          מלצרית
        </label>
        <CustomSelect
          value={form.waitress_name}
          onChange={(v) => {
            if (v === '__new__') {
              setShowAddWaitress(true)
              return
            }
            setForm((f) => ({ ...f, waitress_name: v }))
          }}
          placeholder="בחר מלצרית..."
          options={[
            ...(staffList || []).filter((s) => s.role === 'waitress').map((s) => ({ value: s.name, label: s.name })),
            { value: '__new__', label: '+ הוסף מלצרית חדשה' },
          ]}
          menuStyle={{ maxHeight: 220, overflowY: 'auto' }}
        />
        {showAddWaitress && (
          <div style={{
            marginTop: 12, padding: 16, borderRadius: 12,
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
          }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setShowAddWaitress(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', fontSize: 16 }}
              >
                ✕
              </button>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>הוספת מלצרית</p>
            </div>
            {[
              { field: 'name', placeholder: 'שם פרטי' },
              { field: 'last_name', placeholder: 'שם משפחה' },
              { field: 'phone', placeholder: 'מספר נייד' },
            ].map(({ field, placeholder }) => (
              <input
                key={field}
                value={newWaitress[field]}
                onChange={(e) => setNewWaitress((w) => ({ ...w, [field]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  width: '100%', minHeight: 48, padding: '10px 14px', borderRadius: 8, marginBottom: 8,
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
                }}
              />
            ))}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>
                שולחנות משויכים
              </label>
              <CustomSelect
                value=""
                onChange={(v) => {
                  if (!newWaitress.tables_assigned.includes(v)) {
                    setNewWaitress((w) => ({ ...w, tables_assigned: [...w.tables_assigned, v] }))
                  }
                }}
                placeholder="הוסף שולחן..."
            options={(templateTables || [])
              .sort((a, b) => Number(a.table_number) - Number(b.table_number))
              .map((t) => ({ value: t.table_number, label: t.table_number }))}
                menuStyle={{ maxHeight: 180, overflowY: 'auto' }}
              />
              {newWaitress.tables_assigned.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {newWaitress.tables_assigned.map((t) => (
                    <span key={t} style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12,
                      background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)',
                      color: '#00C37A', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => setNewWaitress((w) => ({ ...w, tables_assigned: w.tables_assigned.filter((x) => x !== t) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 14, padding: 0 }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {[
              { field: 'save_to_venue', label: 'שמור לצוות המקום' },
              { field: 'save_to_event', label: 'שמור לאירוע זה בלבד' },
              { field: 'wa_notifications', label: 'קבל התראות WhatsApp' },
            ].map(({ field, label }) => (
              <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'flex-end', cursor: 'pointer' }}>
                <span style={{ fontSize: 13 }}>{label}</span>
                <input
                  type="checkbox"
                  checked={newWaitress[field]}
                  onChange={(e) => setNewWaitress((w) => ({ ...w, [field]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#00C37A' }}
                />
              </label>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!newWaitress.name) return
                  try {
                    await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, {
                      method: 'POST',
                      headers: authHeaders(),
                      body: JSON.stringify({
                        name: `${newWaitress.name} ${newWaitress.last_name}`.trim(),
                        phone: newWaitress.phone,
                        role: 'waitress',
                        wa_notifications: newWaitress.wa_notifications,
                        tables_assigned: newWaitress.tables_assigned,
                      }),
                    })
                    setForm((f) => ({ ...f, waitress_name: `${newWaitress.name} ${newWaitress.last_name}`.trim() }))
                    setShowAddWaitress(false)
                    toast.success('מלצרית נוספה ✓')
                    await loadData?.()
                  } catch {
                    toast.error('שגיאה')
                  }
                }}
                style={{
                  flex: 1, minHeight: 48, borderRadius: 10, background: '#00C37A',
                  border: 'none', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                שמור מלצרית
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setShowAddWaitress(false); onOpenStaffTab?.() }}
              style={{
                width: '100%', minHeight: 48, marginTop: 8, padding: '8px 0', background: 'none',
                border: 'none', color: '#00C37A', fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              לניהול צוות מלא ←
            </button>
          </div>
        )}
      </div>

      <div>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>
          יחצ"ן
        </label>
        <CustomSelect
          value={form.promoter_name}
          onChange={(v) => {
            if (v === '__new__') {
              setShowAddPromoter(true)
              return
            }
            setForm((f) => ({ ...f, promoter_name: v }))
          }}
          placeholder="בחר יחצן..."
          options={[
            ...(promoters || []).map((p) => ({ value: p.name, label: p.name })),
            { value: '__new__', label: '+ הוסף יחצן חדש' },
          ]}
          menuStyle={{ maxHeight: 220, overflowY: 'auto' }}
        />
        {showAddPromoter && (
          <div style={{
            marginTop: 12, padding: 16, borderRadius: 12,
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
          }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setShowAddPromoter(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
              >
                ✕
              </button>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>הוספת יחצ"ן</p>
            </div>
            {[
              { field: 'name', placeholder: 'שם מלא' },
              { field: 'phone', placeholder: 'טלפון' },
            ].map(({ field, placeholder }) => (
              <input
                key={field}
                value={newPromoter[field]}
                onChange={(e) => setNewPromoter((p) => ({ ...p, [field]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  width: '100%', minHeight: 48, padding: '10px 14px', borderRadius: 8, marginBottom: 8,
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
                }}
              />
            ))}
            <div style={{ marginBottom: 8 }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--v2-gray-400)', textAlign: 'right' }}>סוג עמלה</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'percent', label: '% מהכרטיס' },
                  { value: 'fixed', label: 'סכום קבוע לכרטיס' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewPromoter((p) => ({ ...p, commission_type: opt.value }))}
                    style={{
                      flex: 1, minHeight: 48, padding: '8px 12px', borderRadius: 8, fontSize: 13,
                      background: newPromoter.commission_type === opt.value ? 'rgba(0,195,122,0.1)' : 'var(--glass)',
                      border: `1px solid ${newPromoter.commission_type === opt.value ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`,
                      color: newPromoter.commission_type === opt.value ? '#00C37A' : 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={newPromoter.commission_value}
              onChange={(e) => setNewPromoter((p) => ({ ...p, commission_value: Number(e.target.value) }))}
              placeholder={newPromoter.commission_type === 'percent' ? 'אחוז עמלה (%)' : 'סכום עמלה (₪)'}
              style={{
                width: '100%', minHeight: 48, padding: '10px 14px', borderRadius: 8, marginBottom: 8,
                background: 'var(--card)', border: '1px solid var(--glass-border)',
                color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
              }}
            />
            {[
              { field: 'save_to_venue', label: 'שמור לצוות המקום' },
              { field: 'save_to_event', label: 'שמור לאירוע זה בלבד' },
              { field: 'wa_notifications', label: 'קבל התראות WhatsApp' },
            ].map(({ field, label }) => (
              <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'flex-end', cursor: 'pointer' }}>
                <span style={{ fontSize: 13 }}>{label}</span>
                <input
                  type="checkbox"
                  checked={newPromoter[field]}
                  onChange={(e) => setNewPromoter((p) => ({ ...p, [field]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#00C37A' }}
                />
              </label>
            ))}
            <button
              type="button"
              onClick={async () => {
                if (!newPromoter.name || !newPromoter.phone) return
                try {
                  const createRes = await fetch(`${API_BASE}/api/admin/promoters`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      business_id: order.business_id,
                      name: newPromoter.name,
                      first_name: newPromoter.name.split(' ')[0] || newPromoter.name,
                      last_name: newPromoter.name.split(' ').slice(1).join(' ') || null,
                      phone: newPromoter.phone,
                    }),
                  })
                  const created = await createRes.json()
                  if (!createRes.ok || !created?.id) throw new Error('create_failed')
                  if (newPromoter.save_to_event) {
                    await fetch(`${API_BASE}/api/admin/events/${eventId}/promoters`, {
                      method: 'POST',
                      headers: authHeaders(),
                      body: JSON.stringify({
                        promoter_id: created.id,
                        commission_type: newPromoter.commission_type === 'percent' ? 'pct' : 'fixed',
                        commission_value: Number(newPromoter.commission_value) || 0,
                      }),
                    })
                  }
                  setForm((f) => ({ ...f, promoter_name: created.name || newPromoter.name }))
                  setShowAddPromoter(false)
                  toast.success('יחצ"ן נוסף ✓')
                  await loadData?.()
                } catch {
                  toast.error('שגיאה')
                }
              }}
              style={{
                width: '100%', minHeight: 48, borderRadius: 10, background: '#00C37A',
                border: 'none', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8,
              }}
            >
              שמור יחצ"ן
            </button>
          </div>
        )}
      </div>

      <div>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>
          סטטוס
        </label>
        <CustomSelect
          value={form.status}
          onChange={async (v) => {
            if (v === 'delete') {
              onRequestDelete?.()
              return
            }
            setForm((f) => ({ ...f, status: v }))
          }}
          placeholder="בחר סטטוס..."
          options={[
            { value: 'pending_approval', label: 'שולחן ממתין לאישור' },
            { value: 'active', label: 'שולחן פעיל' },
            { value: 'cancelled', label: 'שולחן מבוטל' },
            { value: 'closed', label: 'שולחן הסתיים' },
            { value: 'delete', label: '🗑️ מחק שולחן מרשימה' },
          ]}
          menuStyle={{ maxHeight: 240, overflowY: 'auto' }}
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          minHeight: 48, borderRadius: 12, background: '#00C37A',
          border: 'none', color: '#000', fontSize: 15, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1,
          marginTop: 80,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {saving ? 'שומר...' : 'שמור פרטים'}
      </button>
    </div>
  )
}

function TableEditGuests({ order, authHeaders, eventId, onUpdate }) {
  const guests = (() => {
    const g = order.guests
    if (!g) return []
    if (Array.isArray(g)) return g
    try {
      return JSON.parse(g)
    } catch {
      return []
    }
  })()

  const [localGuests, setLocalGuests] = useState(guests)
  const [saving, setSaving] = useState(false)
  const [editingHost, setEditingHost] = useState(false)
  const [hostForm, setHostForm] = useState({
    customer_name: order.customer_name || '',
    customer_last_name: order.customer_last_name || '',
    customer_phone: order.customer_phone || '',
    customer_email: order.customer_email || '',
  })

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ guests: localGuests, guest_count: localGuests.length + 1 }),
        },
      )
      if (res.ok) {
        toast.success('חברי שולחן נשמרו ✓')
        onUpdate({ guests: localGuests })
      } else toast.error('שגיאה בשמירה')
    } catch {
      toast.error('שגיאה')
    } finally {
      setSaving(false)
    }
  }

  const sendQR = async (_phone, name) => {
    toast.success(`QR נשלח ל-${name} ✓`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{
        background: 'rgba(0,195,122,0.08)',
        border: '1px solid rgba(0,195,122,0.2)',
        borderRadius: 12, padding: '16px', marginBottom: 12,
      }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => sendQR(order.customer_phone, order.customer_name)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 11,
                background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)',
                color: '#00C37A', cursor: 'pointer',
              }}
            >
              📱 QR
            </button>
            <button
              type="button"
              onClick={() => setEditingHost((e) => !e)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 11,
                background: editingHost ? 'rgba(0,195,122,0.15)' : 'var(--glass)',
                border: '1px solid var(--glass-border)',
                color: editingHost ? '#00C37A' : 'var(--v2-gray-400)',
                cursor: 'pointer',
              }}
            >
              {editingHost ? 'סגור' : 'ערוך'}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#00C37A' }}>👑 ראש שולחן</p>
        </div>

        {editingHost ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { field: 'customer_name', placeholder: 'שם פרטי' },
              { field: 'customer_last_name', placeholder: 'שם משפחה' },
              { field: 'customer_phone', placeholder: 'טלפון' },
              { field: 'customer_email', placeholder: 'מייל' },
            ].map(({ field, placeholder }) => (
              <input
                key={field}
                value={hostForm[field]}
                onChange={(e) => setHostForm((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 14, textAlign: 'right',
                  boxSizing: 'border-box', width: '100%', minHeight: 44,
                }}
              />
            ))}
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(
                    `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`,
                    {
                      method: 'PATCH',
                      headers: authHeaders(),
                      body: JSON.stringify(hostForm),
                    },
                  )
                  if (res.ok) {
                    toast.success('פרטי ראש שולחן נשמרו ✓')
                    onUpdate(hostForm)
                    setEditingHost(false)
                  } else toast.error('שגיאה בשמירה')
                } catch {
                  toast.error('שגיאה')
                }
              }}
              style={{
                gridColumn: '1 / -1', minHeight: 44, borderRadius: 10,
                background: '#00C37A', border: 'none',
                color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              שמור פרטי ראש שולחן
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>
              {order.customer_name}
              {' '}
              {order.customer_last_name || ''}
            </p>
            {order.customer_phone && (
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
                📱
                {' '}
                {order.customer_phone}
              </p>
            )}
            {order.customer_email && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                ✉️
                {' '}
                {order.customer_email}
              </p>
            )}
            <span style={{
              display: 'inline-block', marginTop: 6,
              padding: '2px 10px', borderRadius: 20, fontSize: 11,
              background: 'rgba(0,195,122,0.15)', color: '#00C37A',
            }}
            >
              חינם
            </span>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button"
                onClick={async () => {
                  const res = await fetch(
                    `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}/checkin`,
                    {
                      method: 'PATCH',
                      headers: authHeaders(),
                      body: JSON.stringify({ guest_index: -1 }),
                    }
                  );
                  if (res.ok) { toast.success('סומן כהגיע ✓'); onUpdate({}); }
                  else toast.error('שגיאה');
                }}
                style={{
                  flex: 1, minHeight: 36, borderRadius: 8, fontSize: 12,
                  background: order.checked_in_at ? 'rgba(0,195,122,0.15)' : 'rgba(0,195,122,0.08)',
                  border: `1px solid ${order.checked_in_at ? 'rgba(0,195,122,0.4)' : 'rgba(0,195,122,0.2)'}`,
                  color: '#00C37A', cursor: 'pointer', fontWeight: 600,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {order.checked_in_at ? '✓ הגיע' : '○ סמן הגיע'}
              </button>
              {order.checked_in_at && (
                <button type="button"
                  onClick={async () => {
                    const res = await fetch(
                      `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}/checkin`,
                      {
                        method: 'PATCH',
                        headers: authHeaders(),
                        body: JSON.stringify({ guest_index: -1, undo: true }),
                      }
                    );
                    if (res.ok) { toast.success('סומן כטרם הגיע'); onUpdate({}); }
                  }}
                  style={{
                    minHeight: 36, padding: '0 12px', borderRadius: 8, fontSize: 12,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#EF4444', cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  טרם הגיע
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {localGuests.map((g, i) => (
        <div
          key={i}
          style={{
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            borderRadius: 12, padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => sendQR(g.phone, g.first_name)}
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 11,
                  background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)',
                  color: '#00C37A', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                📱 QR
              </button>
              <button
                type="button"
                onClick={() => setLocalGuests((gs) => gs.filter((_, j) => j !== i))}
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 11,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11,
                background: g.is_free ? 'rgba(0,195,122,0.15)' : 'rgba(255,255,255,0.1)',
                color: g.is_free ? '#00C37A' : 'var(--v2-gray-400)',
              }}
              >
                {g.is_free ? 'חינם' : `₪${g.ticket_price || 0}`}
              </span>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {g.first_name}
                {' '}
                {g.last_name || ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { field: 'first_name', placeholder: 'שם פרטי' },
              { field: 'last_name', placeholder: 'שם משפחה' },
              { field: 'phone', placeholder: 'טלפון' },
              { field: 'email', placeholder: 'מייל' },
            ].map(({ field, placeholder }) => (
              <input
                key={field}
                value={g[field] || ''}
                onChange={(e) => setLocalGuests((gs) => gs.map((gg, j) => (
                  j === i ? { ...gg, [field]: e.target.value } : gg
                )))}
                placeholder={placeholder}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 16, textAlign: 'right',
                  boxSizing: 'border-box', width: '100%',
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
            <label style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>חינם</label>
            <input
              type="checkbox"
              checked={g.is_free || false}
              onChange={(e) => setLocalGuests((gs) => gs.map((gg, j) => (
                j === i ? { ...gg, is_free: e.target.checked } : gg
              )))}
            />
            {!g.is_free && (
              <input
                type="number"
                value={g.ticket_price || 0}
                onChange={(e) => setLocalGuests((gs) => gs.map((gg, j) => (
                  j === i ? { ...gg, ticket_price: Number(e.target.value) } : gg
                )))}
                placeholder="מחיר כרטיס"
                style={{
                  width: 100, padding: '6px 10px', borderRadius: 8,
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 16, textAlign: 'right',
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="button"
              onClick={async () => {
                const res = await fetch(
                  `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}/checkin`,
                  {
                    method: 'PATCH',
                    headers: authHeaders(),
                    body: JSON.stringify({ guest_index: i }),
                  }
                );
                if (res.ok) { toast.success('סומן כהגיע ✓'); onUpdate({}); }
                else toast.error('שגיאה');
              }}
              style={{
                flex: 1, minHeight: 36, borderRadius: 8, fontSize: 12,
                background: g.checked_in ? 'rgba(0,195,122,0.15)' : 'rgba(0,195,122,0.08)',
                border: `1px solid ${g.checked_in ? 'rgba(0,195,122,0.4)' : 'rgba(0,195,122,0.2)'}`,
                color: '#00C37A', cursor: 'pointer', fontWeight: 600,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {g.checked_in ? '✓ הגיע' : '○ סמן הגיע'}
            </button>
            {g.checked_in && (
              <button type="button"
                onClick={async () => {
                  const res = await fetch(
                    `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}/checkin`,
                    {
                      method: 'PATCH',
                      headers: authHeaders(),
                      body: JSON.stringify({ guest_index: i, undo: true }),
                    }
                  );
                  if (res.ok) { toast.success('סומן כטרם הגיע'); onUpdate({}); }
                }}
                style={{
                  minHeight: 36, padding: '0 12px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#EF4444', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                טרם הגיע
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setLocalGuests((gs) => [...gs, {
          first_name: '', last_name: '', phone: '', email: '', is_free: true,
        }])}
        style={{
          minHeight: 44, borderRadius: 10,
          background: 'var(--glass)', border: '1px dashed var(--glass-border)',
          color: '#00C37A', fontSize: 14, cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        + הוסף חבר שולחן
      </button>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          minHeight: 48, borderRadius: 12, background: '#00C37A',
          border: 'none', color: '#000', fontSize: 15, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {saving ? 'שומר...' : 'שמור חברי שולחן'}
      </button>
    </div>
  )
}

function TableEditOrder({ order, menuItems, authHeaders, eventId, onUpdate }) {
  const [menuSearch, setMenuSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [drink, setDrink] = useState(order.drink_name || '')
  const [quantity, setQuantity] = useState(order.drink_quantity || 1)
  const [extras, setExtras] = useState(() => {
    const e = order.extras_list || order.extras
    if (!e) return []
    if (Array.isArray(e)) return e
    try {
      return JSON.parse(e)
    } catch {
      return []
    }
  })
  const [price, setPrice] = useState(order.base_price || 0)
  const [discount, setDiscount] = useState(order.discount || 0)
  const [saving, setSaving] = useState(false)

  const total = Math.max(0, (Number(price) * Number(quantity)) - Number(discount))

  const filteredMenu = (menuItems || []).filter((item) =>
    !menuSearch || item.name?.includes(menuSearch) || item.category?.includes(menuSearch),
  )
  const extraItems = (menuItems || []).filter((item) => item.category === 'תוספות' || item.category === 'extras')

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            drink_name: drink,
            drink_quantity: quantity,
            extras_list: extras,
            base_price: price,
            discount,
            total_amount: total,
          }),
        },
      )
      if (res.ok) {
        toast.success('הזמנה נשמרה ✓')
        onUpdate({ drink_name: drink, total_amount: total })
      } else toast.error('שגיאה')
    } catch {
      toast.error('שגיאה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 8, textAlign: 'right' }}>
          🍾 שתייה (מהתפריט)
        </label>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="חיפוש בתפריט..."
            style={{
              width: '100%', minHeight: 44, padding: '10px 40px 10px 16px',
              borderRadius: 10, background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text)', fontSize: 15, textAlign: 'right',
              boxSizing: 'border-box',
            }}
          />
          <Search size={16} color="#00C37A" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredMenu
            .filter((item) => item.category !== 'תוספות' && item.category !== 'extras')
            .map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedItem(item)
                  setDrink(item.name)
                  setPrice(item.price || 0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedItem(item)
                    setDrink(item.name)
                    setPrice(item.price || 0)
                  }
                }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                  background: selectedItem?.id === item.id ? 'rgba(0,195,122,0.1)' : 'var(--glass)',
                  border: `1px solid ${selectedItem?.id === item.id ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#00C37A', fontWeight: 700 }}>
                    ₪
                    {item.price}
                  </span>
                  {selectedItem?.id === item.id && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setQuantity((q) => Math.max(1, q - 1))
                        }}
                        style={{
                          width: 28, height: 28, borderRadius: 6, background: 'var(--card)', border: '1px solid var(--glass-border)', color: 'var(--text)', cursor: 'pointer', fontSize: 16,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{quantity}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setQuantity((q) => q + 1)
                        }}
                        style={{
                          width: 28, height: 28, borderRadius: 6, background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)', color: '#00C37A', cursor: 'pointer', fontSize: 16,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 14 }}>{item.name}</span>
              </div>
            ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 8, textAlign: 'right' }}>
          כמות בקבוקים
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{
              width: 40, height: 40, borderRadius: 10, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', fontSize: 20, cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            −
          </button>
          <span style={{ fontSize: 20, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            style={{
              width: 40, height: 40, borderRadius: 10, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: '#00C37A', fontSize: 20, cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            +
          </button>
        </div>
      </div>

      {extraItems.length > 0 && (
        <div>
          <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 8, textAlign: 'right' }}>
            תוספות
          </label>
          {extraItems.map((item) => {
            const inExtras = extras.find((e) => e.id === item.id)
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setExtras((es) => {
                      const existing = es.find((e) => e.id === item.id)
                      if (existing) return es.map((e) => (e.id === item.id ? { ...e, qty: (e.qty || 1) + 1 } : e))
                      return [...es, { id: item.id, name: item.name, price: item.price, qty: 1 }]
                    })}
                    style={{
                      width: 28, height: 28, borderRadius: 6, background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)', color: '#00C37A', cursor: 'pointer', fontSize: 16,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    +
                  </button>
                  {inExtras && (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{inExtras.qty}</span>
                      <button
                        type="button"
                        onClick={() => setExtras((es) => {
                          const existing = es.find((e) => e.id === item.id)
                          if (existing?.qty <= 1) return es.filter((e) => e.id !== item.id)
                          return es.map((e) => (e.id === item.id ? { ...e, qty: e.qty - 1 } : e))
                        })}
                        style={{
                          width: 28, height: 28, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', cursor: 'pointer', fontSize: 16,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        −
                      </button>
                    </>
                  )}
                </div>
                <span style={{ fontSize: 13 }}>
                  {item.name}
                  {' '}
                  —
                  {' '}
                  ₪
                  {item.price}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'מחיר בקבוק ₪', value: price, setter: setPrice },
          { label: 'הנחה ₪', value: discount, setter: setDiscount },
        ].map(({ label, value, setter }) => (
          <div key={label}>
            <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>{label}</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px 16px', borderRadius: 10,
        background: 'rgba(0,195,122,0.08)', border: '1px solid rgba(0,195,122,0.2)',
        display: 'flex', justifyContent: 'space-between',
      }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: '#00C37A' }}>
          ₪
          {total.toLocaleString()}
        </span>
        <span style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>סה&quot;כ</span>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          minHeight: 48, borderRadius: 12, background: '#00C37A', border: 'none', color: '#000', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {saving ? 'שומר...' : 'שמור הזמנה'}
      </button>
    </div>
  )
}

function TableEditPayment({ order, authHeaders, eventId, onUpdate }) {
  const payNorm = normalizePayments(order)
  const [form, setForm] = useState({
    payment_1_amount: payNorm[0]?.amount ?? 0,
    payment_1_method: payNorm[0]?.method || payNorm[0]?.type || 'axess',
    payment_2_amount: payNorm[1]?.amount ?? 0,
    payment_2_method: payNorm[1]?.method || payNorm[1]?.type || 'cash',
    tip_amount: order.tip_amount || 0,
  })
  const [saving, setSaving] = useState(false)

  const PAYMENT_METHODS = [
    { value: 'axess', label: '💳 AXESS', color: '#00C37A' },
    { value: 'cash', label: '💵 מזומן', color: '#F59E0B' },
    { value: 'credit', label: '💳 אשראי קופה', color: '#8B5CF6' },
    { value: 'transfer', label: '📱 העברה', color: '#3B82F6' },
  ]

  const save = async () => {
    setSaving(true)
    try {
      const payments = [
        { amount: form.payment_1_amount, method: form.payment_1_method, type: form.payment_1_method },
        ...(form.payment_2_amount > 0 ? [{ amount: form.payment_2_amount, method: form.payment_2_method, type: form.payment_2_method }] : []),
      ]
      const res = await fetch(
        `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ payments, tip_amount: form.tip_amount }),
        },
      )
      if (res.ok) {
        toast.success('תשלום נשמר ✓')
        onUpdate({ payments })
      } else toast.error('שגיאה')
    } catch {
      toast.error('שגיאה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { label: 'תשלום 1', amountKey: 'payment_1_amount', methodKey: 'payment_1_method' },
        { label: 'תשלום 2', amountKey: 'payment_2_amount', methodKey: 'payment_2_method' },
      ].map(({ label, amountKey, methodKey }) => (
        <div
          key={label}
          style={{
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            borderRadius: 12, padding: 16,
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{label}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input
              type="number"
              value={form[amountKey]}
              onChange={(e) => setForm((f) => ({ ...f, [amountKey]: Number(e.target.value) }))}
              placeholder="סכום ₪"
              style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--card)', border: '1px solid var(--glass-border)',
                color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, [methodKey]: m.value }))}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12,
                  background: form[methodKey] === m.value ? `${m.color}22` : 'var(--glass)',
                  border: `1px solid ${form[methodKey] === m.value ? m.color : 'var(--glass-border)'}`,
                  color: form[methodKey] === m.value ? m.color : 'var(--v2-gray-400)',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>
          טיפ ₪
        </label>
        <input
          type="number"
          value={form.tip_amount}
          onChange={(e) => setForm((f) => ({ ...f, tip_amount: Number(e.target.value) }))}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          minHeight: 48, borderRadius: 12, background: '#00C37A', border: 'none', color: '#000', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {saving ? 'שומר...' : 'אשר תשלום'}
      </button>
    </div>
  )
}

function TransactionBlock({ transaction, index, onUpdate, eventId, orderId, authHeaders }) {
  const [showItems, setShowItems] = useState(true)
  const [showPayments, setShowPayments] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const hasContext = Boolean(onUpdate && eventId && orderId && authHeaders)

  const txTotal = transaction.total
  const txPaid = transaction.payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const txTip = transaction.tips.reduce((s, t) => s + Number(t.amount || 0), 0)

  return (
    <div style={{
      background: 'var(--glass)', border: '1px solid var(--glass-border)',
      borderRadius: 12, padding: 16,
    }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 12, borderBottom: '1px solid var(--glass-border)', marginBottom: 12,
      }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: '#00C37A' }}>
          ₪{txTotal.toLocaleString()}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700 }} title={hasContext ? '' : 'missing_context'}>עסקה {index}</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div
          onClick={() => setShowItems((s) => !s)}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', padding: '6px 0',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowItems((s) => !s)
            }
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{showItems ? '▼' : '▶'}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>מפרט ההזמנה</span>
        </div>
        {showItems && transaction.items.map((item, i) => (
          <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
            <span style={{ color: '#00C37A', fontWeight: 700 }}>
              ₪{Number(item.total || item.price * item.quantity).toLocaleString()}
            </span>
            <span>
              {item.name}
              {item.quantity > 1 && <span style={{ color: 'var(--v2-gray-400)', marginRight: 4 }}>×{item.quantity}</span>}
              {item.is_upsell && <span style={{ fontSize: 10, color: '#8B5CF6', marginRight: 6 }}>תוספת</span>}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div
          onClick={() => setShowPayments((s) => !s)}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', padding: '6px 0',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowPayments((s) => !s)
            }
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{showPayments ? '▼' : '▶'}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            היסטוריית תשלומים {txPaid > 0 && <span style={{ color: '#00C37A' }}>(₪{txPaid.toLocaleString()})</span>}
          </span>
        </div>
        {showPayments && (transaction.payments.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--v2-gray-400)', textAlign: 'center', padding: 8 }}>אין תשלומים</p>
        ) : transaction.payments.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
            <span style={{ color: '#00C37A' }}>₪{Number(p.amount).toLocaleString()}</span>
            <span>
              {p.method === 'cash' ? 'מזומן' : p.method === 'bit' ? 'ביט'
                : p.method === 'credit' ? 'אשראי קופה' : p.method === 'axess' ? 'AXESS'
                  : p.method === 'transfer' ? 'העברה' : p.method}
              {p.person && ` — ${p.person}`}
            </span>
          </div>
        )))}
      </div>

      <div>
        <div
          onClick={() => setShowTips((s) => !s)}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer', padding: '6px 0',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowTips((s) => !s)
            }
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{showTips ? '▼' : '▶'}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            טיפ {txTip > 0 ? <span style={{ color: '#F59E0B' }}>(₪{txTip.toLocaleString()})</span> : <span style={{ color: 'var(--v2-gray-400)' }}>(0₪)</span>}
          </span>
        </div>
        {showTips && (transaction.tips.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--v2-gray-400)', textAlign: 'center', padding: 8 }}>אין טיפ</p>
        ) : transaction.tips.map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
            <span style={{ color: '#F59E0B' }}>₪{Number(t.amount).toLocaleString()}</span>
            <span>{t.method === 'cash' ? 'מזומן' : 'אשראי'}</span>
          </div>
        )))}
      </div>
    </div>
  )
}

function TableEditAccount({ order, menuItems, authHeaders, eventId, onUpdate }) {
  // ===== נתונים מה-DB =====
  const allItems = (() => {
    const items = order.items;
    if (!items) return [];
    if (Array.isArray(items)) return items.filter(i => i && i.id);
    try { return JSON.parse(items).filter(i => i && i.id); } catch { return []; }
  })();

  const allPayments = (() => {
    const p = order.payments;
    if (!p) return [];
    if (Array.isArray(p)) return p;
    try { return JSON.parse(p); } catch { return []; }
  })();

  const allTipPayments = (() => {
    const t = order.tip_payments;
    if (!t) return [];
    if (Array.isArray(t)) return t;
    try { return JSON.parse(t); } catch { return []; }
  })();

  // ===== קיבוץ עסקאות =====
  const transactions = {};
  allItems.forEach(item => {
    const txId = item.transaction_id || 'txn_legacy';
    if (!transactions[txId]) {
      transactions[txId] = { id: txId, items: [], payments: [], tips: [], created_at: item.requested_at };
    }
    transactions[txId].items.push(item);
    if (item.requested_at && (!transactions[txId].created_at || new Date(item.requested_at) < new Date(transactions[txId].created_at))) {
      transactions[txId].created_at = item.requested_at;
    }
  });
  allPayments.forEach(p => {
    const txId = p.transaction_id || 'txn_legacy';
    if (!transactions[txId]) transactions[txId] = { id: txId, items: [], payments: [], tips: [] };
    transactions[txId].payments.push(p);
  });
  allTipPayments.forEach(t => {
    const txId = t.transaction_id || 'txn_legacy';
    if (!transactions[txId]) transactions[txId] = { id: txId, items: [], payments: [], tips: [] };
    transactions[txId].tips.push(t);
  });
  const closedTransactions = Object.values(transactions).sort((a, b) =>
    new Date(a.created_at || 0) - new Date(b.created_at || 0)
  );

  // ===== חישובים כלליים =====
  const totalOrdered = allItems.reduce((s, i) => s + Number(i.total || i.price * i.quantity || 0), 0);
  const totalPaid = allPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalTip = allTipPayments.reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = totalOrdered - totalPaid;

  // ===== אנשים =====
  const guests = (() => {
    const g = order.guests;
    if (!g) return [];
    if (Array.isArray(g)) return g;
    try { return JSON.parse(g); } catch { return []; }
  })();
  const allPeople = [
    { name: `${order.customer_name || ''} ${order.customer_last_name || ''}`.trim(), is_host: true },
    ...guests.map(g => ({ name: `${g.first_name || g.name || ''} ${g.last_name || ''}`.trim() })),
  ];

  // ===== State לעסקה חדשה/עריכה =====
  const [openTransaction, setOpenTransaction] = useState(null); // null | 'new' | txId (לעריכה)
  const [finalSaving, setFinalSaving] = useState(false);

  const [editingItems, setEditingItems] = useState([]); // פריטים חדשים/נערכים
  const [paymentMode, setPaymentMode] = useState('single');
  const [localPayments, setLocalPayments] = useState([]);
  const [newTipAmount, setNewTipAmount] = useState(0);
  const [newTipMethod, setNewTipMethod] = useState('cash');
  const [showMenuSelector, setShowMenuSelector] = useState(false);
  const [manualStep, setManualStep] = useState(1);
  const [drinkSearch, setDrinkSearch] = useState('');
  const [menuForm, setMenuForm] = useState({ selected_drinks: [], extras_by_drink: {} });
  const [interimSaving, setInterimSaving] = useState(false);
  const [deleteTransaction, setDeleteTransaction] = useState(null);
  const selectedDrinks = menuForm.selected_drinks && typeof menuForm.selected_drinks === 'object'
    ? Object.values(menuForm.selected_drinks)
    : [];

  const PAYMENT_METHODS = [
    { value: 'axess', label: 'AXESS', color: '#00C37A' },
    { value: 'cash', label: 'מזומן', color: '#F59E0B' },
    { value: 'bit', label: 'ביט', color: '#8B5CF6' },
    { value: 'credit', label: 'אשראי קופה', color: '#3B82F6' },
    { value: 'transfer', label: 'העברה', color: '#EC4899' },
  ];

  // ===== פתיחת עסקה חדשה =====
  const openNewTransaction = () => {
    setOpenTransaction('new');
    setEditingItems([]);
    setLocalPayments([]);
    setPaymentMode('single');
    setNewTipAmount(0);
    setShowMenuSelector(false);
    setManualStep(1);
  };

  // ===== סגירת ביניים =====
  const handleInterim = async () => {
    const paymentTotal = localPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const itemsTotal = editingItems.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);

    if (editingItems.length === 0) { toast.error('הוסף פריטים לעסקה'); return; }
    if (paymentTotal === 0) { toast.error('הזן סכום תשלום'); return; }
    if (paymentTotal > itemsTotal + 0.01) { toast.error('סכום תשלום עולה על סכום העסקה'); return; }

    setInterimSaving(true);
    try {
      const txId = `txn_${Date.now()}`;

      // 1. שמור פריטים
      for (const item of editingItems) {
        await fetch(`${API_BASE}/api/admin/events/${eventId}/table-items`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            table_order_id: order.id,
            menu_item_id: item.menu_item_id || null,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            is_upsell: item.is_upsell || false,
            transaction_id: txId,
          }),
        });
      }

      // 2. שמור תשלומים + טיפ
      const newPayments = localPayments
        .filter(p => Number(p.amount) > 0)
        .map(p => ({
          ...p,
          transaction_id: txId,
          timestamp: new Date().toISOString(),
        }));

      const newTipEntry = newTipAmount > 0 ? [{
        amount: newTipAmount,
        method: newTipMethod,
        transaction_id: txId,
        created_at: new Date().toISOString(),
      }] : [];

      await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          payments: [...allPayments, ...newPayments],
          tip_amount: totalTip + newTipAmount,
          tip_payments: [...allTipPayments, ...newTipEntry],
          total_amount: totalOrdered + itemsTotal,
        }),
      });

      toast.success('עסקה נסגרה ✓');
      setOpenTransaction(null);
      setEditingItems([]);
      setLocalPayments([]);
      setPaymentMode('single');
      setNewTipAmount(0);
      onUpdate({});
    } catch (e) {
      toast.error('שגיאה');
    } finally {
      setInterimSaving(false);
    }
  };

  // ===== סגירה סופית =====
  const closeAccount = async () => {
    setFinalSaving(true);
    try {
      await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          status: 'closed',
          closed_at: new Date().toISOString(),
        }),
      });
      toast.success('חשבון נסגר סופית ✓');
      onUpdate({ status: 'closed' });
    } catch { toast.error('שגיאה'); }
    finally { setFinalSaving(false); }
  };

  // ===== init תשלומים לפי מצב =====
  const initPayments = (mode, targetTotal) => {
    setPaymentMode(mode);
    if (mode === 'single') {
      setLocalPayments([{ person: allPeople[0]?.name, amount: targetTotal, method: 'cash' }]);
    } else if (mode === 'equal') {
      const per = allPeople.length > 0 ? Math.ceil(targetTotal / allPeople.length) : targetTotal;
      setLocalPayments(allPeople.map(p => ({ person: p.name, amount: per, method: 'cash' })));
    } else {
      setLocalPayments(allPeople.map(p => ({ person: p.name, amount: 0, method: 'cash' })));
    }
  };

  const editingTotal = editingItems.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ===== עסקאות סגורות ===== */}
      {closedTransactions.map((tx, idx) => (
        <ClosedTransactionBlock
          key={tx.id}
          transaction={tx}
          index={idx + 1}
          PAYMENT_METHODS={PAYMENT_METHODS}
          onEdit={() => setOpenTransaction(tx.id)}
          onDelete={() => setDeleteTransaction(tx)}
          isEditing={openTransaction === tx.id}
          onCancelEdit={() => setOpenTransaction(null)}
        />
      ))}

      {/* ===== עסקה חדשה (פתוחה) ===== */}
      {openTransaction === 'new' && (
        <div style={{
          background: 'var(--glass)', border: '2px solid rgba(0,195,122,0.4)',
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <button type="button"
              onClick={() => { setOpenTransaction(null); setEditingItems([]); setLocalPayments([]); setManualStep(1); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', fontSize: 18 }}
            >✕</button>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#00C37A' }}>
              עסקה {closedTransactions.length + 1} — חדשה
            </p>
          </div>

          {/* כפתור פתיחת תפריט */}
          {!showMenuSelector && editingItems.length === 0 && (
            <button type="button"
              onClick={() => { setManualStep(1); setShowMenuSelector(true); }}
              style={{
                width: '100%', minHeight: 48, borderRadius: 10,
                background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)',
                color: '#00C37A', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                marginBottom: 12,
              }}
            >+ הוסף פריטים מהתפריט</button>
          )}

          {/* תפריט */}
          {showMenuSelector && (
            <div style={{ marginBottom: 12 }}>
              <TableMenuSelector
                tableStep={manualStep}
                isSmartTable={true}
                menuItems={menuItems}
                extrasOptions={(menuItems || []).filter(m => m.category === 'תוספות')}
                tableForm={menuForm}
                setTableForm={setMenuForm}
                drinkSearch={drinkSearch}
                setDrinkSearch={setDrinkSearch}
                totalBottles={selectedDrinks.reduce((s, d) => s + d.quantity, 0)}
                drinksTotal={selectedDrinks.reduce((s, d) => s + (d.price * d.quantity), 0)}
                totalFreePeople={0}
                maxExtras={selectedDrinks.reduce((s, d) => s + ((d.free_extras || 0) * d.quantity), 0)}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {manualStep === 1 && selectedDrinks.length > 0 && (
                  <button type="button"
                    onClick={() => setManualStep(4)}
                    style={{
                      flex: 1, minHeight: 44, borderRadius: 10,
                      background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                      color: '#3B82F6', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >המשך לתוספות →</button>
                )}

                {manualStep === 4 && (
                  <button type="button"
                    onClick={() => setManualStep(1)}
                    style={{
                      flex: 1, minHeight: 44, borderRadius: 10,
                      background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      color: 'var(--text)', fontSize: 14, cursor: 'pointer',
                    }}
                  >← הוסף עוד פריט</button>
                )}

                <button type="button"
                  onClick={() => {
                    const newItems = [];
                    selectedDrinks.forEach(d => {
                      newItems.push({
                        menu_item_id: d.id,
                        name: d.name,
                        quantity: d.quantity,
                        price: d.price,
                        is_upsell: false,
                      });
                    });
                    Object.values(menuForm.extras_by_drink || {}).forEach(extras => {
                      Object.values(extras || {}).forEach(e => {
                        if (e.quantity > 0) newItems.push({
                          menu_item_id: e.id,
                          name: e.name,
                          quantity: e.quantity,
                          price: e.price || 0,
                          is_upsell: true,
                        });
                      });
                    });
                    setEditingItems(prev => [...prev, ...newItems]);
                    setMenuForm({ selected_drinks: {}, extras_by_drink: {} });
                    setManualStep(1);
                    setShowMenuSelector(false);
                    const total = [...editingItems, ...newItems].reduce((s, i) => s + (i.price * i.quantity), 0);
                    initPayments(paymentMode, total);
                  }}
                  disabled={selectedDrinks.length === 0}
                  style={{
                    flex: 2, minHeight: 44, borderRadius: 10,
                    background: selectedDrinks.length > 0 ? '#00C37A' : 'var(--glass)',
                    border: 'none',
                    color: selectedDrinks.length > 0 ? '#000' : 'var(--v2-gray-400)',
                    fontSize: 14, fontWeight: 700,
                    cursor: selectedDrinks.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >הוסף לעסקה</button>
              </div>
            </div>
          )}

          {/* פריטים בעסקה */}
          {editingItems.length > 0 && !showMenuSelector && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>פריטים:</p>
              {editingItems.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: '1px solid var(--glass-border)', fontSize: 13,
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button"
                      onClick={() => setEditingItems(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14 }}
                    >🗑️</button>
                    <span style={{ color: '#00C37A', fontWeight: 700 }}>
                      ₪{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  <span>{item.name} {item.quantity > 1 && <span style={{ color: 'var(--v2-gray-400)' }}>×{item.quantity}</span>}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: 8,
                padding: '8px 0', borderTop: '1px solid var(--glass-border)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#00C37A' }}>₪{editingTotal.toLocaleString()}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>סה"כ עסקה</span>
              </div>
              <button type="button"
                onClick={() => { setManualStep(1); setShowMenuSelector(true); }}
                style={{
                  width: '100%', minHeight: 36, borderRadius: 8, marginTop: 8,
                  background: 'transparent', border: '1px dashed var(--glass-border)',
                  color: 'var(--v2-gray-400)', fontSize: 12, cursor: 'pointer',
                }}
              >+ הוסף עוד פריט</button>
            </div>
          )}

          {/* חלוקת תשלום */}
          {editingItems.length > 0 && !showMenuSelector && (
            <>
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>אופן תשלום:</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'single', label: 'ראש שולחן' },
                    { value: 'equal', label: 'חלוקה שווה' },
                    { value: 'custom', label: 'חלוקה משתנה' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => initPayments(opt.value, editingTotal)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11,
                        background: paymentMode === opt.value ? 'rgba(0,195,122,0.1)' : 'var(--glass)',
                        border: `1px solid ${paymentMode === opt.value ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`,
                        color: paymentMode === opt.value ? '#00C37A' : 'var(--text)',
                        cursor: 'pointer', fontWeight: paymentMode === opt.value ? 700 : 400,
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {localPayments.map((payment, i) => (
                <div key={i} style={{
                  background: 'var(--card)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, padding: 12, marginBottom: 8,
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                    {payment.person || `אדם ${i + 1}`}
                  </p>
                  <input type="number" value={payment.amount || ''}
                    onChange={e => setLocalPayments(prev => prev.map((p, j) =>
                      j === i ? { ...p, amount: Number(e.target.value) } : p
                    ))}
                    disabled={paymentMode === 'equal'}
                    style={{
                      width: '100%', minHeight: 40, padding: '8px 10px', borderRadius: 8,
                      background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      color: 'var(--text)', fontSize: 14, textAlign: 'right',
                      boxSizing: 'border-box', marginBottom: 6,
                      opacity: paymentMode === 'equal' ? 0.6 : 1,
                    }} />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.value} type="button"
                        onClick={() => setLocalPayments(prev => prev.map((p, j) =>
                          j === i ? { ...p, method: m.value } : p
                        ))}
                        style={{
                          padding: '3px 8px', borderRadius: 20, fontSize: 10,
                          background: payment.method === m.value ? `${m.color}22` : 'var(--glass)',
                          border: `1px solid ${payment.method === m.value ? m.color : 'var(--glass-border)'}`,
                          color: payment.method === m.value ? m.color : 'var(--v2-gray-400)',
                          cursor: 'pointer',
                        }}
                      >{m.label}</button>
                    ))}
                  </div>
                </div>
              ))}

              {/* טיפ אופציונלי */}
              <div style={{
                background: 'var(--card)', border: '1px solid var(--glass-border)',
                borderRadius: 10, padding: 12, marginBottom: 12,
              }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#F59E0B' }}>
                  💵 טיפ (אופציונלי) — לא חלק מהחשבון
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="number" value={newTipAmount || ''}
                    onChange={e => setNewTipAmount(Number(e.target.value))}
                    placeholder="0"
                    style={{
                      flex: 1, minHeight: 40, padding: '8px', borderRadius: 8,
                      background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      color: 'var(--text)', fontSize: 14, textAlign: 'right',
                      boxSizing: 'border-box',
                    }} />
                  {[{ value: 'cash', label: 'מזומן' }, { value: 'credit', label: 'אשראי' }].map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setNewTipMethod(m.value)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12,
                        background: newTipMethod === m.value ? 'rgba(245,158,11,0.1)' : 'var(--glass)',
                        border: `1px solid ${newTipMethod === m.value ? '#F59E0B' : 'var(--glass-border)'}`,
                        color: newTipMethod === m.value ? '#F59E0B' : 'var(--v2-gray-400)',
                        cursor: 'pointer',
                      }}
                    >{m.label}</button>
                  ))}
                </div>
              </div>

              <button type="button"
                onClick={handleInterim}
                disabled={interimSaving}
                style={{
                  width: '100%', minHeight: 48, borderRadius: 10,
                  background: '#00C37A', border: 'none', color: '#000',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  opacity: interimSaving ? 0.6 : 1,
                }}
              >
                {interimSaving ? 'שומר...' : '✓ סגור עסקה'}
              </button>
            </>
          )}
        </div>
      )}

      {openTransaction && openTransaction !== 'new' && (() => {
        const tx = closedTransactions.find(t => t.id === openTransaction);
        if (!tx) return null;
        return (
          <EditTransactionBlock
            transaction={tx}
            allPayments={allPayments}
            allTipPayments={allTipPayments}
            allPeople={allPeople}
            PAYMENT_METHODS={PAYMENT_METHODS}
            authHeaders={authHeaders}
            eventId={eventId}
            orderId={order.id}
            onClose={() => setOpenTransaction(null)}
            onUpdate={onUpdate}
          />
        );
      })()}

      {/* ===== כפתור עסקה חדשה ===== */}
      {openTransaction !== 'new' && order.status !== 'closed' && (
        <button type="button"
          onClick={openNewTransaction}
          style={{
            width: '100%', minHeight: 52, borderRadius: 12,
            background: 'rgba(0,195,122,0.1)', border: '1px dashed rgba(0,195,122,0.4)',
            color: '#00C37A', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + הוסף עסקה חדשה
        </button>
      )}

      {/* ===== בלוק סיכום מאוחד ===== */}
      {closedTransactions.length > 0 && (
        <div style={{
          background: 'rgba(0,195,122,0.05)',
          border: '1px solid rgba(0,195,122,0.3)',
          borderRadius: 12, padding: 16,
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#00C37A' }}>סיכום מאוחד</p>

          {/* סה"כ פריטים */}
          <details style={{ marginBottom: 12 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
              סה"כ פריטים: ₪{totalOrdered.toLocaleString()}
            </summary>
            <div style={{ marginTop: 8 }}>
              {closedTransactions.map((tx, idx) => tx.items.map((item, i) => (
                <div key={`${tx.id}-${i}`} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 0', fontSize: 12, color: 'var(--v2-gray-400)',
                }}>
                  <span>₪{Number(item.total || item.price * item.quantity).toLocaleString()}</span>
                  <span>עסקה {idx + 1} — {item.name} {item.quantity > 1 && `×${item.quantity}`}</span>
                </div>
              )))}
            </div>
          </details>

          {/* היסטוריית תשלומים */}
          <details style={{ marginBottom: 12 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
              סה"כ תשלומים: ₪{totalPaid.toLocaleString()}
            </summary>
            <div style={{ marginTop: 8 }}>
              {closedTransactions.map((tx, idx) => tx.payments.map((p, i) => (
                <div key={`${tx.id}-p-${i}`} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 0', fontSize: 12, color: 'var(--v2-gray-400)',
                }}>
                  <span style={{ color: '#00C37A' }}>₪{Number(p.amount).toLocaleString()}</span>
                  <span>עסקה {idx + 1} — {p.person} ({PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method})</span>
                </div>
              )))}
            </div>
          </details>

          {/* טיפים */}
          <details style={{ marginBottom: 12 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'right', color: '#F59E0B' }}>
              סה"כ טיפים: ₪{totalTip.toLocaleString()}
            </summary>
            <div style={{ marginTop: 8 }}>
              {closedTransactions.map((tx, idx) => tx.tips.map((t, i) => (
                <div key={`${tx.id}-t-${i}`} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 0', fontSize: 12, color: 'var(--v2-gray-400)',
                }}>
                  <span style={{ color: '#F59E0B' }}>₪{Number(t.amount).toLocaleString()}</span>
                  <span>עסקה {idx + 1} — {t.method === 'cash' ? 'מזומן' : 'אשראי'}</span>
                </div>
              )))}
            </div>
          </details>
        </div>
      )}

      {/* ===== כפתור סגירה סופית ===== */}
      {order.status !== 'closed' && closedTransactions.length > 0 && (
        <button type="button"
          onClick={closeAccount}
          disabled={finalSaving || openTransaction === 'new' || openTransaction !== null}
          style={{
            width: '100%', minHeight: 52, borderRadius: 12,
            background: openTransaction === null ? '#EF4444' : 'var(--glass)',
            border: `1px solid ${openTransaction === null ? '#EF4444' : 'var(--glass-border)'}`,
            color: openTransaction === null ? '#fff' : 'var(--v2-gray-400)',
            fontSize: 15, fontWeight: 800,
            cursor: openTransaction === null ? 'pointer' : 'not-allowed',
            opacity: finalSaving ? 0.6 : 1,
          }}
        >
          {finalSaving ? 'סוגר...' : '🔒 סגור חשבון סופי'}
        </button>
      )}

      {deleteTransaction && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        >
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 24,
            width: '90%', maxWidth: 400, textAlign: 'right',
          }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>
              האם למחוק עסקה {closedTransactions.findIndex(t => t.id === deleteTransaction.id) + 1}?
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
              פעולה זו תמחק את כל הפריטים, התשלומים והטיפים של העסקה. לא ניתן לבטל.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button"
                onClick={() => setDeleteTransaction(null)}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 10,
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 14, cursor: 'pointer',
                }}
              >ביטול</button>
              <button type="button"
                onClick={async () => {
                  try {
                    for (const item of deleteTransaction.items) {
                      await fetch(`${API_BASE}/api/admin/events/${eventId}/table-items/${item.id}`, {
                        method: 'DELETE', headers: authHeaders(),
                      });
                    }
                    const otherPayments = allPayments.filter(p => (p.transaction_id || 'txn_legacy') !== deleteTransaction.id);
                    const otherTips = allTipPayments.filter(t => (t.transaction_id || 'txn_legacy') !== deleteTransaction.id);
                    await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`, {
                      method: 'PATCH', headers: authHeaders(),
                      body: JSON.stringify({
                        payments: otherPayments,
                        tip_payments: otherTips,
                        tip_amount: otherTips.reduce((s, t) => s + Number(t.amount || 0), 0),
                      }),
                    });
                    toast.success('עסקה נמחקה ✓');
                    if (openTransaction === deleteTransaction.id) setOpenTransaction(null);
                    setDeleteTransaction(null);
                    onUpdate({});
                  } catch { toast.error('שגיאה'); }
                }}
                style={{
                  flex: 2, minHeight: 44, borderRadius: 10,
                  background: '#EF4444', border: 'none',
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >🗑️ מחק עסקה</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function EditTransactionBlock({ transaction, allPayments, allTipPayments, allPeople, PAYMENT_METHODS, authHeaders, eventId, orderId, onClose, onUpdate }) {
  const [items, setItems] = useState(transaction.items.map(i => ({ ...i })));
  const [payments, setPayments] = useState(transaction.payments.map(p => ({ ...p })));
  const [tips, setTips] = useState(transaction.tips.map(t => ({ ...t })));
  const [saving, setSaving] = useState(false);
  const [paymentMode, setPaymentMode] = useState('custom');
  const [newTipAmount, setNewTipAmount] = useState(0);
  const [newTipMethod, setNewTipMethod] = useState('cash');

  const txTotal = items.reduce((s, i) => s + Number(i.total || i.price * i.quantity || 0), 0);
  const txPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const balance = txTotal - txPaid;

  // עדכן תשלומים לפי מצב:
  const changePaymentMode = (mode) => {
    setPaymentMode(mode);
    if (mode === 'single') {
      setPayments([{ person: allPeople[0]?.name, amount: txTotal, method: payments[0]?.method || 'cash', transaction_id: transaction.id }]);
    } else if (mode === 'equal') {
      const per = allPeople.length > 0 ? Math.ceil(txTotal / allPeople.length) : txTotal;
      setPayments(allPeople.map(p => ({
        person: p.name, amount: per, method: 'cash', transaction_id: transaction.id
      })));
    }
    // custom — משאיר כמו שיש
  };

  const addTip = () => {
    if (!newTipAmount) return;
    setTips(prev => [...prev, {
      amount: newTipAmount,
      method: newTipMethod,
      transaction_id: transaction.id,
      created_at: new Date().toISOString(),
    }]);
    setNewTipAmount(0);
  };

  const save = async () => {
    setSaving(true);
    try {
      // 1. עדכן/מחק פריטים
      for (const origItem of transaction.items) {
        const stillExists = items.find(i => i.id === origItem.id);
        if (!stillExists) {
          const r = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-items/${origItem.id}`, {
            method: 'DELETE', headers: authHeaders(),
          });
          if (!r.ok) {
            const err = await r.text();
            console.error('API error:', r.status, err);
          }
        } else if (stillExists.quantity !== origItem.quantity || stillExists.price !== origItem.price) {
          const r = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-items/${origItem.id}`, {
            method: 'PATCH', headers: authHeaders(),
            body: JSON.stringify({
              quantity: Number(stillExists.quantity),
              price: Number(stillExists.price),
              total: Number(stillExists.price) * Number(stillExists.quantity),
            }),
          });
          if (!r.ok) {
            const err = await r.text();
            console.error('API error:', r.status, err);
          }
        }
      }

      // 2. עדכן תשלומים וטיפים
      const otherPayments = allPayments.filter(p => (p.transaction_id || 'txn_legacy') !== transaction.id);
      const otherTips = allTipPayments.filter(t => (t.transaction_id || 'txn_legacy') !== transaction.id);

      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${orderId}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({
          payments: [...otherPayments, ...payments.filter(p => Number(p.amount) > 0)],
          tip_payments: [...otherTips, ...tips],
          tip_amount: [...otherTips, ...tips].reduce((s, t) => s + Number(t.amount || 0), 0),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('save response:', data);
        toast.success('העסקה עודכנה ✓');
        onUpdate({});
      } else {
        const errText = await res.text();
        console.error('save failed:', res.status, errText);
        toast.error(`שגיאה בשמירה (${res.status})`);
      }
    } catch (e) {
      console.error('save error:', e);
      toast.error('שגיאה');
    }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      background: 'rgba(59,130,246,0.05)',
      border: '2px solid rgba(59,130,246,0.4)',
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', fontSize: 18 }}
        >✕</button>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3B82F6' }}>עריכת עסקה</p>
      </div>

      {/* פריטים */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>פריטים:</p>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            padding: 8, borderRadius: 8, marginBottom: 4,
            background: 'var(--card)', border: '1px solid var(--glass-border)',
          }}>
            <button type="button"
              onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14 }}
            >🗑️</button>
            <input type="number" value={item.quantity}
              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, quantity: Number(e.target.value) } : it))}
              style={{ width: 50, padding: 4, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', fontSize: 13, textAlign: 'center' }}
            />
            <input type="number" value={item.price}
              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, price: Number(e.target.value) } : it))}
              style={{ width: 70, padding: 4, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', fontSize: 13, textAlign: 'center' }}
            />
            <span style={{ flex: 1, textAlign: 'right', fontSize: 13 }}>{item.name}</span>
          </div>
        ))}
      </div>

      {/* חלוקת תשלום */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>אופן תשלום:</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[
            { value: 'single', label: 'ראש שולחן' },
            { value: 'equal', label: 'חלוקה שווה' },
            { value: 'custom', label: 'חלוקה משתנה' },
          ].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => changePaymentMode(opt.value)}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11,
                background: paymentMode === opt.value ? 'rgba(59,130,246,0.1)' : 'var(--glass)',
                border: `1px solid ${paymentMode === opt.value ? 'rgba(59,130,246,0.3)' : 'var(--glass-border)'}`,
                color: paymentMode === opt.value ? '#3B82F6' : 'var(--text)',
                cursor: 'pointer',
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* תשלומים */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, textAlign: 'right' }}>תשלומים:</p>
        {payments.map((p, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--glass-border)',
            borderRadius: 8, padding: 10, marginBottom: 6,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <button type="button"
                onClick={() => setPayments(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14 }}
              >🗑️</button>
              <input type="number" value={p.amount}
                onChange={e => setPayments(prev => prev.map((pp, j) => j === i ? { ...pp, amount: Number(e.target.value) } : pp))}
                disabled={paymentMode === 'equal'}
                style={{ flex: 1, padding: 6, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', fontSize: 13, textAlign: 'right', opacity: paymentMode === 'equal' ? 0.6 : 1 }}
              />
              <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{p.person}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} type="button"
                  onClick={() => setPayments(prev => prev.map((pp, j) => j === i ? { ...pp, method: m.value } : pp))}
                  style={{
                    padding: '3px 8px', borderRadius: 20, fontSize: 10,
                    background: p.method === m.value ? `${m.color}22` : 'var(--glass)',
                    border: `1px solid ${p.method === m.value ? m.color : 'var(--glass-border)'}`,
                    color: p.method === m.value ? m.color : 'var(--v2-gray-400)',
                    cursor: 'pointer',
                  }}
                >{m.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* טיפים — תמיד ניתן להוסיף */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#F59E0B' }}>
          💵 טיפים:
        </p>
        {tips.map((t, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, alignItems: 'center',
            padding: 8, borderRadius: 8, marginBottom: 4,
            background: 'var(--card)', border: '1px solid var(--glass-border)',
          }}>
            <button type="button"
              onClick={() => setTips(prev => prev.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14 }}
            >🗑️</button>
            <input type="number" value={t.amount}
              onChange={e => setTips(prev => prev.map((tt, j) => j === i ? { ...tt, amount: Number(e.target.value) } : tt))}
              style={{ flex: 1, padding: 6, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', fontSize: 13, textAlign: 'right' }}
            />
            <span style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>{t.method === 'cash' ? 'מזומן' : 'אשראי'}</span>
          </div>
        ))}

        {/* הוסף טיפ חדש */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 8,
          padding: 8, borderRadius: 8,
          background: 'rgba(245,158,11,0.05)', border: '1px dashed rgba(245,158,11,0.3)',
        }}>
          <input type="number" value={newTipAmount || ''}
            onChange={e => setNewTipAmount(Number(e.target.value))}
            placeholder="0"
            style={{ flex: 1, padding: 6, borderRadius: 6, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', fontSize: 13, textAlign: 'right' }}
          />
          {[{ value: 'cash', label: 'מזומן' }, { value: 'credit', label: 'אשראי' }].map(m => (
            <button key={m.value} type="button"
              onClick={() => setNewTipMethod(m.value)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11,
                background: newTipMethod === m.value ? 'rgba(245,158,11,0.1)' : 'var(--glass)',
                border: `1px solid ${newTipMethod === m.value ? '#F59E0B' : 'var(--glass-border)'}`,
                color: newTipMethod === m.value ? '#F59E0B' : 'var(--v2-gray-400)',
                cursor: 'pointer',
              }}
            >{m.label}</button>
          ))}
          <button type="button" onClick={addTip}
            disabled={!newTipAmount}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11,
              background: newTipAmount ? '#F59E0B' : 'var(--glass)',
              border: 'none',
              color: newTipAmount ? '#000' : 'var(--v2-gray-400)',
              cursor: newTipAmount ? 'pointer' : 'not-allowed',
              fontWeight: 700,
            }}
          >+</button>
        </div>
      </div>

      {/* סיכום */}
      <div style={{
        padding: 10, borderRadius: 8, marginBottom: 12,
        background: balance === 0 ? 'rgba(0,195,122,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${balance === 0 ? 'rgba(0,195,122,0.3)' : 'rgba(239,68,68,0.3)'}`,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: balance === 0 ? '#00C37A' : '#EF4444' }}>
          ₪{Math.abs(balance).toLocaleString()}
        </span>
        <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>
          {balance > 0 ? 'חסר בעסקה' : balance < 0 ? 'עודף בעסקה' : '✓ מאוזן'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onClose}
          style={{
            flex: 1, minHeight: 44, borderRadius: 10,
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            color: 'var(--v2-gray-400)', fontSize: 14, cursor: 'pointer',
          }}
        >ביטול</button>
        <button type="button" onClick={save} disabled={saving}
          style={{
            flex: 2, minHeight: 44, borderRadius: 10,
            background: '#3B82F6', border: 'none',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >{saving ? 'שומר...' : 'שמור שינויים'}</button>
      </div>
    </div>
  );
}

// ===== קומפוננטת עסקה סגורה =====
function ClosedTransactionBlock({ transaction, index, PAYMENT_METHODS, onEdit, onDelete, isEditing, onCancelEdit }) {
  const [showItems, setShowItems] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const txTotal = transaction.items.reduce((s, i) => s + Number(i.total || i.price * i.quantity || 0), 0);
  const txPaid = transaction.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const txTip = transaction.tips.reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <div style={{
      background: 'var(--glass)', border: '1px solid var(--glass-border)',
      borderRadius: 12, padding: 16,
    }}>
      {/* כותרת עסקה + עריכה */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 10, borderBottom: '1px solid var(--glass-border)', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button"
            onClick={onDelete}
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 11,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444', cursor: 'pointer',
            }}
          >🗑️ מחק</button>
          <button type="button"
            onClick={onEdit}
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 11,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              color: 'var(--v2-gray-400)', cursor: 'pointer',
            }}
          >✏️ עריכה</button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#00C37A' }}>
            ₪{txTotal.toLocaleString()}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>עסקה {index}</div>
          {transaction.created_at && (
            <div style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>
              {new Date(transaction.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* פירוט פריטים */}
      <div style={{ marginBottom: 6 }}>
        <div onClick={() => setShowItems(s => !s)}
          style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 0' }}>
          <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{showItems ? '▼' : '▶'}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>מפרט הזמנה</span>
        </div>
        {showItems && transaction.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 0', fontSize: 12, color: 'var(--v2-gray-400)',
          }}>
            <span style={{ color: '#00C37A' }}>₪{Number(item.total || item.price * item.quantity).toLocaleString()}</span>
            <span>{item.name} {item.quantity > 1 && `×${item.quantity}`}</span>
          </div>
        ))}
      </div>

      {/* תשלומים */}
      <div style={{ marginBottom: 6 }}>
        <div onClick={() => setShowPayments(s => !s)}
          style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 0' }}>
          <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{showPayments ? '▼' : '▶'}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            תשלומים (₪{txPaid.toLocaleString()})
          </span>
        </div>
        {showPayments && transaction.payments.map((p, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 0', fontSize: 12, color: 'var(--v2-gray-400)',
          }}>
            <span style={{ color: '#00C37A' }}>₪{Number(p.amount).toLocaleString()}</span>
            <span>{p.person} — {PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}</span>
          </div>
        ))}
      </div>

      {/* טיפ */}
      <div>
        <div onClick={() => setShowTips(s => !s)}
          style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 0' }}>
          <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{showTips ? '▼' : '▶'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: txTip > 0 ? '#F59E0B' : 'var(--v2-gray-400)' }}>
            טיפ ({txTip > 0 ? `₪${txTip.toLocaleString()}` : '0₪'})
          </span>
        </div>
        {showTips && transaction.tips.map((t, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 0', fontSize: 12, color: 'var(--v2-gray-400)',
          }}>
            <span style={{ color: '#F59E0B' }}>₪{Number(t.amount).toLocaleString()}</span>
            <span>{t.method === 'cash' ? 'מזומן' : 'אשראי'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableEditRequests({ order, menuItems, authHeaders, eventId, onUpdate, loadData }) {
  const [requests, setRequests] = useState([])
  const [upsellItem, setUpsellItem] = useState('')
  const [upsellQty, setUpsellQty] = useState(1)
  const [menuSearch, setMenuSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredMenu = (menuItems || []).filter((item) =>
    !menuSearch || item.name?.includes(menuSearch) || item.category?.includes(menuSearch),
  )

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}/service-requests`, {
      headers: authHeaders(),
    })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ requests: [] })))
      .then((d) => {
        if (!cancelled) setRequests(d.requests || [])
      })
      .catch(() => {
        if (!cancelled) setRequests([])
      })
    return () => { cancelled = true }
  }, [order.id, eventId, authHeaders])

  const addUpsell = async () => {
    if (!upsellItem) return
    setSaving(true)
    const item = menuItems.find((m) => m.id === upsellItem)
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/table-items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          table_order_id: order.id,
          menu_item_id: upsellItem,
          name: item?.name,
          quantity: upsellQty,
          price: item?.price || 0,
          total: (item?.price || 0) * upsellQty,
          is_upsell: true,
        }),
      })
      if (res.ok) {
        toast.success('אפסייל נוסף ✓')
        onUpdate({})
        loadData()
      } else toast.error('שגיאה')
    } catch {
      toast.error('שגיאה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, textAlign: 'right', color: '#00C37A' }}>
          🛎️ בקשות שירות (
          {requests.length}
          )
        </p>
        {requests.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13, padding: 16 }}>
            אין בקשות שירות
          </p>
        ) : requests.map((r) => (
          <div
            key={r.id}
            style={{
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 8,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}
          >
            <span style={{
              padding: '3px 8px', borderRadius: 20, fontSize: 11,
              background: r.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(0,195,122,0.15)',
              color: r.status === 'pending' ? '#F59E0B' : '#00C37A',
            }}
            >
              {r.status === 'pending' ? 'ממתין' : 'טופל'}
            </span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 14 }}>{r.message}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                {new Date(r.created_at).toLocaleTimeString('he-IL')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--glass)', border: '1px solid var(--glass-border)',
        borderRadius: 12, padding: 16,
      }}
      >
        <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, textAlign: 'right', color: '#00C37A' }}>
          ➕ הוסף אפסייל
        </p>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="חיפוש בתפריט..."
            style={{
              width: '100%', minHeight: 44, padding: '10px 40px 10px 16px',
              borderRadius: 10, background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text)', fontSize: 15, textAlign: 'right',
              boxSizing: 'border-box',
            }}
          />
          <Search size={16} color="#00C37A" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {filteredMenu.map((mi) => (
            <div
              key={mi.id}
              role="button"
              tabIndex={0}
              onClick={() => setUpsellItem(mi.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setUpsellItem(mi.id)
                }
              }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                background: upsellItem === mi.id ? 'rgba(0,195,122,0.1)' : 'var(--glass)',
                border: `1px solid ${upsellItem === mi.id ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 14, color: '#00C37A', fontWeight: 700 }}>
                ₪
                {mi.price}
              </span>
              <span style={{ fontSize: 14 }}>{mi.name}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={addUpsell}
            disabled={!upsellItem || saving}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10, background: upsellItem ? '#00C37A' : 'var(--glass)',
              border: 'none', color: upsellItem ? '#000' : 'var(--v2-gray-400)',
              fontSize: 14, fontWeight: 700, cursor: upsellItem ? 'pointer' : 'not-allowed',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving ? 'מוסיף...' : '+ הוסף לחשבון'}
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setUpsellQty((q) => q + 1)}
              style={{
                width: 36, height: 36, borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: '#00C37A', cursor: 'pointer', fontSize: 18,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              +
            </button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{upsellQty}</span>
            <button
              type="button"
              onClick={() => setUpsellQty((q) => Math.max(1, q - 1))}
              style={{
                width: 36, height: 36, borderRadius: 8, background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', cursor: 'pointer', fontSize: 18,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              −
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TableEditNotes({ order, authHeaders, eventId, onUpdate }) {
  const [notes, setNotes] = useState(order.notes || order.extras || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/events/${eventId}/table-orders/${order.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ extras: notes }),
        },
      )
      if (res.ok) {
        toast.success('הערות נשמרו ✓')
        onUpdate({ extras: notes })
      } else toast.error('שגיאה')
    } catch {
      toast.error('שגיאה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="הערות לשולחן..."
        rows={6}
        style={{
          width: '100%', padding: '16px', borderRadius: 12,
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          color: 'var(--text)', fontSize: 16, textAlign: 'right',
          resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
        }}
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        style={{
          minHeight: 48, borderRadius: 12, background: '#00C37A', border: 'none', color: '#000', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {saving ? 'שומר...' : 'שמור הערות'}
      </button>
    </div>
  )
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
  const tableOrdersRef = useRef([])
  useEffect(() => {
    tableOrdersRef.current = tableOrders
  }, [tableOrders])
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
  const [newStaff, setNewStaff] = useState({
    name: '',
    last_name: '',
    phone: '',
    tables_assigned: [],
    save_to_venue: true,
    save_to_event: true,
    wa_notifications: true,
  })
  const [showTemplateStaff, setShowTemplateStaff] = useState(false)
  const [templateStaffData, setTemplateStaffData] = useState({})
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [editStaffData, setEditStaffData] = useState({})
  const extrasMenuWrapRef = useRef(null)
  const suppressCellBlurSave = useRef(false)
  const [extrasDropdownDir, setExtrasDropdownDir] = useState('down')
  const [guestsDrawer, setGuestsDrawer] = useState(null)
  const [tableAssignModal, setTableAssignModal] = useState(null)
  const [availableTables, setAvailableTables] = useState([])
  const [selectedTableId, setSelectedTableId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [tableAssignConfirmOpen, setTableAssignConfirmOpen] = useState(false)
  const [tableEditModal, setTableEditModal] = useState(null)
  const [tableEditTab, setTableEditTab] = useState('details')
  const [allTables, setAllTables] = useState([])
  const [showAddTableModal, setShowAddTableModal] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState('')
  const [promoters, setPromoters] = useState([])
  const [staffSubTab, setStaffSubTab] = useState('all')
  const [confirmDeleteTable, setConfirmDeleteTable] = useState(false)
  const [templateTables, setTemplateTables] = useState([])
  const [tableNameOptions, setTableNameOptions] = useState([
    'VIP', 'בר', 'טרס', 'מרכז', 'כניסה', 'פינה', 'גן', 'גג',
  ])

  useEffect(() => {
    if (!businessId) return
    fetch(`${API_BASE}/api/admin/business/${businessId}/templates`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        const template = (data.templates || []).find((t) =>
          t.template_type === 'tables' && (t.is_default || t.is_system)
        )
        const tables = template?.template_data?.tables || []
        const names = template?.template_data?.table_names || ['VIP', 'בר', 'רגיל', 'DJ Booth']
        setTemplateTables(tables)
        setTableNameOptions(names)
      })
      .catch(() => {})
  }, [businessId, tableEditModal?.id, authHeaders])

  useEffect(() => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/tables`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setAllTables(d.tables || d || []))
      .catch(() => setAllTables([]))
  }, [eventId, authHeaders])

  useEffect(() => {
    if (!tableAssignModal || !eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/tables`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        const raw = data.tables || data || []
        const tables = Array.isArray(raw) ? raw : []
        const free = tables.filter((t) => {
          const oc = Number(t.orders_count) || 0
          return (t.status === 'available' || !t.status) && oc === 0
        })
        setAvailableTables(free)
        setSelectedTableId('')
      })
      .catch(() => {
        setAvailableTables([])
        setSelectedTableId('')
      })
  }, [tableAssignModal, eventId, authHeaders])

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
      const [t, o, m, s, p] = await Promise.all([
        fetch(`${API_BASE}/api/admin/events/${eventId}/tables`, { headers: hdrs }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders`, { headers: hdrs }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/events/${eventId}/table-menu`, { headers: hdrs }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, { headers: hdrs }).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/promoters?business_id=${businessId}`, { headers: hdrs }).then((r) => r.json()),
      ])
      setTables(t.tables || [])
      const nextOrders = (o.orders || []).map(normalizeOrderItems)
      setTableOrders(nextOrders)
      tableOrdersRef.current = nextOrders
      setMenuItems(m.menu || [])
      setStaffList(s.staff || [])
      setPromoters(Array.isArray(p) ? p : [])
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
    setShowAddTableModal(true)
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
              overflow: 'visible',
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
                      customer_name: 'ישראל',
                      customer_last_name: 'ישראלי',
                      customer_phone: '0501234567',
                      customer_email: 'test@test.com',
                      guest_count: 3,
                      guests: [
                        { first_name: 'משה', last_name: 'כהן', phone: '0521234567', is_free: true },
                        { first_name: 'שרה', last_name: 'לוי', phone: '0531234567', is_free: false, ticket_price: 50 },
                      ],
                      status: 'pending_approval',
                      total_amount: 0,
                      source: 'manual',
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
      </div>

      {view === 'table' && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
            <thead>
              <tr style={{ background: 'var(--glass)', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                {[
                  'עריכה',
                  'מס\' הזמנה',
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
                ].map((h) => (
                  <th
                    key={h}
                    title={h === 'כמות אנשים' || h === 'לקוח' ? 'לחץ לפרטי חברי השולחן' : undefined}
                    style={{
                      padding: h === 'מס\' הזמנה' ? '10px 8px' : '8px 10px',
                      textAlign: 'right',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      borderLeft: '1px solid var(--glass-border)',
                      fontSize: h === 'מס\' הזמנה' ? 12 : undefined,
                      color: h === 'מס\' הזמנה' ? 'var(--v2-gray-400)' : undefined,
                    }}
                  >
                    {h === 'כמות אנשים' ? 'כמות אנשים 👥' : h}
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

                  const pay = normalizePayments(order)

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid var(--glass-border)',
                        height: 44,
                        background: 'transparent',
                      }}
                    >
                      <td style={{ padding: 0, width: 130, minWidth: 130, height: 44, borderLeft: '1px solid var(--glass-border)', verticalAlign: 'stretch' }}>
                        <div style={{ display: 'flex', height: 44, alignItems: 'stretch' }}>
                          <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, padding: '0 8px',
                            background:
                              order.status === 'pending_approval' ? 'rgba(245,158,11,0.15)'
                                : order.status === 'active' ? 'rgba(0,195,122,0.1)'
                                  : order.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'var(--glass)',
                            color:
                              order.status === 'pending_approval' ? '#F59E0B'
                                : order.status === 'active' ? '#00C37A'
                                  : order.status === 'cancelled' ? '#EF4444' : 'var(--v2-gray-400)',
                            borderLeft: '1px solid var(--glass-border)',
                            whiteSpace: 'nowrap',
                          }}
                          >
                            {order.status === 'pending_approval' ? 'ממתין'
                              : order.status === 'active' ? 'מאושר'
                                : order.status === 'cancelled' ? 'מבוטל'
                                  : order.status === 'closed' ? 'סגור' : order.status}
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => { setTableEditModal(order); setTableEditTab('details') }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setTableEditModal(order)
                                setTableEditTab('details')
                              }
                            }}
                            style={{
                              width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              gap: 6, cursor: 'pointer', padding: '0 8px',
                              background: 'rgba(0,195,122,0.06)',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <Users
                              size={14}
                              color="#00C37A"
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setTableEditModal(order)
                                setTableEditTab('guests')
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#00C37A', fontWeight: 600 }}>
                              עריכה
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0 10px', fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap', borderLeft: '1px solid var(--glass-border)', height: 44, verticalAlign: 'middle' }}>
                        #
                        {order.id?.slice(-6).toUpperCase()}
                      </td>
                      <td
                        style={{
                          padding: '0 10px',
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 120,
                          height: 44,
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 100,
                          verticalAlign: 'middle',
                        }}
                      >
                        <span style={{ fontSize: 12 }}>
                          {order.order_date
                            ? new Date(order.order_date).toLocaleDateString('he-IL')
                            : new Date().toLocaleDateString('he-IL')}
                        </span>
                      </td>

                      <td style={{
                        padding: '0 10px', fontSize: 13, height: 44, borderLeft: '1px solid var(--glass-border)',
                        minWidth: 70, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      >
                        {table?.table_number ?? '—'}
                      </td>

                      <td style={{ padding: '0 10px', fontSize: 13, borderLeft: '1px solid var(--glass-border)', minWidth: 120, height: 44, verticalAlign: 'middle' }}>
                        {TABLE_CATEGORIES.find((c) => c.value === (order.category || 'regular'))?.label || order.category || '—'}
                      </td>

                      <td
                        title="לחץ לפרטי חברי השולחן"
                        onClick={() => setGuestsDrawer({ ...order, table_number: table?.table_number ?? order.table_number })}
                        style={{
                          cursor: 'pointer',
                          padding: '10px 12px',
                          textAlign: 'center',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 80,
                        }}
                      >
                        {order.guest_count ?? ((Array.isArray(order.guests) ? order.guests.length : 0) + 1)}
                      </td>

                      <td
                        title="לחץ לפרטי חברי השולחן"
                        onClick={() => setGuestsDrawer({ ...order, table_number: table?.table_number ?? order.table_number })}
                        style={{
                          cursor: 'pointer',
                          padding: '10px 12px',
                          textAlign: 'right',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 100,
                        }}
                      >
                        {order.customer_name}
                        {' '}
                        {order.customer_last_name || ''}
                      </td>

                      <td style={{
                        padding: '0 10px', fontSize: 13, height: 44, borderLeft: '1px solid var(--glass-border)',
                        minWidth: 90, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      >
                        {order.customer_last_name || '—'}
                      </td>
                      <td style={{
                        padding: '0 10px', fontSize: 13, height: 44, borderLeft: '1px solid var(--glass-border)',
                        minWidth: 100, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      >
                        {order.customer_phone || '—'}
                      </td>
                      <td style={{
                        padding: '0 10px', fontSize: 13, height: 44, borderLeft: '1px solid var(--glass-border)',
                        minWidth: 120, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      >
                        {order.customer_email || '—'}
                      </td>

                      <td style={{ padding: '0 10px', fontSize: 13, borderLeft: '1px solid var(--glass-border)', minWidth: 110, height: 44, verticalAlign: 'middle' }}>
                        {order.waitress_name || '—'}
                      </td>

                      <td style={{ padding: '0 10px', fontSize: 13, borderLeft: '1px solid var(--glass-border)', minWidth: 130, height: 44, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.drink_name || '—'}
                      </td>

                      <td style={{
                        padding: '0 10px', fontSize: 13, borderLeft: '1px solid var(--glass-border)', minWidth: 60, height: 44, verticalAlign: 'middle',
                      }}
                      >
                        {order.drink_quantity || 1}
                      </td>

                      <td style={{ padding: '0 10px', fontSize: 12, borderLeft: '1px solid var(--glass-border)', minWidth: 160, height: 44, verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(() => {
                          const selectedExtras = order.extras_list || []
                          if (!Array.isArray(selectedExtras) || selectedExtras.length === 0) return '—'
                          return selectedExtras.map((e) => (typeof e === 'string' ? e : e?.name || '')).filter(Boolean).join(', ')
                        })()}
                      </td>

                      <td style={{
                        padding: '0 10px', fontSize: 13, height: 44, borderLeft: '1px solid var(--glass-border)',
                        minWidth: 70, verticalAlign: 'middle',
                      }}
                      >
                        {order.base_price != null && order.base_price !== '' ? order.base_price : '—'}
                      </td>

                      <td style={{
                        padding: '0 10px', fontSize: 13, height: 44, borderLeft: '1px solid var(--glass-border)',
                        minWidth: 60, verticalAlign: 'middle',
                      }}
                      >
                        {order.discount != null && order.discount !== '' ? order.discount : '—'}
                      </td>

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

                      <td style={{
                        padding: '0 10px', fontSize: 13, height: 44, borderLeft: '1px solid var(--glass-border)',
                        minWidth: 70, verticalAlign: 'middle',
                      }}
                      >
                        {order.tip_amount != null && order.tip_amount !== '' ? order.tip_amount : '—'}
                      </td>

                      <td
                        style={{
                          padding: '8px 10px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 100,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.promoter_name || '—'}
                          </span>
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
                              <MessageCircle size={12} color="#00C37A" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '8px 10px',
                          borderLeft: '1px solid var(--glass-border)',
                          minWidth: 80,
                          verticalAlign: 'middle',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
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
                      </td>
                    </tr>
                  )
                })}

              <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'var(--glass)' }}>
                <td colSpan={16} style={{ padding: '8px 12px', fontWeight: 800, fontSize: 13 }}>
                  סה&quot;כ
                  {' '}
                  {tableOrders
                    .filter((o) => tableFilter.category === 'all' || o.category === tableFilter.category)
                    .filter((o) => tableFilter.status === 'all' || o.status === tableFilter.status).length}
                  {' '}
                  שולחנות
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 800, fontSize: 14, color: '#00C37A' }}>
                  ₪
                  {tableOrders
                    .filter((o) => tableFilter.category === 'all' || o.category === tableFilter.category)
                    .filter((o) => tableFilter.status === 'all' || o.status === tableFilter.status)
                    .reduce((s, o) => s + orderLineTotal(o), 0).toLocaleString()}
                </td>
                <td colSpan={5} />
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
          {tableOrders
            .filter((o) => tableFilter.category === 'all' || o.category === tableFilter.category)
            .filter((o) => tableFilter.status === 'all' || o.status === tableFilter.status)
            .map((order) => {
            const table = tables.find((t) => t.id === order.event_table_id)
            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.reserved
            const hasPendingUpsell = order.items?.some((i) => i.is_upsell && i.status === 'pending')
            return (
              <div
                key={order.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setTableEditModal(order)
                  setTableEditTab('details')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setTableEditModal(order)
                    setTableEditTab('details')
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
                  WebkitTapHighlightColor: 'transparent',
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

      {showAddTableModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        >
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 24,
            width: '90%', maxWidth: 400,
          }}
          >
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, textAlign: 'right' }}>
              בחר מספר שולחן
            </p>
            <CustomSelect
              value={newTableNumber}
              onChange={(v) => setNewTableNumber(v)}
              placeholder="בחר שולחן..."
              searchable
              options={(allTables || [])
                .filter((t) => !tables.some((existing) => existing.table_number === t.table_number))
                .sort((a, b) => Number(a.table_number) - Number(b.table_number))
                .map((t) => ({ value: t.table_number, label: t.table_number }))}
              menuStyle={{ maxHeight: 220, overflowY: 'auto' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button"
                onClick={() => { setShowAddTableModal(false); setNewTableNumber('') }}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 10,
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', cursor: 'pointer',
                }}
              >ביטול</button>
              <button type="button"
                onClick={async () => {
                  if (!newTableNumber) return
                  try {
                    const tableRes = await fetch(
                      `${API_BASE}/api/admin/events/${eventId}/tables`,
                      {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({ table_number: newTableNumber, capacity: 4 }),
                      }
                    )
                    if (!tableRes.ok) { toast.error('שגיאה ביצירת שולחן'); return }
                    const tableData = await tableRes.json()
                    await fetch(
                      `${API_BASE}/api/admin/events/${eventId}/table-orders`,
                      {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({
                          event_table_id: tableData.table?.id,
                          table_number: newTableNumber,
                          customer_name: 'לקוח חדש',
                          customer_phone: '-',
                          status: 'pending_approval',
                        }),
                      }
                    )
                    setShowAddTableModal(false)
                    setNewTableNumber('')
                    loadData()
                    toast.success('שולחן נוסף')
                  } catch { toast.error('שגיאה') }
                }}
                style={{
                  flex: 2, minHeight: 44, borderRadius: 10,
                  background: '#00C37A', border: 'none',
                  color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >הוסף שולחן</button>
            </div>
          </div>
        </div>
      )}

      {tableEditModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setTableEditModal(null) }}
          role="presentation"
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 20,
              width: '100%', maxWidth: 720,
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              border: '1px solid var(--glass-border)',
              overflow: 'visible',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexShrink: 0,
            }}
            >
              <button
                type="button"
                onClick={() => setTableEditModal(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', fontSize: 20,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                ✕
              </button>
              <div style={{ textAlign: 'right', flex: 1, marginRight: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', marginBottom: 4 }}>
                  {tableEditModal.status === 'pending_approval' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(
                          `${API_BASE}/api/admin/events/${eventId}/table-orders/${tableEditModal.id}`,
                          {
                            method: 'PATCH',
                            headers: authHeaders(),
                            body: JSON.stringify({ status: 'active' }),
                          },
                        )
                        if (res.ok) {
                          toast.success('ההזמנה אושרה! QR נשלח לכל חברי השולחן ✓')
                          setTableEditModal((prev) => (prev ? { ...prev, status: 'active' } : prev))
                          loadData()
                        }
                      }}
                      style={{
                        padding: '6px 16px', borderRadius: 20, fontSize: 12,
                        background: '#00C37A', border: 'none',
                        color: '#000', fontWeight: 700, cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      ✓ אשר הזמנה
                    </button>
                  )}
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background:
                      tableEditModal.status === 'pending_approval' ? 'rgba(245,158,11,0.15)'
                        : tableEditModal.status === 'active' ? 'rgba(0,195,122,0.15)'
                          : tableEditModal.status === 'cancelled' ? 'rgba(239,68,68,0.15)' : 'var(--glass)',
                    color:
                      tableEditModal.status === 'pending_approval' ? '#F59E0B'
                        : tableEditModal.status === 'active' ? '#00C37A'
                          : tableEditModal.status === 'cancelled' ? '#EF4444' : 'var(--v2-gray-400)',
                  }}
                  >
                    {tableEditModal.status === 'pending_approval' ? 'ממתין לאישור'
                      : tableEditModal.status === 'active' ? 'מאושר'
                        : tableEditModal.status === 'cancelled' ? 'מבוטל' : tableEditModal.status}
                  </span>
                </div>
                <h2 style={{ margin: '0 0 2px', fontSize: 17, fontWeight: 800 }}>
                  {tableEditModal.customer_name}
                  {' '}
                  {tableEditModal.customer_last_name || ''}
                  <span style={{ fontSize: 14, color: 'var(--v2-gray-400)', fontWeight: 400, marginRight: 8 }}>
                    {(() => {
                      const g = tableEditModal.guests
                      const gArr = Array.isArray(g) ? g : (g ? (() => { try { return JSON.parse(g) } catch { return [] } })() : [])
                      return `${gArr.length + 1} אנשים`
                    })()}
                  </span>
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                  {tableEditModal.table_number ? `שולחן ${tableEditModal.table_number}` : 'ממתין להקצאת שולחן'}
                  {tableEditModal.status === 'pending_approval' && (
                    <span style={{ fontSize: 11, color: '#F59E0B', marginRight: 8 }}>
                      — בחר שולחן ואשר לשליחת QR לחברי השולחן
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex', overflowX: 'auto', padding: '0 24px',
              borderBottom: '1px solid var(--glass-border)',
              flexShrink: 0, gap: 0,
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
            >
              {TABLE_EDIT_TABS.map((tab) => {
                const Icon = tab.Icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTableEditTab(tab.id)}
                    style={{
                      padding: '14px 16px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, fontWeight: tableEditTab === tab.id ? 700 : 400,
                      color: tableEditTab === tab.id ? '#00C37A' : 'var(--v2-gray-400)',
                      borderBottom: `2px solid ${tableEditTab === tab.id ? '#00C37A' : 'transparent'}`,
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                      WebkitTapHighlightColor: 'transparent',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Icon size={16} strokeWidth={2} color={tableEditTab === tab.id ? '#00C37A' : 'var(--v2-gray-400)'} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'clip', padding: '24px' }}>
              {tableEditTab === 'details' && (
                <TableEditDetails
                  order={tableEditModal}
                  availableTables={allTables}
                  staffList={staffList}
                  promoters={promoters}
                  onRequestDelete={() => setConfirmDeleteTable(true)}
                  onOpenStaffTab={() => setTableEditTab('staff')}
                  authHeaders={authHeaders}
                  eventId={eventId}
                  businessId={businessId}
                  editModalOpenId={tableEditModal?.id}
                  loadData={loadData}
                  templateTables={templateTables}
                  tableNameOptions={tableNameOptions}
                  setTableNameOptions={setTableNameOptions}
                  onUpdate={(updated) => {
                    if (updated?.__deleted) {
                      setTableEditModal(null)
                      return
                    }
                    setTableEditModal((prev) => (prev ? { ...prev, ...updated } : prev))
                    loadData()
                  }}
                />
              )}
              {tableEditTab === 'guests' && (
                <TableEditGuests
                  order={tableEditModal}
                  authHeaders={authHeaders}
                  eventId={eventId}
                  onUpdate={(updated) => {
                    setTableEditModal((prev) => (prev ? { ...prev, ...updated } : prev))
                    loadData()
                  }}
                />
              )}
              {tableEditTab === 'account' && (
                <TableEditAccount
                  order={tableEditModal}
                  menuItems={menuItems}
                  authHeaders={authHeaders}
                  eventId={eventId}
                  onUpdate={async (updated) => {
                    setTableEditModal((prev) => ({ ...prev, ...updated }))
                    await loadData()
                    setTableEditModal((prev) => {
                      if (!prev) return prev
                      const fresh = tableOrdersRef.current?.find((o) => o.id === prev.id)
                      return fresh ? { ...prev, ...fresh } : prev
                    })
                  }}
                />
              )}
              {tableEditTab === 'requests' && (
                <TableEditRequests
                  order={tableEditModal}
                  menuItems={menuItems}
                  authHeaders={authHeaders}
                  eventId={eventId}
                  loadData={loadData}
                  onUpdate={(updated) => {
                    setTableEditModal((prev) => (prev ? { ...prev, ...updated } : prev))
                    loadData()
                  }}
                />
              )}
              {tableEditTab === 'notes' && (
                <TableEditNotes
                  order={tableEditModal}
                  authHeaders={authHeaders}
                  eventId={eventId}
                  onUpdate={(updated) => {
                    setTableEditModal((prev) => (prev ? { ...prev, ...updated } : prev))
                    loadData()
                  }}
                />
              )}
              {tableEditTab === 'staff' && (
                <div style={{ WebkitOverflowScrolling: 'touch' }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>צוות האירוע</h3>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
                    {[
                      { id: 'all', label: 'כל הצוות' },
                      { id: 'waitress', label: 'מלצרים' },
                      { id: 'promoter', label: 'יחצ"נים' },
                      { id: 'bar', label: 'בר' },
                      { id: 'entrance', label: 'כניסות' },
                      { id: 'scanner', label: 'סריקה' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStaffSubTab(tab.id)}
                        style={{
                          minHeight: 48,
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, whiteSpace: 'nowrap',
                          background: staffSubTab === tab.id ? 'rgba(0,195,122,0.1)' : 'var(--glass)',
                          border: `1px solid ${staffSubTab === tab.id ? 'rgba(0,195,122,0.3)' : 'var(--glass-border)'}`,
                          color: staffSubTab === tab.id ? '#00C37A' : 'var(--v2-gray-400)',
                          cursor: 'pointer', fontWeight: staffSubTab === tab.id ? 700 : 400,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {(staffSubTab === 'all'
                    ? staffList
                    : staffList.filter((s) => (
                      s.role === staffSubTab
                      || (staffSubTab === 'bar' && s.role === 'bar_manager')
                      || (staffSubTab === 'entrance' && s.role === 'selector')
                      || (staffSubTab === 'scanner' && s.role === 'scanner')
                    )))
                    .map((member) => {
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
                              <X size={14} color="#00C37A" />
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
                                <Link size={14} color="#00C37A" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStaffId(member.id)
                                  setEditStaffData({ name: member.name, phone: member.phone })
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A' }}
                              >
                                <Pencil size={14} color="#00C37A" />
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

                  {(staffSubTab === 'all'
                    ? staffList.length === 0
                    : staffList.filter((s) => (
                      s.role === staffSubTab
                      || (staffSubTab === 'bar' && s.role === 'bar_manager')
                      || (staffSubTab === 'entrance' && s.role === 'selector')
                      || (staffSubTab === 'scanner' && s.role === 'scanner')
                    )).length === 0) && (
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
                    <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>+ הוספת מלצרית</p>
                    {[
                      { field: 'name', placeholder: 'שם פרטי' },
                      { field: 'last_name', placeholder: 'שם משפחה' },
                      { field: 'phone', placeholder: 'מספר נייד' },
                    ].map(({ field, placeholder }) => (
                      <input
                        key={field}
                        value={newStaff[field]}
                        onChange={(e) => setNewStaff((w) => ({ ...w, [field]: e.target.value }))}
                        placeholder={placeholder}
                        style={{
                          width: '100%', minHeight: 44, padding: '10px 14px', borderRadius: 8, marginBottom: 8,
                          background: 'var(--card)', border: '1px solid var(--glass-border)',
                          color: 'var(--text)', fontSize: 16, textAlign: 'right', boxSizing: 'border-box',
                        }}
                      />
                    ))}
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6, textAlign: 'right' }}>
                        שולחנות משויכים
                      </label>
                      <CustomSelect
                        value=""
                        onChange={(v) => {
                          if (!newStaff.tables_assigned.includes(v)) {
                            setNewStaff((w) => ({ ...w, tables_assigned: [...w.tables_assigned, v] }))
                          }
                        }}
                        placeholder="הוסף שולחן..."
                        options={(templateTables || [])
                          .sort((a, b) => Number(a.table_number) - Number(b.table_number))
                          .map((t) => ({ value: t.table_number, label: t.table_number }))}
                        menuStyle={{ maxHeight: 180, overflowY: 'auto' }}
                      />
                      {newStaff.tables_assigned.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {newStaff.tables_assigned.map((t) => (
                            <span key={t} style={{
                              padding: '4px 10px', borderRadius: 20, fontSize: 12,
                              background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)',
                              color: '#00C37A', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                            >
                              {t}
                              <button
                                type="button"
                                onClick={() => setNewStaff((w) => ({ ...w, tables_assigned: w.tables_assigned.filter((x) => x !== t) }))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 14, padding: 0 }}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {[
                      { field: 'save_to_venue', label: 'שמור לצוות המקום' },
                      { field: 'save_to_event', label: 'שמור לאירוע זה בלבד' },
                      { field: 'wa_notifications', label: 'קבל התראות WhatsApp' },
                    ].map(({ field, label }) => (
                      <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'flex-end', cursor: 'pointer' }}>
                        <span style={{ fontSize: 13 }}>{label}</span>
                        <input
                          type="checkbox"
                          checked={newStaff[field]}
                          onChange={(e) => setNewStaff((w) => ({ ...w, [field]: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: '#00C37A' }}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newStaff.name?.trim() || !newStaff.phone?.trim()) return
                        await fetch(`${API_BASE}/api/admin/events/${eventId}/table-staff`, {
                          method: 'POST',
                          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: `${newStaff.name} ${newStaff.last_name}`.trim(),
                            phone: newStaff.phone,
                            role: 'waitress',
                            tables_assigned: newStaff.tables_assigned,
                            wa_notifications: newStaff.wa_notifications,
                          }),
                        })
                        setNewStaff({
                          name: '',
                          last_name: '',
                          phone: '',
                          tables_assigned: [],
                          save_to_venue: true,
                          save_to_event: true,
                          wa_notifications: true,
                        })
                        loadData()
                        toast.success('מלצרית נוספה ✓')
                      }}
                      style={{
                        width: '100%',
                        minHeight: 44,
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
              )}
              {tableEditTab === 'menu' && (
                <div style={{ maxHeight: 'min(70vh, 560px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                    <Share2 size={14} color="#00C37A" />
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
              )}
            </div>
          </div>
        </div>
      )}
      {confirmDeleteTable && tableEditModal && (
        <TableAssignConfirmModal
          title="מחיקת שולחן"
          message="מחיקת שולחן מהרשימה היא סופית. האם אתה בטוח?"
          confirmText="מחק לצמיתות"
          confirmColor="#EF4444"
          onConfirm={async () => {
            await fetch(`${API_BASE}/api/admin/events/${eventId}/table-orders/${tableEditModal.id}`, {
              method: 'DELETE',
              headers: authHeaders(),
            })
            setConfirmDeleteTable(false)
            setTableEditModal(null)
            await loadData?.()
            toast.success('השולחן נמחק')
          }}
          onCancel={() => setConfirmDeleteTable(false)}
        />
      )}

      {guestsDrawer && (() => {
        const drawerGuests = (() => {
          const g = guestsDrawer?.guests
          if (!g) return []
          if (Array.isArray(g)) return g
          try {
            return JSON.parse(g)
          } catch {
            return []
          }
        })()
        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'flex-end',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setGuestsDrawer(null) }}
            role="presentation"
          >
            <div style={{
              width: '100%', maxWidth: 520, margin: '0 auto',
              background: 'var(--card)', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 32px', maxHeight: '80vh', overflowY: 'auto',
            }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  חברי שולחן
                  {guestsDrawer.table_number ? ` — שולחן ${guestsDrawer.table_number}` : ''}
                </h3>
                <button
                  type="button"
                  onClick={() => setGuestsDrawer(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', fontSize: 20 }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                background: 'rgba(0,195,122,0.08)',
                border: '1px solid rgba(0,195,122,0.2)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 12,
              }}
              >
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#00C37A', fontWeight: 600 }}>
                  👑 ראש שולחן
                </p>
                <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>
                  {guestsDrawer.customer_name}
                  {' '}
                  {guestsDrawer.customer_last_name || ''}
                </p>
                {guestsDrawer.customer_phone && (
                  <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
                    📱
                    {' '}
                    {guestsDrawer.customer_phone}
                  </p>
                )}
                {guestsDrawer.customer_email && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                    ✉️
                    {' '}
                    {guestsDrawer.customer_email}
                  </p>
                )}
                <span style={{
                  display: 'inline-block', marginTop: 6,
                  padding: '2px 10px', borderRadius: 20, fontSize: 11,
                  background: 'rgba(0,195,122,0.15)', color: '#00C37A',
                }}
                >
                  חינם
                </span>
              </div>

              {drawerGuests.length > 0 ? (
                drawerGuests.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--glass)', borderRadius: 12,
                      padding: '12px 16px', marginBottom: 8,
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600 }}>
                          {g.first_name || g.name}
                          {' '}
                          {g.last_name || ''}
                        </p>
                        {g.phone && (
                          <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
                            📱
                            {' '}
                            {g.phone}
                          </p>
                        )}
                        {g.email && (
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                            ✉️
                            {' '}
                            {g.email}
                          </p>
                        )}
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11,
                        background: g.is_free ? 'rgba(0,195,122,0.15)' : 'rgba(255,255,255,0.1)',
                        color: g.is_free ? '#00C37A' : 'var(--v2-gray-400)',
                        flexShrink: 0, marginRight: 8,
                      }}
                      >
                        {g.is_free ? 'חינם' : `₪${g.ticket_price || 0}`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13, padding: 16 }}>
                  אין חברי שולחן נוספים
                </p>
              )}

              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: 'var(--glass)', borderRadius: 12,
                border: '1px solid var(--glass-border)',
                display: 'flex', justifyContent: 'space-between',
              }}
              >
                <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>
                  סה&quot;כ
                  {' '}
                  {drawerGuests.length + 1}
                  {' '}
                  אנשים
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00C37A' }}>
                  ₪
                  {Number(guestsDrawer.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {tableAssignModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTableAssignModal(null)
              setSelectedTableId('')
              setTableAssignConfirmOpen(false)
            }
          }}
          role="presentation"
        >
          <div style={{
            background: 'var(--card)', borderRadius: 20,
            padding: 24, width: '100%', maxWidth: 420,
            border: '1px solid var(--glass-border)',
          }}
          >
            <h3 style={{
              margin: '0 0 8px', fontSize: 17, fontWeight: 700, textAlign: 'right',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
            }}
            >
              הקצאת שולחן
              <Armchair size={22} strokeWidth={2} aria-hidden />
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--v2-gray-400)', textAlign: 'right' }}>
              {[tableAssignModal.customer_name, tableAssignModal.customer_last_name].filter(Boolean).join(' ') || '—'}
              {' — '}
              {tableAssignModal.guest_count ?? tableAssignModal.quantity ?? 1}
              {' '}
              אנשים
            </p>

            <div style={{ marginBottom: 20 }}>
              <span style={{
                display: 'block', fontSize: 12,
                color: 'var(--v2-gray-400)', marginBottom: 8, textAlign: 'right',
              }}
              >
                בחר שולחן פנוי
              </span>
              {availableTables.length === 0 ? (
                <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, textAlign: 'right' }}>
                  אין שולחנות פנויים כרגע
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                  gap: 8, maxHeight: 240, overflowY: 'auto',
                }}
                >
                  {availableTables.map((tbl) => (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => setSelectedTableId(tbl.id)}
                      style={{
                        padding: '10px 6px', borderRadius: 10, fontSize: 13,
                        fontWeight: selectedTableId === tbl.id ? 700 : 400,
                        background: selectedTableId === tbl.id
                          ? 'rgba(0,195,122,0.15)' : 'var(--glass)',
                        border: `1px solid ${selectedTableId === tbl.id
                          ? 'rgba(0,195,122,0.4)' : 'var(--glass-border)'}`,
                        color: selectedTableId === tbl.id ? '#00C37A' : 'var(--text)',
                        cursor: 'pointer', textAlign: 'center',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {tbl.table_number}
                      </div>
                      {tbl.table_name && (
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                          {tbl.table_name}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (!selectedTableId) return
                  setTableAssignConfirmOpen(true)
                }}
                disabled={!selectedTableId || assigning}
                style={{
                  flex: 1, minHeight: 48, borderRadius: 12,
                  background: selectedTableId ? '#00C37A' : 'var(--glass)',
                  border: 'none',
                  color: selectedTableId ? '#000' : 'var(--v2-gray-400)',
                  fontSize: 15, fontWeight: 700,
                  cursor: selectedTableId ? 'pointer' : 'not-allowed',
                  opacity: assigning ? 0.6 : 1,
                  WebkitTapHighlightColor: 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {assigning ? 'מקצה...' : (
                  <><Check size={18} strokeWidth={2.5} aria-hidden /> אשר ושלח QR</>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableAssignModal(null)
                  setSelectedTableId('')
                  setTableAssignConfirmOpen(false)
                }}
                style={{
                  minHeight: 48, padding: '0 20px', borderRadius: 12,
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  color: 'var(--text)', fontSize: 14, cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {tableAssignConfirmOpen && tableAssignModal && selectedTableId && (
        <TableAssignConfirmModal
          title="לאשר הקצאה?"
          message={
            `להקצות שולחן ${availableTables.find((t) => t.id === selectedTableId)?.table_number ?? ''} ולאשר את ההזמנה? נשלח SMS עם קישור ה-QR לשולחן.`
          }
          confirmText="אשר ושלח"
          confirmColor="#00C37A"
          onCancel={() => setTableAssignConfirmOpen(false)}
          onConfirm={async () => {
            if (!tableAssignModal || !selectedTableId) return
            setTableAssignConfirmOpen(false)
            setAssigning(true)
            try {
              const selectedTable = availableTables.find((t) => t.id === selectedTableId)
              const res = await fetch(
                `${API_BASE}/api/admin/orders/${tableAssignModal.id}/approve-table`,
                {
                  method: 'POST',
                  headers: authHeaders(),
                  body: JSON.stringify({
                    table_id: selectedTableId,
                    table_number: selectedTable?.table_number,
                  }),
                },
              )
              if (res.ok) {
                toast.success(`שולחן ${selectedTable?.table_number} הוקצה`)
                setTableAssignModal(null)
                setSelectedTableId('')
                await loadData()
              } else {
                let msg = 'שגיאה בהקצאה'
                try {
                  const err = await res.json()
                  msg = err.message || err.error || msg
                } catch { /* ignore */ }
                toast.error(msg)
              }
            } catch {
              toast.error('שגיאה בחיבור לשרת')
            } finally {
              setAssigning(false)
            }
          }}
        />
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
