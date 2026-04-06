import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, ChevronLeft, ExternalLink, Download, Edit,
  CheckCircle, Clock, XCircle, MessageCircle, DollarSign, Users, QrCode, Eye, Ticket,
  Upload, Plus, X, Settings, Share2, Copy, Trash2, RotateCcw, Pencil, Calculator,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import CustomSelect from '@/components/ui/CustomSelect'
import EventTables from './EventTables'
import TemplatesTab from './TemplatesTab'
import { exportToExcel, exportEventReport, exportAudienceToExcel } from '@/utils/exportExcel'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const PUBLIC_WEBVIEW_ORIGIN = 'https://axess.pro'

const EXPENSE_CATEGORIES = [
  { value: 'staff', label: 'כוח אדם' },
  { value: 'lineup', label: 'ליינאפ' },
  { value: 'marketing', label: 'שיווק' },
  { value: 'operations', label: 'תפעול' },
  { value: 'fixed', label: 'עלויות קבועות' },
  { value: 'other', label: 'שונות' },
]

const REVENUE_SOURCES = [
  { value: 'cash_entry', label: 'כניסות מזומן' },
  { value: 'credit_entry', label: 'כניסות אשראי' },
  { value: 'bar', label: 'בר' },
  { value: 'tables', label: 'שולחנות' },
  { value: 'storage', label: 'שמירת חפצים' },
  { value: 'other', label: 'אחר' },
]

const INVOICE_TYPES = [
  { value: 'authorized', label: 'מורשה' },
  { value: 'ltd', label: 'בע"מ' },
  { value: 'exempt', label: 'פטור' },
  { value: 'none', label: 'ללא' },
]

const PAYMENT_STATUS = {
  paid: { label: 'שולם ✅', color: '#00C37A' },
  pending: { label: 'לא שולם ⏳', color: '#F59E0B' },
  reviewing: { label: 'בבדיקה 🔍', color: '#3B82F6' },
  dispute: { label: 'מחלוקת ⚠️', color: '#EF4444' },
}

const VAT_MODES = [
  { value: 'included', label: 'כולל מע"מ' },
  { value: 'excluded', label: 'לא כולל מע"מ' },
  { value: 'exempt', label: 'פטור' },
]

const AUDIENCE_COLUMNS = [
  { key: 'actions', label: 'פעולות', sticky: true },
  { key: 'status', label: 'סטטוס' },
  { key: 'ticket_name', label: 'שם כרטיס' },
  { key: 'ticket_category', label: 'סוג' },
  { key: 'first_name', label: 'שם' },
  { key: 'last_name', label: 'שם משפחה' },
  { key: 'phone', label: 'טלפון' },
  { key: 'email', label: 'מייל' },
  { key: 'instagram', label: 'אינסטגרם' },
  { key: 'identification_number', label: 'ת.ז' },
  { key: 'promoter_name', label: 'יחצ"ן' },
  { key: 'promoter_commission', label: 'עמלה' },
  { key: 'order_number', label: 'מספר הזמנה' },
  { key: 'payment_id', label: 'מספר תשלום' },
  { key: 'total_amount', label: 'סכום' },
  { key: 'payment_mode', label: 'מסלול תשלום' },
  { key: 'created_at', label: 'תאריך רכישה' },
  { key: 'event_date', label: 'תאריך אירוע' },
  { key: 'checked_in', label: 'נסרק' },
  { key: 'checked_in_at', label: 'זמן כניסה' },
  { key: 'approved_at', label: 'אושר ב' },
  { key: 'cancelled_at', label: 'בוטל ב' },
  { key: 'event_number', label: 'מספר אירוע' },
]

function formatEventDate(dateVal) {
  if (!dateVal) return '—'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return '—'
    const date = d.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jerusalem',
    })
    const time = d.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jerusalem',
    })
    return `${date} · ${time}`
  } catch {
    return '—'
  }
}

function downloadChannelReport(ordersData, channelName) {
  const headers = ['שם', 'שם משפחה', 'נייד', 'מייל', 'סוג כרטיס', 'סכום',
    'מזהה עסקה', 'ת"ז', 'יחצ"ן', 'אינסטגרם', 'ערוץ', 'תאריך']
  const rows = ordersData.map((o) => [
    o.first_name, o.last_name, o.phone, o.email || '',
    o.ticket_type || 'רגיל', o.total_price || 0,
    o.id?.slice(0, 8), o.id_number || '', o.promoter_name || '',
    o.instagram || '', o.sales_channel || 'axess',
    new Date(o.created_at).toLocaleDateString('he-IL'),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${channelName}-orders.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function calcExpenseVat(exp) {
  const total = parseFloat(exp.amount || 0) * parseInt(exp.quantity || 1, 10)
  if (exp.vat_mode === 'included') {
    const vat = Math.round((total / 1.18) * 0.18)
    return { total, vat, beforeVat: total - vat }
  }
  if (exp.vat_mode === 'excluded') {
    const vat = Math.round(total * 0.18)
    return { total: total + vat, vat, beforeVat: total }
  }
  return { total, vat: 0, beforeVat: total }
}

function FoodCostRow({ barRevenue, tablesRevenue, foodCostPct, foodCostBase, onUpdate }) {
  const [editPct, setEditPct] = useState(false)
  const [editBase, setEditBase] = useState(false)
  const [tempPct, setTempPct] = useState(foodCostPct)
  const autoBase = (barRevenue || 0) + (tablesRevenue || 0)
  const [tempBase, setTempBase] = useState('')

  const pct = foodCostPct || 20
  const base = foodCostBase != null ? Number(foodCostBase) : autoBase
  const amount = Math.round(base * (pct / 100))

  return (
    <tr style={{ background: 'rgba(245,158,11,0.06)', borderTop: '2px dashed rgba(245,158,11,0.3)' }}>
      <td style={{ padding: '8px 10px', fontSize: 11, color: '#F59E0B' }}>אוטו׳</td>
      <td style={{ padding: '8px 10px', fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>פוד קוסט</td>
      <td style={{ padding: '8px 10px' }} onDoubleClick={() => { setEditBase(true); setTempBase(String(base)) }}>
        {editBase ? (
          <input
            value={tempBase}
            onChange={(e) => setTempBase(e.target.value)}
            type="number"
            onBlur={() => {
              const v = parseFloat(tempBase)
              onUpdate(foodCostPct, Number.isFinite(v) ? v : 0)
              setEditBase(false)
            }}
            autoFocus
            style={{
              width: 80, background: 'var(--glass)', border: '1px solid #F59E0B', borderRadius: 4,
              padding: '2px 6px', color: 'var(--text)', fontSize: 12,
            }}
          />
        ) : (
          <span style={{ fontSize: 12, color: foodCostBase != null ? '#F59E0B' : 'var(--v2-gray-400)', cursor: 'text' }}>
            {foodCostBase != null ? '✏️ ' : '🔄 '}
            ₪
            {base.toLocaleString()}
            {foodCostBase != null && (
              <button
                type="button"
                onClick={() => { onUpdate(foodCostPct, null) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 10, marginRight: 4,
                }}
              >
                איפוס
              </button>
            )}
          </span>
        )}
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center' }} onDoubleClick={() => { setEditPct(true); setTempPct(foodCostPct) }}>
        {editPct ? (
          <input
            value={tempPct}
            onChange={(e) => setTempPct(e.target.value)}
            type="number"
            min="0"
            max="100"
            onBlur={() => {
              onUpdate(parseFloat(tempPct) || 20, foodCostBase)
              setEditPct(false)
            }}
            autoFocus
            style={{
              width: 50, background: 'var(--glass)', border: '1px solid #F59E0B', borderRadius: 4,
              padding: '2px 4px', color: 'var(--text)', textAlign: 'center',
            }}
          />
        ) : (
          <span style={{ cursor: 'text', color: '#F59E0B', fontWeight: 700 }}>
            {pct}
            %
          </span>
        )}
      </td>
      <td style={{ padding: '8px 10px' }} />
      <td style={{ padding: '8px 10px' }} />
      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#F59E0B' }}>
        ₪
        {amount.toLocaleString()}
      </td>
      <td colSpan={4} style={{ padding: '8px 10px', fontSize: 11, color: 'var(--v2-gray-400)' }}>
        {foodCostBase != null
          ? 'בסיס ידני'
          : `בר ₪${barRevenue.toLocaleString()} + שולחנות ₪${tablesRevenue.toLocaleString()}`}
      </td>
      <td style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => { setEditPct(true); setTempPct(foodCostPct) }}
            title="ערוך אחוז"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', padding: 3 }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => { setEditBase(true); setTempBase(String(base)) }}
            title="ערוך בסיס"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: 3 }}
          >
            <Calculator size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function EditableExpenseRow({ exp, onUpdate, onDelete, onAddBelow, onDuplicate, onApplyDateToAll }) {
  const [editing, setEditing] = useState(null)
  const [tempVal, setTempVal] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const startEdit = (field, val) => {
    setEditing(field)
    setTempVal(String(val || ''))
  }
  const saveEdit = (field) => {
    if (tempVal !== String(exp[field] || '')) {
      onUpdate(field, tempVal)
    }
    setEditing(null)
  }

  const EditCell = ({ field, value, type = 'text', style = {} }) => (
    <td
      style={{ padding: '6px 10px', ...style }}
      onClick={() => startEdit(field, value)}
    >
      {editing === field ? (
        <input
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          onBlur={() => saveEdit(field)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit(field)
            if (e.key === 'Escape') setEditing(null)
          }}
          type={type}
          autoFocus
          style={{
            width: '100%', background: 'var(--glass)',
            border: '1px solid #00C37A', borderRadius: 4,
            padding: '2px 6px', color: 'var(--text)', fontSize: 13,
            outline: 'none',
          }}
        />
      ) : (
        <span style={{
          fontSize: 13, cursor: 'text', display: 'block',
          minHeight: 20,
          color: value ? 'var(--text)' : 'var(--v2-gray-400)',
        }}
        >
          {value || '—'}
        </span>
      )}
    </td>
  )

  return (
    <tr
      style={{
        borderTop: '1px solid var(--glass-border)',
        opacity: exp.isTemplate ? 0.65 : 1,
        background: exp.isTemplate ? 'rgba(255,255,255,0.01)' : 'transparent',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,195,122,0.03)' }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = exp.isTemplate ? 'rgba(255,255,255,0.01)' : 'transparent'
      }}
    >

      <td
        style={{ padding: '6px 10px', fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}
        onClick={() => {
          if (editing !== 'expense_date') startEdit('expense_date', exp.expense_date || today)
        }}
      >
        {editing === 'expense_date' ? (
          <div style={{ position: 'relative' }}>
            <input
              value={tempVal || today}
              onChange={(e) => setTempVal(e.target.value)}
              onBlur={() => saveEdit('expense_date')}
              type="date"
              autoFocus
              style={{
                background: 'var(--glass)', border: '1px solid #00C37A', borderRadius: 4,
                padding: '2px 6px', color: 'var(--text)', fontSize: 12,
              }}
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onApplyDateToAll(tempVal || today); setEditing(null) }}
              style={{
                display: 'block', marginTop: 4, fontSize: 11, background: 'rgba(0,195,122,0.15)',
                border: '1px solid #00C37A', borderRadius: 4, color: '#00C37A', cursor: 'pointer',
                padding: '2px 8px', whiteSpace: 'nowrap',
              }}
            >
              החל על כל השורות
            </button>
          </div>
        ) : (
          <span style={{ cursor: 'text' }}>
            {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('he-IL')
              : exp.created_at ? new Date(exp.created_at).toLocaleDateString('he-IL')
                : new Date().toLocaleDateString('he-IL')}
          </span>
        )}
      </td>

      <td style={{ padding: '4px 6px', minWidth: 130 }}>
        <CustomSelect
          value={exp.category || ''}
          onChange={(v) => onUpdate('category', v)}
          options={EXPENSE_CATEGORIES}
          style={{ fontSize: 12, position: 'relative', zIndex: 999 }}
        />
      </td>

      <EditCell field="item_name" value={exp.vendor_name || exp.item_name} />

      <EditCell field="quantity" value={exp.quantity || 1} type="number" style={{ textAlign: 'center', maxWidth: 60 }} />

      <td style={{ padding: '6px 10px' }} onClick={() => startEdit('amount', exp.amount || 0)}>
        {editing === 'amount' ? (
          <input
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            onBlur={() => saveEdit('amount')}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit('amount') }}
            type="number"
            autoFocus
            style={{
              width: 80, background: 'var(--glass)', border: '1px solid #00C37A', borderRadius: 4,
              padding: '2px 6px', color: 'var(--text)',
            }}
          />
        ) : (
          <span style={{ fontSize: 13, cursor: 'text' }}>
            {exp.amount ? `₪${parseFloat(exp.amount).toLocaleString()}` : '—'}
          </span>
        )}
      </td>

      <td style={{ padding: '4px 6px', minWidth: 120 }}>
        <CustomSelect
          value={exp.vat_mode || 'included'}
          onChange={(v) => onUpdate('vat_mode', v)}
          options={VAT_MODES}
          style={{ fontSize: 12, position: 'relative', zIndex: 999 }}
        />
      </td>

      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
        {exp.amount ? `₪${(parseFloat(exp.amount || 0) * parseInt(exp.quantity || 1, 10)).toLocaleString()}` : '—'}
      </td>

      <td style={{ padding: '4px 6px', minWidth: 100 }}>
        <CustomSelect
          value={exp.invoice_type || 'none'}
          onChange={(v) => onUpdate('invoice_type', v)}
          options={INVOICE_TYPES}
          style={{ fontSize: 12, position: 'relative', zIndex: 999 }}
        />
      </td>

      <EditCell field="invoice_number" value={exp.invoice_number} style={{ maxWidth: 90 }} />

      <td style={{ padding: '4px 6px', minWidth: 120 }}>
        <CustomSelect
          value={exp.payment_status || 'pending'}
          onChange={(v) => onUpdate('payment_status', v)}
          options={Object.entries(PAYMENT_STATUS).map(([v, { label }]) => ({ value: v, label }))}
          style={{ fontSize: 12, position: 'relative', zIndex: 999 }}
        />
      </td>

      <EditCell field="notes" value={exp.notes} />

      <td style={{ padding: '6px 8px', minWidth: 110 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => onAddBelow(exp.category)}
            title="הוסף שורה מתחת"
            style={{
              background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)', borderRadius: 6,
              cursor: 'pointer', color: '#00C37A', padding: '4px 6px', display: 'flex', alignItems: 'center',
            }}
          >
            <Plus size={13} />
          </button>
          <button
            onClick={onDuplicate}
            title="שכפל"
            style={{
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6,
              cursor: 'pointer', color: '#8B5CF6', padding: '4px 6px', display: 'flex', alignItems: 'center',
            }}
          >
            <Copy size={13} />
          </button>
          <button
            onClick={onDelete}
            title="מחק"
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
              cursor: 'pointer', color: '#EF4444', padding: '4px 6px', display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function EditableRevenueRow({
  rev, onUpdate, onDelete, onDuplicate, onAddBelow, revenueSourceOptions, calcVat,
}) {
  const [editing, setEditing] = useState(null)
  const [tempVal, setTempVal] = useState('')

  const startEdit = (field, val) => {
    setEditing(field)
    setTempVal(String(val || ''))
  }
  const saveEdit = (field) => {
    if (tempVal !== String(rev[field] || '')) onUpdate(field, tempVal)
    setEditing(null)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <tr
      style={{ borderTop: '1px solid var(--glass-border)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,195,122,0.03)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >

      <td
        style={{ padding: '6px 10px', fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}
        onClick={() => {
          if (editing !== 'revenue_date') startEdit('revenue_date', rev.revenue_date || today)
        }}
      >
        {editing === 'revenue_date' ? (
          <input
            value={tempVal || today}
            onChange={(e) => setTempVal(e.target.value)}
            onBlur={() => saveEdit('revenue_date')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit('revenue_date')
              if (e.key === 'Escape') setEditing(null)
            }}
            type="date"
            autoFocus
            style={{
              background: 'var(--glass)', border: '1px solid #00C37A', borderRadius: 4,
              padding: '2px 6px', color: 'var(--text)', fontSize: 12,
            }}
          />
        ) : (
          <span style={{ cursor: 'text' }}>
            {rev.revenue_date ? new Date(rev.revenue_date).toLocaleDateString('he-IL')
              : rev.created_at ? new Date(rev.created_at).toLocaleDateString('he-IL')
                : new Date().toLocaleDateString('he-IL')}
          </span>
        )}
      </td>

      <td style={{ padding: '4px 6px', minWidth: 140 }}>
        <CustomSelect
          value={rev.source || ''}
          onChange={(v) => onUpdate('source', v)}
          options={revenueSourceOptions}
          style={{ fontSize: 12, position: 'relative', zIndex: 999 }}
        />
      </td>

      <td style={{ padding: '6px 10px' }} onClick={() => startEdit('label', rev.label || '')}>
        {editing === 'label' ? (
          <input
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            onBlur={() => saveEdit('label')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit('label')
              if (e.key === 'Escape') setEditing(null)
            }}
            autoFocus
            style={{
              width: '100%', background: 'var(--glass)', border: '1px solid #00C37A', borderRadius: 4,
              padding: '2px 6px', color: 'var(--text)', fontSize: 13,
            }}
          />
        ) : (
          <span style={{
            fontSize: 13, cursor: 'text', display: 'block', minHeight: 20,
            color: rev.label ? 'var(--text)' : 'var(--v2-gray-400)',
          }}
          >
            {rev.label || '—'}
          </span>
        )}
      </td>

      <td style={{ padding: '6px 10px' }} onClick={() => startEdit('amount', rev.amount || 0)}>
        {editing === 'amount' ? (
          <input
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            onBlur={() => saveEdit('amount')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit('amount')
              if (e.key === 'Escape') setEditing(null)
            }}
            type="number"
            autoFocus
            style={{
              width: 90, background: 'var(--glass)', border: '1px solid #00C37A', borderRadius: 4,
              padding: '2px 6px', color: 'var(--text)',
            }}
          />
        ) : (
          <span style={{ fontSize: 13, cursor: 'text', fontWeight: 600 }}>
            {rev.amount ? `₪${parseFloat(rev.amount).toLocaleString()}` : '—'}
          </span>
        )}
      </td>

      <td style={{ padding: '6px 10px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
        ₪
        {rev.amount ? Math.round(calcVat(parseFloat(rev.amount))).toLocaleString() : '—'}
      </td>

      <td style={{ padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#00C37A' }}>
        {rev.amount
          ? `₪${Math.round(parseFloat(rev.amount) - calcVat(parseFloat(rev.amount))).toLocaleString()}`
          : '—'}
      </td>

      <td style={{ padding: '6px 10px' }}>
        <span style={{
          padding: '2px 8px', borderRadius: 8, fontSize: 11,
          background: rev.is_axess ? 'rgba(0,195,122,0.15)' : 'rgba(59,130,246,0.15)',
          color: rev.is_axess ? '#00C37A' : '#3B82F6',
        }}
        >
          {rev.is_axess ? 'אוטומטי' : 'ידני'}
        </span>
      </td>

      <td style={{ padding: '6px 10px' }} onClick={() => startEdit('notes', rev.notes || '')}>
        {editing === 'notes' ? (
          <input
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            onBlur={() => saveEdit('notes')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit('notes')
              if (e.key === 'Escape') setEditing(null)
            }}
            autoFocus
            style={{
              width: '100%', background: 'var(--glass)', border: '1px solid #00C37A', borderRadius: 4,
              padding: '2px 6px', color: 'var(--text)', fontSize: 12,
            }}
          />
        ) : (
          <span style={{ fontSize: 12, cursor: 'text', color: 'var(--v2-gray-400)' }}>{rev.notes || '—'}</span>
        )}
      </td>

      <td style={{ padding: '6px 8px', minWidth: 90 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onAddBelow(rev.source)}
            title="הוסף שורה"
            style={{
              background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)', borderRadius: 6,
              cursor: 'pointer', color: '#00C37A', padding: '4px 6px', display: 'flex',
            }}
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            title="שכפל"
            style={{
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6,
              cursor: 'pointer', color: '#8B5CF6', padding: '4px 6px', display: 'flex',
            }}
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="מחק"
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
              cursor: 'pointer', color: '#EF4444', padding: '4px 6px', display: 'flex',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const { session, businessId } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [ordersTab, setOrdersTab] = useState('approved')
  const [eventPromoters, setEventPromoters] = useState([])
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interests, setInterests] = useState([])
  const [webviewAnalyticsRows, setWebviewAnalyticsRows] = useState([])
  const [webviewBusinessSlug, setWebviewBusinessSlug] = useState('')
  const [channels, setChannels] = useState([])
  const [showImportChannel, setShowImportChannel] = useState(false)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [importChannelLabel, setImportChannelLabel] = useState('')
  const [importHeaders, setImportHeaders] = useState([])
  const [importRows, setImportRows] = useState([])
  const [columnMap, setColumnMap] = useState({})
  const [manualChannelLabel, setManualChannelLabel] = useState('')
  const [manualChannelSold, setManualChannelSold] = useState('')
  const [manualChannelRevenue, setManualChannelRevenue] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [channelOrders, setChannelOrders] = useState([])
  const [financials, setFinancials] = useState({ expenses: [], revenues: [], crowd_stats: [], axess_revenue: null })
  const [vendors, setVendors] = useState([])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [localTemplate, setLocalTemplate] = useState(null)
  const [expensesHistory, setExpensesHistory] = useState([])
  const [expenseFilter, setExpenseFilter] = useState({ category: 'all', status: 'all' })
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: '',
    custom_category: '',
    vendor_type: 'none',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    default_price: '',
    items: [],
  })
  const [newVendorItem, setNewVendorItem] = useState({ name: '', price: '' })
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [customRevenueSources, setCustomRevenueSources] = useState([])
  const [showAddCrowd, setShowAddCrowd] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    category: 'staff', item_name: '', amount: '', quantity: 1, payment_status: 'pending', vendor_id: '', invoice_number: '',
  })
  const [revenueForm, setRevenueForm] = useState({ source: 'cash_entry', label: '', amount: '' })
  const [crowdForm, setCrowdForm] = useState({ entries: '', exits: '', simultaneous: '', is_peak: false })
  const [reportSettings, setReportSettings] = useState({
    food_cost_pct: 30,
    food_cost_base: null,
    vat_mode: 'included',
  })
  const [showReportSettings, setShowReportSettings] = useState(false)
  const [showShareReport, setShowShareReport] = useState(false)
  const [shareLinks, setShareLinks] = useState([])
  const [newShareForm, setNewShareForm] = useState({
    name: '',
    permission: 'view',
    expires_days: 7,
  })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
    'X-Business-Id': businessId,
  }), [session, businessId])

  const saveToHistory = () => {
    setExpensesHistory((h) => [...h.slice(-4), [...financials.expenses]])
  }

  const undoExpense = () => {
    if (expensesHistory.length === 0) return
    const prev = expensesHistory[expensesHistory.length - 1]
    setFinancials((f) => ({ ...f, expenses: prev }))
    setExpensesHistory((h) => h.slice(0, -1))
  }

  const loadData = useCallback(() => {
    if (!id || !businessId) return Promise.resolve()
    const hdrs = authHeaders()
    return Promise.all([
      fetch(`${API_BASE}/api/admin/events/${id}`, { headers: hdrs }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/api/admin/events/${id}/orders`, { headers: hdrs }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/w/analytics-by-business`, { headers: hdrs }).then((r) => (r.ok ? r.json() : { stats: [] })),
      fetch(`${API_BASE}/api/webview/settings`, { headers: hdrs }).then((r) => (r.ok ? r.json() : {})),
      fetch(`${API_BASE}/api/admin/events/${id}/interests`, { headers: hdrs }).then((r) => (r.ok ? r.json() : { interests: [] })),
      fetch(`${API_BASE}/api/admin/events/${id}/channels`, { headers: hdrs }).then((r) => (r.ok ? r.json() : { channels: [] })),
      fetch(`${API_BASE}/api/admin/events/${id}/financials`, { headers: hdrs }).then((r) => (r.ok ? r.json() : {
        expenses: [], revenues: [], crowd_stats: [], axess_revenue: null,
      })),
      fetch(`${API_BASE}/api/admin/vendors`, { headers: hdrs }).then((r) => (r.ok ? r.json() : { vendors: [] })),
    ]).then(([ev, ord, waData, webSettings, intData, chData, finData, vendData]) => {
      setEvent(ev && !ev.error ? ev : null)
      setOrders(Array.isArray(ord) ? ord : ord.orders || [])
      setWebviewAnalyticsRows(waData?.stats || [])
      setWebviewBusinessSlug(webSettings?.business?.slug || '')
      setInterests(intData?.interests || [])
      setChannels(Array.isArray(chData?.channels) ? chData.channels : [])
      setFinancials({
        expenses: Array.isArray(finData?.expenses) ? finData.expenses : [],
        revenues: Array.isArray(finData?.revenues) ? finData.revenues : [],
        crowd_stats: Array.isArray(finData?.crowd_stats) ? finData.crowd_stats : [],
        axess_revenue: finData?.axess_revenue ?? null,
      })
      setVendors(Array.isArray(vendData?.vendors) ? vendData.vendors : [])
    })
  }, [id, businessId, authHeaders])

  const eventWebStats = useMemo(() => {
    const slug = (event?.slug || '').toLowerCase()
    if (!slug || !webviewAnalyticsRows.length) return { sessions: 0, conversions: 0 }
    const rows = webviewAnalyticsRows.filter((r) => {
      const camp = (r.utm_campaign || '').toLowerCase()
      const src = (r.utm_source || '').toLowerCase()
      return camp.includes(slug) || src.includes(slug)
    })
    return {
      sessions: rows.reduce((s, r) => s + (Number(r.sessions) || 0), 0),
      conversions: rows.reduce((s, r) => s + (Number(r.conversions) || 0), 0),
    }
  }, [event?.slug, webviewAnalyticsRows])

  useEffect(() => {
    if (!id || !businessId) return
      let cancelled = false
    setLoading(true)
    loadData()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, businessId, loadData])

  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE}/api/admin/events/${id}/promoters`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setEventPromoters(Array.isArray(d) ? d : (d.promoters || [])))
      .catch(() => {})
  }, [id, authHeaders])

  useEffect(() => {
    const list = selectedChannel === 'all'
      ? orders
      : orders.filter((o) => (o.sales_channel || 'axess') === selectedChannel)
    setChannelOrders(list)
  }, [selectedChannel, orders])

  useEffect(() => {
    if (!showShareReport || !id) return
    fetch(`${API_BASE}/api/admin/events/${id}/shares`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setShareLinks(d.shares?.map((s) => ({
        ...s,
        url: `${window.location.origin}/shared/event/${id}/${s.token}`,
      })) || []))
      .catch(() => {})
  }, [showShareReport, id])

  const approveOrder = async (orderId) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: JSON.stringify({ approved_by: 'dashboard' }),
      })
      if (!r.ok) throw new Error()
      toast.success('אושר')
      await loadData()
    } catch {
      toast.error('שגיאה באישור')
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/orders/${orderId}/reject`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!r.ok) throw new Error()
      toast.success('בוטל')
      await loadData()
    } catch {
      toast.error('שגיאה בביטול')
    }
  }

  const handleApproveOrder = approveOrder
  const handleCancelOrder = cancelOrder

  const handleSendMessage = (order) => {
    const raw = String(order.phone || order.customer_phone || '').replace(/\D/g, '')
    if (!raw) {
      toast.error('אין מספר טלפון')
      return
    }
    const intl = raw.startsWith('972') ? raw : (raw.startsWith('0') ? `972${raw.slice(1)}` : `972${raw}`)
    window.open(`https://wa.me/${intl}`, '_blank', 'noopener,noreferrer')
  }

  const handleResendQR = async (order) => {
    try {
      if (!businessId) return
      const r = await fetch(`${API_BASE}/api/validators?business_id=${encodeURIComponent(businessId)}`, { headers: authHeaders() })
      if (!r.ok) throw new Error()
      const d = await r.json()
      const row = (d.validators || []).find((v) => String(v.id) === String(order.id))
      if (row?.slug) {
        const url = `https://axess.pro/v/${row.slug}`
        await navigator.clipboard.writeText(url)
        toast.success('קישור הכרטיס הועתק')
        return
      }
    } catch { /* ignore */ }
    toast.error('לא נמצא קישור כרטיס')
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>טוען...</div>
  if (!event) return <div style={{ padding: 32 }}>אירוע לא נמצא</div>

  const approved = orders.filter((o) => o.status === 'approved' || o.status === 'confirmed')
  const pending = orders.filter((o) => o.status === 'pending')
  const cancelled = orders.filter((o) => o.status === 'cancelled')
  const checkedIn = orders.filter((o) => o.checked_in)

  const filteredOrders = ordersTab === 'approved' ? approved
    : ordersTab === 'pending' ? pending
      : ordersTab === 'cancelled' ? cancelled
        : ordersTab === 'checkin' ? checkedIn : orders

  const totalRevenue = approved.reduce((sum, o) => sum + (o.total_price || o.amount || 0), 0)

  const calcVatForExport = (amount) => {
    if (reportSettings.vat_mode === 'exempt') return 0
    if (reportSettings.vat_mode === 'included') return amount / 1.18 * 0.18
    if (reportSettings.vat_mode === 'excluded') return amount * 0.18
    return 0
  }

  const handleExportFullReport = () => {
    exportEventReport(event, orders, financials, reportSettings, calcExpenseVat, calcVatForExport)
  }

  const handleExportAudience = (ordersData) => {
    exportToExcel([{
      name: 'קהל האירוע',
      title: `קהל — ${event?.title}`,
      headers: ['שם', 'שם משפחה', 'טלפון', 'מייל', 'סוג כרטיס', 'סכום', 'סטטוס', 'יחצ"ן', 'אינסטגרם', 'ת"ז', 'ערוץ', 'תאריך'],
      rows: ordersData.map((o) => [
        o.first_name, o.last_name, o.phone, o.email || '',
        o.ticket_type || 'רגיל', o.total_price || 0,
        o.status === 'approved' ? 'מאושר' : o.status === 'pending' ? 'ממתין' : 'בוטל',
        o.promoter_name || '', o.instagram || '', o.id_number || '',
        o.sales_channel || 'axess',
        o.created_at ? new Date(o.created_at).toLocaleDateString('he-IL') : '',
      ]),
    }], `קהל-${event?.title}`)
  }

  const handleExportExpenses = () => {
    exportToExcel([{
      name: 'הוצאות',
      title: `הוצאות — ${event?.title}`,
      headers: ['תאריך', 'קטגוריה', 'פריט/ספק', 'כמות', 'מחיר', 'מע"מ', 'סה"כ', 'מע"מ ₪', 'חשבונית', 'מ\' חשבונית', 'סטטוס', 'הערות'],
      rows: financials.expenses.map((exp) => {
        const { total, vat } = calcExpenseVat(exp)
        return [
          exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('he-IL') : '',
          EXPENSE_CATEGORIES.find((c) => c.value === exp.category)?.label || exp.category,
          exp.vendor_name || exp.item_name || '',
          exp.quantity || 1, exp.amount || 0,
          exp.vat_mode === 'included' ? 'כולל' : exp.vat_mode === 'excluded' ? 'לא כולל' : 'פטור',
          total, vat,
          INVOICE_TYPES.find((t) => t.value === exp.invoice_type)?.label || '',
          exp.invoice_number || '',
          PAYMENT_STATUS[exp.payment_status]?.label || '',
          exp.notes || '',
        ]
      }),
    }], `הוצאות-${event?.title}`)
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 12 : 0,
        padding: isMobile ? '20px 16px' : '20px 24px',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: 20,
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard/events')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--v2-gray-400)', display: 'flex', alignItems: 'center',
            }}
          >
            <ChevronLeft size={20} color="#00C37A" />
          </button>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              {event?.event_number && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: 'monospace',
                    marginRight: 8,
                  }}
                >
                  #{event.event_number}
                </span>
              )}
              <span>{event.title}</span>
            </h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--v2-gray-400)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} color="#00C37A" />
                {formatEventDate(event.date)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} color="#00C37A" />
                {event.location || event.venue_name || '—'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 8,
          width: isMobile ? '100%' : 'auto',
          flexWrap: 'wrap',
        }}
        >
          <a
            href={`https://axess.pro/e/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ExternalLink size={14} color="#00C37A" />
            צפה
          </a>
          <button
            type="button"
            onClick={() => handleExportAudience(orders)}
            style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              color: 'var(--text)', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Download size={14} color="#00C37A" />
            הורד דוח
          </button>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/events?edit=${id}`)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: '#00C37A', color: '#000',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Edit size={14} />
            ערוך
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
        gap: 12,
        padding: isMobile ? '0 16px' : '0 24px',
        marginBottom: 24,
      }}
      >
        {[
          { icon: <CheckCircle size={20} />, value: approved.length, label: 'מאושרים', color: '#00C37A', onNav: () => { setActiveTab('audience'); setOrdersTab('approved') } },
          { icon: <Clock size={20} />, value: pending.length, label: 'ממתינים', color: '#F59E0B', onNav: () => { setActiveTab('audience'); setOrdersTab('pending') } },
          { icon: <XCircle size={20} />, value: cancelled.length, label: 'מבוטלים', color: '#EF4444', onNav: () => { setActiveTab('audience'); setOrdersTab('cancelled') } },
          { icon: <DollarSign size={20} />, value: `₪${totalRevenue.toLocaleString()}`, label: 'הכנסה', color: '#3B82F6', onNav: () => { setActiveTab('financials') } },
          { icon: <Users size={20} />, value: orders.length, label: 'סה"כ רשומים', color: '#8B5CF6', onNav: () => { setActiveTab('audience'); setOrdersTab('all') } },
          { icon: <QrCode size={20} />, value: checkedIn.length, label: 'צ\'ק אין', color: '#00C37A', onNav: () => { setActiveTab('audience'); setOrdersTab('checkin') } },
          { icon: <Eye size={20} />, value: event.views_count || 0, label: 'צפיות', color: '#06B6D4' },
          { icon: <Ticket size={20} />, value: event.max_capacity || 0, label: 'קיבולת', color: '#F97316' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            role={kpi.onNav ? 'button' : undefined}
            tabIndex={kpi.onNav ? 0 : undefined}
            onClick={kpi.onNav}
            onKeyDown={kpi.onNav ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kpi.onNav() } } : undefined}
            style={{
              background: 'var(--card)', borderRadius: 12, padding: '16px',
              border: '1px solid var(--glass-border)', textAlign: 'center',
              cursor: kpi.onNav ? 'pointer' : 'default',
            }}
          >
            <div style={{ color: kpi.color, marginBottom: 6 }}>{kpi.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        padding: isMobile ? '0 16px' : '0 24px',
        marginBottom: 20,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        flexWrap: 'nowrap',
      }}
      >
        {[
          { id: 'overview', label: 'סקירה' },
          { id: 'audience', label: 'קהל' },
          { id: 'financials', label: 'כספים מלא' },
          { id: 'tables', label: 'שולחנות' },
          { id: 'templates', label: '⭐ תבניות' },
          { id: 'campaigns', label: 'קמפיינים' },
          { id: 'channels', label: 'ערוצי מכירה' },
          { id: 'webview', label: 'Webview' },
          { id: 'checkin', label: 'צ\'ק אין' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px', borderRadius: 10,
              border: activeTab === tab.id ? 'none' : '1px solid var(--glass-border)',
              background: activeTab === tab.id ? 'rgba(0,195,122,0.12)' : 'transparent',
              color: activeTab === tab.id ? '#00C37A' : 'var(--text)',
              fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', fontSize: 14,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: isMobile ? '0 16px' : '0 24px' }}>

        {activeTab === 'overview' && (
          <div>
            <div style={{ background: 'var(--card)', borderRadius: 12, padding: 20, border: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>פילוח רשומים</h3>
              {[
                { label: 'מאושרים', count: approved.length, color: '#00C37A' },
                { label: 'ממתינים', count: pending.length, color: '#F59E0B' },
                { label: 'מבוטלים', count: cancelled.length, color: '#EF4444' },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 700 }}>{item.count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--glass)' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: item.color,
                      width: orders.length > 0 ? `${(item.count / orders.length) * 100}%` : '0%',
                      transition: 'width 0.5s ease',
                    }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>פילוח מגדר</h4>
                {['זכר', 'נקבה', 'לא ידוע'].map((gender) => {
                  const count = orders.filter((o) => o.gender === gender || (!o.gender && gender === 'לא ידוע')).length
                  return (
                    <div key={gender} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                        <span>{gender}</span>
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--glass)' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: '#00C37A',
                          width: orders.length > 0 ? `${(count / orders.length) * 100}%` : '0%',
                        }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>פילוח גיל</h4>
                {[
                  { label: '18-24', min: 18, max: 24 },
                  { label: '25-34', min: 25, max: 34 },
                  { label: '35-44', min: 35, max: 44 },
                  { label: '45+', min: 45, max: 120 },
                ].map((group) => {
                  const count = orders.filter((o) => {
                    if (!o.birth_date) return false
                    const age = new Date().getFullYear() - new Date(o.birth_date).getFullYear()
                    return age >= group.min && age <= group.max
                  }).length
                  return (
                    <div key={group.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                        <span>{group.label}</span>
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--glass)' }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: '#3B82F6',
                          width: orders.length > 0 ? `${(count / orders.length) * 100}%` : '0%',
                        }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audience' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'approved', label: `מאושרים (${approved.length})` },
                { id: 'pending', label: `ממתינים (${pending.length})` },
                { id: 'cancelled', label: `מבוטלים (${cancelled.length})` },
                { id: 'checkin', label: `נסרקו (${checkedIn.length})` },
                { id: 'interested', label: `מתעניינים (${interests.length})` },
                { id: 'promoters', label: `יחצ"נים (${eventPromoters.length})` },
                { id: 'all', label: `כולם (${orders.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOrdersTab(t.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: ordersTab === t.id ? 'rgba(0,195,122,0.12)' : 'transparent',
                    color: ordersTab === t.id ? '#00C37A' : 'var(--text)',
                    fontWeight: ordersTab === t.id ? 700 : 400,
                    border: ordersTab === t.id ? 'none' : '1px solid var(--glass-border)',
                    cursor: 'pointer', fontSize: 13,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                </button>
              ))}
              {ordersTab !== 'interested' && ordersTab !== 'promoters' && (
                <button
                  type="button"
                  onClick={() => handleExportAudience(filteredOrders)}
                  style={{
                    marginRight: 'auto', padding: '6px 14px', borderRadius: 8,
                    border: '1px solid var(--glass-border)', background: 'var(--glass)',
                    color: '#00C37A', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Download size={13} />
                  Excel
                </button>
              )}
            </div>

            {ordersTab === 'interested' && (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['פעולות', 'מקור', 'שם פרטי', 'שם משפחה', 'טלפון', 'מייל', 'שלב נטישה', 'UTM', 'תאריך'].map((h) => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--v2-gray-400)', background: 'var(--card)', borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {interests.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                          אין מתעניינים עדיין
                        </td>
                      </tr>
                    ) : interests.map((interest) => (
                      <tr key={interest.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {interest.phone && (
                              <button
                                type="button"
                                title="שלח WA"
                                onClick={() => {
                                  window.open(`https://wa.me/${interest.phone}`, '_blank')
                                }}
                                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(34,197,94,0.1)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <MessageCircle size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              title="הוסף לקמפיין"
                              onClick={() => {
                                toast('בקרוב — ייבוא לקמפיין', { icon: '📣' })
                              }}
                              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              type="button"
                              title="צפה בפרופיל"
                              onClick={() => {
                                window.location.href = `/dashboard/audiences?search=${interest.phone || interest.email || ''}`
                              }}
                              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: '#00C37A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
                            background: interest.source === 'page_view' ? 'rgba(59,130,246,0.15)'
                              : interest.source === 'modal_open' ? 'rgba(245,158,11,0.15)'
                                : interest.source?.includes('abandon') ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)',
                            color: interest.source === 'page_view' ? '#3B82F6'
                              : interest.source === 'modal_open' ? '#F59E0B'
                                : interest.source?.includes('abandon') ? '#EF4444' : 'var(--v2-gray-400)',
                          }}
                          >
                            {interest.source === 'page_view' ? '👁 ביקר בדף'
                              : interest.source === 'modal_open' ? '🎫 פתח מודל'
                                : interest.source?.includes('abandon') ? `🚪 נטש שלב ${interest.source.split('_').pop()}`
                                  : interest.source === 'pixel' ? '📡 Pixel'
                                    : interest.source || 'לא ידוע'}
                          </span>
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {interest.first_name || '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {interest.last_name || '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 13, whiteSpace: 'nowrap', direction: 'ltr' }}>
                          {interest.phone || '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                          {interest.email || '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {interest.source?.includes('abandon') ? (
                            <span style={{ color: '#EF4444' }}>
                              שלב
                              {' '}
                              {interest.source.split('_').pop()}
                              {' '}
                              מתוך 7
                            </span>
                          ) : '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                          {interest.metadata?.utm_source
                            ? `${interest.metadata.utm_source}/${interest.metadata.utm_medium || ''}`
                            : interest.metadata?.ref ? `יחצ"ן: ${interest.metadata.ref}` : '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                          {interest.created_at ? new Date(interest.created_at).toLocaleString('he-IL') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {ordersTab === 'promoters' && (
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['פעולות', 'שם', 'תפקיד', 'כרטיסים', 'שולחנות', 'עמלה', 'תאריך עסקה', 'לינק'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--v2-gray-400)', background: 'var(--card)', borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eventPromoters.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                          אין יחצ"נים משוייכים לאירוע זה
                        </td>
                      </tr>
                    ) : eventPromoters.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              title="שלח הודעה"
                              onClick={() => {
                                const msg = `שלום ${p.promoter_name || p.name}!`;
                                window.open(`https://wa.me/${p.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(34,197,94,0.1)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <MessageCircle size={13} />
                            </button>
                            <button
                              type="button"
                              title="הסר מאירוע"
                              onClick={() => {
                                if (!window.confirm(`להסיר את ${p.promoter_name || p.name} מהאירוע?`)) return;
                                fetch(`${API_BASE}/api/admin/events/${id}/promoters/${p.id}`, {
                                  method: 'DELETE', headers: authHeaders()
                                }).then(() => setEventPromoters(prev => prev.filter(ep => ep.id !== p.id)));
                              }}
                              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <XCircle size={13} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>{p.promoter_name || p.name}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>{p.promoter_role || p.role || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'center' }}>{p.tickets_sold || 0}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'center' }}>{p.tables_sold || 0}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>
                          {p.total_commission ? `₪${p.total_commission}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('he-IL') : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const url = `https://axess.pro/e/${event?.slug}?ref=${p.promo_code || p.seller_code}`
                              navigator.clipboard.writeText(url)
                              toast.success('לינק הועתק!')
                            }}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: '#00C37A', fontSize: 11, cursor: 'pointer' }}
                          >
                            📋 לינק
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {ordersTab !== 'interested' && ordersTab !== 'promoters' && (
            <div style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              width: '100%',
              maxWidth: '100vw',
            }}
            >
              <table style={{ width: '100%', minWidth: 1400, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {AUDIENCE_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        style={{
                          padding: '10px 12px', textAlign: 'right', fontSize: 12,
                          fontWeight: 600, color: 'var(--v2-gray-400)',
                          background: 'var(--card)', whiteSpace: 'nowrap',
                          borderBottom: '1px solid var(--glass-border)',
                          position: col.sticky ? 'sticky' : 'static',
                          right: col.sticky ? 0 : 'auto',
                          zIndex: col.sticky ? 2 : 'auto',
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

                      <td style={{
                        padding: '8px 12px', position: 'sticky', right: 0, background: 'var(--card)', zIndex: 1, whiteSpace: 'nowrap',
                      }}
                      >
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {order.approval_status === 'pending_approval' && (
                            <button
                              type="button"
                              title="אשר כרטיס"
                              onClick={() => handleApproveOrder(order.id)}
                              style={{
                                width: 30, height: 30, borderRadius: 6, border: 'none', background: 'rgba(0,195,122,0.15)', color: '#00C37A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}
                          {order.status !== 'cancelled' && (
                            <button
                              type="button"
                              title="בטל כרטיס"
                              onClick={() => setCancelConfirm({
                                orderId: order.id,
                                name: `${order.first_name || ''} ${order.last_name || ''}`.trim() || order.phone,
                              })}
                              style={{
                                width: 30, height: 30, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <XCircle size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            title="שלח הודעה"
                            onClick={() => handleSendMessage(order)}
                            style={{
                              width: 30, height: 30, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            type="button"
                            title="שלח QR מחדש"
                            onClick={() => handleResendQR(order)}
                            style={{
                              width: 30, height: 30, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <QrCode size={15} />
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
                          background: order.approval_status === 'approved' ? 'rgba(0,195,122,0.15)'
                            : order.approval_status === 'pending_approval' ? 'rgba(245,158,11,0.15)'
                              : order.status === 'cancelled' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)',
                          color: order.approval_status === 'approved' ? '#00C37A'
                            : order.approval_status === 'pending_approval' ? '#F59E0B'
                              : order.status === 'cancelled' ? '#EF4444' : 'var(--v2-gray-400)',
                        }}
                        >
                          {order.approval_status === 'approved' && order.checked_in ? 'נסרק'
                            : order.approval_status === 'approved' ? 'מאושר'
                              : order.approval_status === 'pending_approval' ? 'ממתין'
                                : order.status === 'cancelled' ? 'מבוטל' : order.status}
                        </span>
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {order.ticket_name || order.ticket_type_name || '—'}
                      </td>

                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 10,
                          background: order.ticket_category === 'table' ? 'rgba(139,92,246,0.15)' : 'rgba(0,195,122,0.1)',
                          color: order.ticket_category === 'table' ? '#8B5CF6' : '#00C37A',
                        }}
                        >
                          {order.ticket_category === 'table' ? '🪑 שולחן'
                            : order.ticket_category === 'vip' ? '⭐ VIP'
                              : (Number(order.total_amount ?? order.total_price ?? order.amount ?? 0) === 0 ? '🎟 הרשמה חינם' : '🎫 כניסה')}
                        </span>
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {order.first_name || order.customer_name || '—'}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {order.last_name || '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 13, whiteSpace: 'nowrap', direction: 'ltr' }}>
                        {order.phone || order.customer_phone || '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                        {order.email || order.customer_email || '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {order.instagram ? `@${String(order.instagram).replace('@', '')}` : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {order.identification_number || '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {order.promoter_name ? (
                          <span style={{ color: '#F59E0B' }}>
                            {order.promoter_name}
                            {order.promoter_role && (
                              <span style={{ fontSize: 10, marginRight: 4, color: 'var(--v2-gray-400)' }}>
                                (
                                {order.promoter_role}
                                )
                              </span>
                            )}
                          </span>
                        ) : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 12, color: '#F59E0B', whiteSpace: 'nowrap' }}>
                        {order.promoter_commission ? `₪${order.promoter_commission}` : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        #
                        {order.id?.slice(0, 8)}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {order.payment_intent_id || order.stripe_payment_id || '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#00C37A', whiteSpace: 'nowrap' }}>
                        {Number(order.total_amount ?? order.total_price ?? order.amount ?? 0) > 0
                          ? `₪${order.total_amount ?? order.total_price ?? order.amount}`
                          : 'חינם'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {order.payment_mode === 'split_equal' ? 'פיצול שווה'
                          : order.payment_mode === 'split_custom' ? 'פיצול מותאם' : 'מלא'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleString('he-IL') : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                        {event?.date ? new Date(event.date).toLocaleDateString('he-IL') : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        {order.checked_in
                          ? <span style={{ color: '#00C37A', fontSize: 12 }}>✅</span>
                          : <span style={{ color: 'var(--v2-gray-400)', fontSize: 12 }}>—</span>}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                        {order.checked_in_at ? new Date(order.checked_in_at).toLocaleString('he-IL') : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap' }}>
                        {order.approved_at ? new Date(order.approved_at).toLocaleString('he-IL') : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 11, color: '#EF4444', whiteSpace: 'nowrap' }}>
                        {order.cancelled_at ? new Date(order.cancelled_at).toLocaleString('he-IL') : '—'}
                      </td>

                      <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        #
                        {event?.event_number || '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length > 0 && (
                    <tr style={{ borderTop: '2px solid rgba(0,195,122,0.3)', background: 'rgba(0,195,122,0.05)' }}>
                      <td colSpan={4} style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#00C37A' }}>
                        סה&quot;כ (
                        {filteredOrders.length}
                        {' '}
                        רשומות)
                      </td>
                      <td colSpan={10} />
                      <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 800, color: '#00C37A', whiteSpace: 'nowrap' }}>
                        ₪
                        {filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#F59E0B', whiteSpace: 'nowrap' }}>
                        ₪
                        {filteredOrders.reduce((sum, o) => sum + (parseFloat(o.promoter_commission) || 0), 0).toLocaleString()}
                      </td>
                      <td colSpan={AUDIENCE_COLUMNS.length - 4 - 10 - 1 - 1} />
                    </tr>
                  )}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={AUDIENCE_COLUMNS.length} style={{ padding: 24, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 14 }}>
                        אין רשומים בקטגוריה זו
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {activeTab === 'financials' && (() => {
          const calcVat = (amount) => {
            if (reportSettings.vat_mode === 'exempt') return 0
            if (reportSettings.vat_mode === 'included') return amount / 1.18 * 0.18
            if (reportSettings.vat_mode === 'excluded') return amount * 0.18
            return 0
          }
          const totalManualRevenue = financials.revenues.reduce((s, r) => s + parseFloat(r.amount || 0), 0)
          const axessRevenueFull = parseFloat(financials.axess_revenue?.total_digital || 0)
          const axessRevenue = axessRevenueFull
          const totalRevenueFull = totalManualRevenue + axessRevenueFull
          const vatAmountFull = calcVat(totalRevenueFull)
          const revenueNetVatFull = totalRevenueFull - vatAmountFull
          const barRevenue = financials.revenues.find((r) => r.source === 'bar')?.amount || 0
          const tablesRevenue = financials.revenues.find((r) => r.source === 'tables')?.amount || 0
          const foodCostAmount = Math.round(
            (reportSettings.food_cost_base ?? (parseFloat(barRevenue) + parseFloat(tablesRevenue)))
            * ((reportSettings.food_cost_pct || 20) / 100),
          )

          const expenseSummary = financials.expenses.reduce((acc, exp) => {
            const { total, vat, beforeVat } = calcExpenseVat(exp)
            return {
              totalWithVat: acc.totalWithVat + total,
              totalVat: acc.totalVat + vat,
              totalBeforeVat: acc.totalBeforeVat + beforeVat,
            }
          }, { totalWithVat: 0, totalVat: 0, totalBeforeVat: 0 })

          const totalExpensesWithVat = Math.round(expenseSummary.totalWithVat + foodCostAmount)
          const totalExpensesVat = Math.round(expenseSummary.totalVat)
          const totalExpensesBeforeVat = Math.round(expenseSummary.totalBeforeVat + foodCostAmount)

          const netProfit = Math.round(revenueNetVatFull - totalExpensesBeforeVat)
          const ordersNonCancelled = orders.filter((o) => o.status !== 'cancelled')
          const avgTicketPriceFull = ordersNonCancelled.length > 0 ? axessRevenueFull / ordersNonCancelled.length : 0
          const breakEvenFull = avgTicketPriceFull > 0 ? Math.ceil(totalExpensesWithVat / avgTicketPriceFull) : 0
          const peakCrowd = financials.crowd_stats.reduce((max, s) => Math.max(max, s.simultaneous || 0), 0)
          const revenueSourceOptions = [
            ...REVENUE_SOURCES,
            ...customRevenueSources.filter((s) => !REVENUE_SOURCES.find((r) => r.value === s.value)),
            { value: '__custom__', label: '+ הוסף מקור חדש' },
          ]
          const dbExpenses = financials.expenses
          const templateRows = EXPENSE_CATEGORIES
            .filter((cat) => !dbExpenses.some((e) => e.category === cat.value))
            .map((cat) => ({
              id: `template_${cat.value}`,
              category: cat.value,
              item_name: '',
              amount: 0,
              quantity: 1,
              payment_status: 'pending',
              invoice_type: 'none',
              vat_mode: 'included',
              isTemplate: true,
            }))

          const rowsToShow = [
            ...dbExpenses,
            ...(localTemplate !== null ? localTemplate.filter((t) => !dbExpenses.some((e) => e.category === t.category)) : templateRows),
          ]

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>דוח כספי</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowReportSettings(true)}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)', color: 'var(--text)',
                      fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Settings size={14} color="#00C37A" />
                    הגדרות דוח
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareReport(true)}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)', color: 'var(--text)',
                      fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Share2 size={14} color="#00C37A" />
                    שתף דוח
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'סה"כ מחזור', value: `₪${totalRevenueFull.toLocaleString()}`, color: '#00C37A', sub: `נטו מע"מ: ₪${Math.round(revenueNetVatFull).toLocaleString()}` },
                  { label: 'סה"כ הוצאות', value: `₪${totalExpensesWithVat.toLocaleString()}`, color: '#EF4444', sub: `${financials.expenses.length} פריטים` },
                  { label: 'רווח נקי', value: `₪${netProfit.toLocaleString()}`, color: netProfit >= 0 ? '#00C37A' : '#EF4444', sub: netProfit >= 0 ? '✅ רווחי' : '❌ הפסד' },
                  { label: 'Break Even', value: `${breakEvenFull} כרטיסים`, color: '#8B5CF6', sub: `נמכרו ${ordersNonCancelled.length}` },
                ].map((kpi) => (
                  <div key={kpi.label} style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', margin: '4px 0 2px' }}>{kpi.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* ספקים */}
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>ספקים</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {vendors.length}
                      {' '}
                      ספקים שמורים
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddVendor(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#00C37A',
                        color: '#000',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + הוסף ספק
                    </button>
                  </div>
                </div>
                {vendors.length === 0 ? (
                  <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, margin: 0 }}>
                    אין ספקים שמורים עדיין
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {vendors.map((v) => (
                      <span
                        key={v.id}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12,
                          background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        }}
                      >
                        {v.name}
                        {' '}
                        · ₪
                        {(v.default_price || 0).toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* בלוק הכנסות */}
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>הכנסות</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {event?.title}
                      {' '}
                      ·
                      {event?.date ? formatEventDate(event.date) : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddRevenue(true)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: '#00C37A', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    + הוסף הכנסה
                  </button>
                </div>

                <div style={{
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  marginLeft: isMobile ? -16 : 0,
                  marginRight: isMobile ? -16 : 0,
                  paddingLeft: isMobile ? 16 : 0,
                  paddingRight: isMobile ? 16 : 0,
                }}
                >
                <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'auto', marginBottom: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
                    <thead>
                      <tr style={{ background: 'var(--glass)', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                        {['תאריך', 'מקור', 'תיאור', 'סכום', 'מע"מ', 'נטו', 'ערוץ', 'הערות', 'פעולות'].map((h) => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderTop: '1px solid var(--glass-border)', background: 'rgba(0,195,122,0.04)' }}>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                          {event?.date ? formatEventDate(event.date) : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#00C37A' }}>
                          AXESS
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 13 }}>מכירות דיגיטל</td>
                        <td style={{ padding: '8px 12px', fontSize: 13 }}>
                          ₪
                          {axessRevenue.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                          {reportSettings.vat_mode === 'exempt' ? 'פטור' : `₪${Math.round(calcVat(axessRevenue)).toLocaleString()}`}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>
                          ₪
                          {Math.round(axessRevenue - calcVat(axessRevenue)).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, background: 'rgba(0,195,122,0.15)', color: '#00C37A' }}>
                            אוטומטי
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>—</td>
                        <td style={{ padding: '8px 12px' }} />
                      </tr>

                      {financials.revenues.map((rev) => (
                        <EditableRevenueRow
                          key={rev.id}
                          rev={rev}
                          revenueSourceOptions={revenueSourceOptions}
                          calcVat={calcVat}
                          onUpdate={async (field, value) => {
                            let v = value
                            if (field === 'source' && v === '__custom__') {
                              const name = prompt('שם המקור החדש:')
                              if (!name) return
                              const newSource = { value: name.toLowerCase().replace(/\s+/g, '_'), label: name }
                              setCustomRevenueSources((prev) => [...prev, newSource])
                              v = newSource.value
                            }
                            let payloadVal = v
                            if (field === 'amount') payloadVal = parseFloat(v) || 0
                            await fetch(`${API_BASE}/api/admin/events/${id}/revenues/${rev.id}`, {
                              method: 'PATCH',
                              headers: authHeaders(),
                              body: JSON.stringify({ [field]: payloadVal }),
                            })
                            loadData()
                          }}
                          onDelete={async () => {
                            await fetch(`${API_BASE}/api/admin/events/${id}/revenues/${rev.id}`, {
                              method: 'DELETE',
                              headers: authHeaders(),
                            })
                            loadData()
                          }}
                          onDuplicate={async () => {
                            await fetch(`${API_BASE}/api/admin/events/${id}/revenues`, {
                              method: 'POST',
                              headers: authHeaders(),
                              body: JSON.stringify({
                                source: rev.source,
                                label: rev.label,
                                amount: rev.amount,
                                notes: rev.notes,
                              }),
                            })
                            loadData()
                          }}
                          onAddBelow={(source) => {
                            setRevenueForm((f) => ({ ...f, source: source || f.source }))
                            setShowAddRevenue(true)
                          }}
                        />
                      ))}

                      <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'var(--glass)' }}>
                        <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 800, fontSize: 14 }}>סה"כ הכנסות</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, fontSize: 14, color: '#00C37A' }}>
                          ₪
                          {totalRevenueFull.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                          מע"מ: ₪
                          {Math.round(calcVat(totalRevenueFull)).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#00C37A' }}>
                          ₪
                          {Math.round(totalRevenueFull - calcVat(totalRevenueFull)).toLocaleString()}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tbody>
                  </table>
                </div>
                </div>
              </div>

              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>הוצאות</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {event?.title}
                      {' '}
                      ·
                      {event?.date ? formatEventDate(event.date) : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(true)}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    + הוסף הוצאה
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <CustomSelect
                    value={expenseFilter.category}
                    onChange={(v) => setExpenseFilter((f) => ({ ...f, category: v }))}
                    options={[{ value: 'all', label: 'כל הקטגוריות' }, ...EXPENSE_CATEGORIES]}
                    style={{ width: 160 }}
                  />
                  <CustomSelect
                    value={expenseFilter.status}
                    onChange={(v) => setExpenseFilter((f) => ({ ...f, status: v }))}
                    options={[
                      { value: 'all', label: 'כל הסטטוסים' },
                      ...Object.entries(PAYMENT_STATUS).map(([v, { label }]) => ({ value: v, label })),
                    ]}
                    style={{ width: 140 }}
                  />
                  <button
                    type="button"
                    onClick={undoExpense}
                    disabled={expensesHistory.length === 0}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: expensesHistory.length > 0 ? '#F59E0B' : 'var(--v2-gray-400)',
                      cursor: expensesHistory.length > 0 ? 'pointer' : 'not-allowed',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RotateCcw size={14} />
                    ביטול
                    {expensesHistory.length > 0 ? ` (${expensesHistory.length})` : ''}
                  </button>
                </div>

                <div style={{
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  marginLeft: isMobile ? -16 : 0,
                  marginRight: isMobile ? -16 : 0,
                  paddingLeft: isMobile ? 16 : 0,
                  paddingRight: isMobile ? 16 : 0,
                }}
                >
                <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1020 }}>
                    <thead>
                      <tr style={{ background: 'var(--glass)', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                        {['תאריך', 'קטגוריה', 'פריט / ספק', 'כמות', 'מחיר', 'מע"מ', 'סה"כ', 'חשבונית', 'מ׳ חשבונית', 'סטטוס', 'הערות', 'פעולות'].map((h) => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rowsToShow
                        .filter((e) => expenseFilter.category === 'all' || e.category === expenseFilter.category)
                        .filter((e) => expenseFilter.status === 'all' || e.payment_status === expenseFilter.status)
                        .map((exp) => (
                          <EditableExpenseRow
                            key={exp.id}
                            exp={exp}
                            onUpdate={async (field, value) => {
                              saveToHistory()
                              let payloadVal = value
                              if (field === 'quantity') payloadVal = parseInt(value, 10) || 1
                              if (field === 'amount') payloadVal = parseFloat(value) || 0
                              if (exp.isTemplate) {
                                const body = {
                                  category: exp.category,
                                  item_name: exp.item_name || '',
                                  amount: 0,
                                  quantity: 1,
                                  payment_status: 'pending',
                                  vat_mode: 'included',
                                  invoice_type: 'none',
                                  [field]: payloadVal,
                                }
                                await fetch(`${API_BASE}/api/admin/events/${id}/expenses`, {
                                  method: 'POST',
                                  headers: authHeaders(),
                                  body: JSON.stringify(body),
                                })
                              } else {
                                await fetch(`${API_BASE}/api/admin/events/${id}/expenses/${exp.id}`, {
                                  method: 'PATCH',
                                  headers: authHeaders(),
                                  body: JSON.stringify({ [field]: payloadVal }),
                                })
                              }
                              loadData()
                            }}
                            onDelete={async () => {
                              if (exp.isTemplate) {
                                setLocalTemplate((prev) => {
                                  const base = prev ?? EXPENSE_CATEGORIES.map((cat) => ({
                                    id: `template_${cat.value}`,
                                    category: cat.value,
                                    item_name: '',
                                    amount: 0,
                                    quantity: 1,
                                    payment_status: 'pending',
                                    invoice_type: 'none',
                                    vat_mode: 'included',
                                    isTemplate: true,
                                  }))
                                  return base.filter((t) => t.category !== exp.category)
                                })
                                return
                              }
                              saveToHistory()
                              await fetch(`${API_BASE}/api/admin/events/${id}/expenses/${exp.id}`, {
                                method: 'DELETE',
                                headers: authHeaders(),
                              })
                              loadData()
                            }}
                            onAddBelow={(category) => {
                              setExpenseForm((f) => ({ ...f, category: category || f.category }))
                              setShowAddExpense(true)
                            }}
                            onDuplicate={async () => {
                              saveToHistory()
                              await fetch(`${API_BASE}/api/admin/events/${id}/expenses`, {
                                method: 'POST',
                                headers: authHeaders(),
                                body: JSON.stringify({
                                  category: exp.category,
                                  item_name: exp.item_name || '',
                                  amount: exp.amount || 0,
                                  quantity: exp.quantity || 1,
                                  payment_status: 'pending',
                                  vat_mode: exp.vat_mode || 'included',
                                  invoice_type: exp.invoice_type || 'none',
                                }),
                              })
                              loadData()
                            }}
                            onApplyDateToAll={async (date) => {
                              saveToHistory()
                              for (const expense of financials.expenses) {
                                await fetch(`${API_BASE}/api/admin/events/${id}/expenses/${expense.id}`, {
                                  method: 'PATCH',
                                  headers: authHeaders(),
                                  body: JSON.stringify({ expense_date: date }),
                                })
                              }
                              loadData()
                              toast.success('תאריך הוחל על כל השורות!')
                            }}
                          />
                        ))}
                      <FoodCostRow
                        barRevenue={parseFloat(barRevenue) || 0}
                        tablesRevenue={parseFloat(tablesRevenue) || 0}
                        foodCostPct={reportSettings.food_cost_pct || 20}
                        foodCostBase={reportSettings.food_cost_base}
                        onUpdate={(pct, base) => setReportSettings((s) => ({ ...s, food_cost_pct: pct, food_cost_base: base }))}
                      />
                      <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'var(--glass)' }}>
                        <td colSpan={4} style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                            <div>
                              <span style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block' }}>לפני מע"מ</span>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#EF4444' }}>
                                ₪{totalExpensesBeforeVat.toLocaleString()}
                              </span>
                            </div>

                            <div>
                              <span style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block' }}>סה"כ כולל מע"מ</span>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                                ₪{totalExpensesWithVat.toLocaleString()}
                              </span>
                            </div>

                            <div>
                              <span style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block' }}>מע"מ</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                                ₪{totalExpensesVat.toLocaleString()}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td colSpan={8} style={{ padding: '10px 12px', textAlign: 'left' }}>
                          <button
                            type="button"
                            onClick={() => handleExportExpenses()}
                            style={{
                              padding: '6px 14px', borderRadius: 8, border: 'none',
                              background: '#00C37A', color: '#000',
                              fontWeight: 700, fontSize: 13, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <Download size={14} />
                            ייצוא Excel
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                </div>
              </div>

              {/* דוח רווח והפסד */}
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 20, border: '1px solid var(--glass-border)', marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                    דוח רווח והפסד —
                    {event?.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleExportFullReport()}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: '#00C37A', color: '#000', fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Download size={14} />
                    ייצוא דוח מלא
                  </button>
                </div>

                {[
                  { label: 'סה"כ הכנסות', value: Math.round(totalRevenueFull - calcVat(totalRevenueFull)), color: '#00C37A', bold: false },
                  { label: 'פחות: סה"כ הוצאות', value: -totalExpensesBeforeVat, color: '#EF4444', bold: false },
                  { label: netProfit >= 0 ? '= רווח' : '= הפסד', value: netProfit, color: netProfit >= 0 ? '#00C37A' : '#EF4444', bold: true, border: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '10px 0',
                      borderTop: row.border ? '2px solid var(--glass-border)' : '1px solid var(--glass-border)',
                      marginTop: row.border ? 4 : 0,
                    }}
                  >
                    <span style={{ fontSize: row.bold ? 16 : 14, fontWeight: row.bold ? 800 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: row.bold ? 18 : 14, fontWeight: 800, color: row.color }}>
                      ₪
                      {Math.abs(row.value).toLocaleString()}
                    </span>
                  </div>
                ))}

                <div style={{ marginTop: 16, padding: 12, background: 'var(--glass)', borderRadius: 8 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--v2-gray-400)' }}>פירוט מע"מ</p>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      { label: 'רווח לפני מע"מ', value: totalExpensesBeforeVat > 0 ? Math.round(totalRevenueFull - totalExpensesBeforeVat) : netProfit },
                      { label: 'מע"מ הוצאות', value: totalExpensesVat },
                      { label: 'מע"מ הכנסות', value: Math.round(calcVat(totalRevenueFull)) },
                    ].map((item) => (
                      <div key={item.label}>
                        <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--v2-gray-400)' }}>{item.label}</p>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                          ₪
                          {item.value.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {showReportSettings && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{ background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%', position: 'relative', border: '1px solid var(--glass-border)' }}>
                    <button
                      type="button"
                      onClick={() => setShowReportSettings(false)}
                      style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>הגדרות דוח</h3>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                        פוד קוסט — % מעלות סחורה (בר + שולחנות)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={reportSettings.food_cost_pct}
                          onChange={(e) => setReportSettings((s) => ({ ...s, food_cost_pct: parseFloat(e.target.value) || 0 }))}
                          style={{ width: 80, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 16, textAlign: 'center' }}
                        />
                        <span style={{ fontSize: 14, color: 'var(--v2-gray-400)' }}>%</span>
                        <span style={{ fontSize: 13, color: '#00C37A' }}>
                          = ₪
                          {Math.round(foodCostAmount).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--v2-gray-400)', margin: '4px 0 0' }}>
                        מחושב על בר (₪
                        {parseFloat(barRevenue).toLocaleString()}
                        ) + שולחנות (₪
                        {parseFloat(tablesRevenue).toLocaleString()}
                        )
                      </p>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        סוג עוסק / מע&quot;מ
                      </label>
                      {[
                        { value: 'included', label: 'מחיר כולל מע"מ', sub: 'מחיר הכרטיס כולל מע"מ (÷1.18)' },
                        { value: 'excluded', label: 'מחיר + מע"מ', sub: 'מחיר הכרטיס לפני מע"מ (×1.18)' },
                        { value: 'exempt', label: 'עוסק פטור', sub: 'ללא מע"מ' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
                            border: `1px solid ${reportSettings.vat_mode === opt.value ? '#00C37A' : 'var(--glass-border)'}`,
                            background: reportSettings.vat_mode === opt.value ? 'rgba(0,195,122,0.08)' : 'transparent',
                          }}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            checked={reportSettings.vat_mode === opt.value}
                            onChange={() => setReportSettings((s) => ({ ...s, vat_mode: opt.value }))}
                          />
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--v2-gray-400)' }}>{opt.sub}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowReportSettings(false)
                        toast.success('הגדרות נשמרו!')
                      }}
                      style={{
                        width: '100%', height: 44, borderRadius: 8, border: 'none',
                        background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                      }}
                    >
                      שמור הגדרות
                    </button>
                  </div>
                </div>
              )}

              {showShareReport && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{ background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', position: 'relative', border: '1px solid var(--glass-border)' }}>
                    <button
                      type="button"
                      onClick={() => setShowShareReport(false)}
                      style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>שיתוף דוח</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      <input
                        value={newShareForm.name}
                        onChange={(e) => setNewShareForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="שם הנמען (למשל: שותף, רואה חשבון)"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box', width: '100%' }}
                      />

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { value: 'view', label: '👁 צפייה בלבד', sub: 'רואה נתונים בלבד' },
                          { value: 'edit_all', label: '✏️ עריכה מלאה', sub: 'הכנסות + הוצאות' },
                          { value: 'edit_revenues', label: '💰 עריכת הכנסות', sub: 'רק הכנסות' },
                          { value: 'edit_expenses', label: '📋 עריכת הוצאות', sub: 'רק הוצאות' },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            style={{
                              flex: '1 1 42%', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                              border: `1px solid ${newShareForm.permission === opt.value ? '#00C37A' : 'var(--glass-border)'}`,
                              background: newShareForm.permission === opt.value ? 'rgba(0,195,122,0.08)' : 'transparent',
                              display: 'flex', alignItems: 'flex-start', gap: 8,
                            }}
                          >
                            <input
                              type="radio"
                              checked={newShareForm.permission === opt.value}
                              onChange={() => setNewShareForm((f) => ({ ...f, permission: opt.value }))}
                            />
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--v2-gray-400)' }}>{opt.sub}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      <CustomSelect
                        value={String(newShareForm.expires_days)}
                        onChange={(v) => setNewShareForm((f) => ({ ...f, expires_days: parseInt(v, 10) }))}
                        options={[
                          { value: '1', label: 'יום אחד' },
                          { value: '7', label: 'שבוע' },
                          { value: '30', label: 'חודש' },
                          { value: '365', label: 'שנה' },
                          { value: '0', label: 'ללא תפוגה' },
                        ]}
                      />

                      <button
                        type="button"
                        disabled={!newShareForm.name}
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/events/${id}/shares`, {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify({
                              name: newShareForm.name,
                              permission: newShareForm.permission,
                              expires_days: newShareForm.expires_days,
                            }),
                          })
                          if (!res.ok) {
                            toast.error('יצירת הלינק נכשלה')
                            return
                          }
                          const data = await res.json()
                          setShareLinks((prev) => [...prev, { ...data.share, url: data.url }])
                          navigator.clipboard.writeText(data.url)
                          toast.success('לינק נוצר והועתק!')
                          setNewShareForm({ name: '', permission: 'view', expires_days: 7 })
                        }}
                        style={{
                          height: 44, borderRadius: 8, border: 'none',
                          background: newShareForm.name ? '#00C37A' : 'var(--glass)',
                          color: newShareForm.name ? '#000' : 'var(--v2-gray-400)',
                          fontWeight: 700, fontSize: 15, cursor: newShareForm.name ? 'pointer' : 'not-allowed',
                        }}
                      >
                        צור לינק שיתוף
                      </button>
                    </div>

                    {shareLinks.length > 0 && (
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>לינקים פעילים:</p>
                        {shareLinks.map((link) => (
                          <div
                            key={link.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', borderRadius: 8,
                              background: 'var(--glass)', marginBottom: 6,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{link.name}</p>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--v2-gray-400)' }}>
                                {(
                                  {
                                    view: '👁 צפייה בלבד',
                                    edit_all: '✏️ עריכה מלאה',
                                    edit_revenues: '💰 עריכת הכנסות',
                                    edit_expenses: '📋 עריכת הוצאות',
                                    edit_tables: '📋 שולחנות',
                                    edit_checkin: '✅ צ\'ק אין',
                                    edit: '✏️ עריכה',
                                  }[link.permission] || link.permission
                                )}
                                {' · '}
                                {link.expires_at
                                  ? `תוקף: ${new Date(link.expires_at).toLocaleDateString('he-IL')}`
                                  : 'ללא תפוגה'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(link.url)
                                toast.success('הועתק!')
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A' }}
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch(`${API_BASE}/api/admin/events/${id}/shares/${link.id}`, {
                                  method: 'DELETE',
                                  headers: authHeaders(),
                                })
                                setShareLinks((prev) => prev.filter((l) => l.id !== link.id))
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>תנועת קהל</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCrowd(true)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
                      background: 'var(--glass)', color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    + עדכן נתונים
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { label: 'כניסות', value: financials.crowd_stats.reduce((s, c) => Math.max(s, c.entries || 0), 0) },
                    { label: 'יציאות', value: financials.crowd_stats.reduce((s, c) => Math.max(s, c.exits || 0), 0) },
                    { label: 'שיא בו-זמניות', value: peakCrowd },
                  ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: 'center', padding: 12, background: 'var(--glass)', borderRadius: 8 }}>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{stat.value}</div>
                      <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {showAddExpense && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', position: 'relative', border: '1px solid var(--glass-border)',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>הוסף הוצאה</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <CustomSelect
                        value={expenseForm.category}
                        onChange={(v) => setExpenseForm((f) => ({ ...f, category: v }))}
                        options={EXPENSE_CATEGORIES}
                      />
                      <CustomSelect
                        value={expenseForm.vendor_id || ''}
                        onChange={(v) => {
                          const vendor = vendors.find((vd) => String(vd.id) === String(v))
                          setExpenseForm((f) => ({
                            ...f,
                            vendor_id: v,
                            item_name: vendor?.name || f.item_name,
                            amount: vendor?.default_price != null ? String(vendor.default_price) : f.amount,
                          }))
                        }}
                        placeholder="בחר ספק קיים (אופציונלי)"
                        options={[
                          { value: '', label: '— ספק חדש —' },
                          ...vendors.map((v) => ({ value: String(v.id), label: `${v.name} (₪${v.default_price})` })),
                        ]}
                      />
                      <input
                        value={expenseForm.item_name}
                        onChange={(e) => setExpenseForm((f) => ({ ...f, item_name: e.target.value }))}
                        placeholder="שם הפריט / ספק"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                          placeholder="סכום ₪"
                          type="number"
                          style={{ flex: 2, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                        />
                        <input
                          value={expenseForm.quantity}
                          onChange={(e) => setExpenseForm((f) => ({ ...f, quantity: e.target.value }))}
                          placeholder="כמות"
                          type="number"
                          min="1"
                          style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                        />
                      </div>
                      <CustomSelect
                        value={expenseForm.payment_status}
                        onChange={(v) => setExpenseForm((f) => ({ ...f, payment_status: v }))}
                        options={Object.entries(PAYMENT_STATUS).map(([val, { label }]) => ({ value: val, label }))}
                      />
                      <input
                        value={expenseForm.invoice_number || ''}
                        onChange={(e) => setExpenseForm((f) => ({ ...f, invoice_number: e.target.value }))}
                        placeholder="מספר חשבונית (אופציונלי)"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const r = await fetch(`${API_BASE}/api/admin/events/${id}/expenses`, {
                            method: 'POST', headers: authHeaders(),
                            body: JSON.stringify({
                              category: expenseForm.category,
                              item_name: expenseForm.item_name,
                              amount: parseFloat(expenseForm.amount) || 0,
                              quantity: parseInt(expenseForm.quantity, 10) || 1,
                              vendor_id: expenseForm.vendor_id || null,
                              payment_status: expenseForm.payment_status,
                              invoice_number: expenseForm.invoice_number || null,
                            }),
                          })
                          if (!r.ok) {
                            toast.error('שמירה נכשלה')
                            return
                          }
                          setShowAddExpense(false)
                          setExpenseForm({ category: 'staff', item_name: '', amount: '', quantity: 1, payment_status: 'pending', vendor_id: '', invoice_number: '' })
                          await loadData()
                          toast.success('הוצאה נוספה!')
                        }}
                        style={{ height: 44, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                      >
                        שמור הוצאה
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAddVendor && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', position: 'relative', border: '1px solid var(--glass-border)',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAddVendor(false)}
                      style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>הוסף ספק</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        value={vendorForm.name}
                        onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="שם הספק"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <CustomSelect
                        value={vendorForm.vendor_type}
                        onChange={(v) => setVendorForm((f) => ({ ...f, vendor_type: v }))}
                        options={INVOICE_TYPES}
                      />
                      <CustomSelect
                        value={vendorForm.category}
                        onChange={(v) => setVendorForm((f) => ({
                          ...f,
                          category: v,
                          custom_category: v === 'custom' ? f.custom_category : '',
                        }))}
                        options={[
                          ...EXPENSE_CATEGORIES,
                          { value: 'custom', label: '+ הוסף קטגוריה חדשה' },
                        ]}
                      />
                      {vendorForm.category === 'custom' && (
                        <input
                          value={vendorForm.custom_category}
                          onChange={(e) => setVendorForm((f) => ({ ...f, custom_category: e.target.value }))}
                          placeholder="שם הקטגוריה החדשה (למשל: בוקינג אמנים)"
                          style={{ height: 40, borderRadius: 8, border: '1px solid #00C37A', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                        />
                      )}
                      <input
                        value={vendorForm.contact_name}
                        onChange={(e) => setVendorForm((f) => ({ ...f, contact_name: e.target.value }))}
                        placeholder="איש קשר"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <input
                        value={vendorForm.contact_phone}
                        onChange={(e) => setVendorForm((f) => ({ ...f, contact_phone: e.target.value }))}
                        placeholder="טלפון"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <input
                        value={vendorForm.contact_email}
                        onChange={(e) => setVendorForm((f) => ({ ...f, contact_email: e.target.value }))}
                        placeholder="מייל"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <input
                        value={vendorForm.address}
                        onChange={(e) => setVendorForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="כתובת (אופציונלי)"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <input
                        value={vendorForm.default_price}
                        onChange={(e) => setVendorForm((f) => ({ ...f, default_price: e.target.value }))}
                        placeholder="מחיר ברירת מחדל / משוער ₪"
                        type="number"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <div style={{ border: '1px solid var(--glass-border)', borderRadius: 8, padding: 12 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>
                          פריטים משוייכים לספק
                        </p>
                        <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                          למשל: שם אמן, שם תפקיד, שם שירות ספציפי
                        </p>
                        {vendorForm.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ flex: 1, fontSize: 13 }}>{item.name}</span>
                            <span style={{ fontSize: 13, color: '#00C37A' }}>
                              ₪
                              {item.price || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => setVendorForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <input
                            value={newVendorItem.name}
                            onChange={(e) => setNewVendorItem((i) => ({ ...i, name: e.target.value }))}
                            placeholder="שם פריט (למשל: DJ Avicii)"
                            style={{ flex: 2, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
                          />
                          <input
                            value={newVendorItem.price}
                            onChange={(e) => setNewVendorItem((i) => ({ ...i, price: e.target.value }))}
                            placeholder="₪ מחיר"
                            type="number"
                            style={{ flex: 1, height: 34, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 8px', fontSize: 13 }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newVendorItem.name) return
                              setVendorForm((f) => ({
                                ...f,
                                items: [...f.items, { name: newVendorItem.name, price: newVendorItem.price || 0 }],
                              }))
                              setNewVendorItem({ name: '', price: '' })
                            }}
                            style={{
                              height: 34,
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
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!vendorForm.name?.trim()) {
                            toast.error('יש למלא שם ספק')
                            return
                          }
                          const category = vendorForm.category === 'custom'
                            ? vendorForm.custom_category.trim()
                            : vendorForm.category
                          if (!category) {
                            toast.error('בחר או הזן קטגוריה')
                            return
                          }
                          const r = await fetch(`${API_BASE}/api/admin/vendors`, {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify({
                              name: vendorForm.name.trim(),
                              category,
                              vendor_type: vendorForm.vendor_type,
                              contact_name: vendorForm.contact_name || null,
                              contact_phone: vendorForm.contact_phone || null,
                              contact_email: vendorForm.contact_email || null,
                              address: vendorForm.address || null,
                              default_price: parseFloat(vendorForm.default_price) || 0,
                              items: vendorForm.items.map((it) => ({
                                name: it.name,
                                price: parseFloat(it.price) || 0,
                              })),
                            }),
                          })
                          if (!r.ok) {
                            toast.error('שמירת ספק נכשלה')
                            return
                          }
                          setShowAddVendor(false)
                          setVendorForm({
                            name: '',
                            category: '',
                            custom_category: '',
                            vendor_type: 'none',
                            contact_name: '',
                            contact_phone: '',
                            contact_email: '',
                            address: '',
                            default_price: '',
                            items: [],
                          })
                          setNewVendorItem({ name: '', price: '' })
                          await loadData()
                          toast.success('ספק נוסף!')
                        }}
                        style={{ height: 44, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                      >
                        שמור ספק
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAddRevenue && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%', position: 'relative', border: '1px solid var(--glass-border)',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAddRevenue(false)}
                      style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>הוסף הכנסה</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <CustomSelect
                        value={revenueForm.source}
                        onChange={(v) => setRevenueForm((f) => ({
                          ...f, source: v, label: REVENUE_SOURCES.find((r) => r.value === v)?.label || v,
                        }))}
                        options={REVENUE_SOURCES}
                      />
                      <input
                        value={revenueForm.label}
                        onChange={(e) => setRevenueForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="תיאור (אופציונלי)"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <input
                        value={revenueForm.amount}
                        onChange={(e) => setRevenueForm((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="סכום ₪"
                        type="number"
                        style={{ height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14 }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const r = await fetch(`${API_BASE}/api/admin/events/${id}/revenues`, {
                            method: 'POST', headers: authHeaders(),
                            body: JSON.stringify({
                              source: revenueForm.source,
                              label: revenueForm.label,
                              amount: parseFloat(revenueForm.amount) || 0,
                            }),
                          })
                          if (!r.ok) {
                            toast.error('שמירה נכשלה')
                            return
                          }
                          setShowAddRevenue(false)
                          setRevenueForm({ source: 'cash_entry', label: '', amount: '' })
                          await loadData()
                          toast.success('הכנסה נוספה!')
                        }}
                        style={{ height: 44, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                      >
                        שמור הכנסה
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showAddCrowd && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%', position: 'relative', border: '1px solid var(--glass-border)',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAddCrowd(false)}
                      style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>עדכן תנועת קהל</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { field: 'entries', label: 'כניסות מצטברות' },
                        { field: 'exits', label: 'יציאות מצטברות' },
                        { field: 'simultaneous', label: 'בו-זמניות כרגע' },
                      ].map((f) => (
                        <div key={f.field}>
                          <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                          <input
                            value={crowdForm[f.field]}
                            onChange={(e) => setCrowdForm((cf) => ({ ...cf, [f.field]: e.target.value }))}
                            type="number"
                            placeholder="0"
                            style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={crowdForm.is_peak} onChange={(e) => setCrowdForm((cf) => ({ ...cf, is_peak: e.target.checked }))} />
                        סמן כשיא הערב
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const r = await fetch(`${API_BASE}/api/admin/events/${id}/crowd`, {
                            method: 'POST', headers: authHeaders(),
                            body: JSON.stringify({
                              entries: parseInt(crowdForm.entries, 10) || 0,
                              exits: parseInt(crowdForm.exits, 10) || 0,
                              simultaneous: parseInt(crowdForm.simultaneous, 10) || 0,
                              is_peak: crowdForm.is_peak,
                            }),
                          })
                          if (!r.ok) {
                            toast.error('שמירה נכשלה')
                            return
                          }
                          setShowAddCrowd(false)
                          setCrowdForm({ entries: '', exits: '', simultaneous: '', is_peak: false })
                          await loadData()
                          toast.success('נתוני קהל עודכנו!')
                        }}
                        style={{ height: 44, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                      >
                        שמור
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {activeTab === 'tables' && (
          <EventTables
            eventId={id}
            eventTitle={event?.title}
            eventDate={event?.date}
            businessId={businessId}
            authHeaders={authHeaders}
            session={session}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesTab
            eventId={id}
            businessId={businessId}
            authHeaders={authHeaders}
          />
        )}

        {activeTab === 'campaigns' && (
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>ניהול קמפיינים — בקרוב.</p>
        )}

        {activeTab === 'channels' && (() => {
          const totalSoldAll = channels.reduce((s, c) => s + (Number(c.total_sold) || 0), 0)
          const totalRevAll = channels.reduce((s, c) => s + (Number(c.total_revenue) || 0), 0)
          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#00C37A' }}>{totalSoldAll}</div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>סה"כ נמכרו</div>
                </div>
                <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#3B82F6' }}>
                    ₪
                    {totalRevAll.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>סה"כ הכנסה</div>
                </div>
                <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#8B5CF6' }}>{channels.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>ערוצים פעילים</div>
                </div>
              </div>

              <div style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                marginLeft: isMobile ? -16 : 0,
                marginRight: isMobile ? -16 : 0,
                paddingLeft: isMobile ? 16 : 0,
                paddingRight: isMobile ? 16 : 0,
                marginBottom: 16,
              }}
              >
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: 'var(--glass)', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {['ערוץ', 'נמכרו', 'הכנסה', '% מהסה"כ', 'עדכון אחרון'].map((h) => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((ch) => {
                      const pct = totalSoldAll > 0 ? Math.round(((Number(ch.total_sold) || 0) / totalSoldAll) * 100) : 0
                      return (
                        <tr key={String(ch.id)} style={{ borderTop: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px', fontSize: 14, fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {ch.channel_name === 'axess' ? '🟢' : '🔵'}
                              {' '}
                              {ch.channel_label}
                              {ch.is_native && (
                                <span style={{
                                  fontSize: 10, color: '#00C37A', background: 'rgba(0,195,122,0.1)',
                                  padding: '2px 6px', borderRadius: 8,
                                }}
                                >
                                  ישיר
                                </span>
                              )}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: 14 }}>{ch.total_sold || 0}</td>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            ₪
                            {(Number(ch.total_revenue) || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px', fontSize: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--glass)' }}>
                                <div style={{
                                  height: '100%', borderRadius: 3, background: '#00C37A', width: `${pct}%`,
                                }}
                                />
                              </div>
                              <span>
                                {pct}
                                %
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                            {ch.last_sync_at ? new Date(ch.last_sync_at).toLocaleDateString('he-IL') : 'עכשיו'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedChannel('all')}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    border: selectedChannel === 'all' ? 'none' : '1px solid var(--glass-border)',
                    background: selectedChannel === 'all' ? 'var(--primary)' : 'transparent',
                    color: selectedChannel === 'all' ? '#fff' : 'var(--text)',
                    cursor: 'pointer', fontSize: 13, fontWeight: selectedChannel === 'all' ? 700 : 400,
                  }}
                >
                  כולם (
                  {orders.length}
                  )
                </button>
                {channels.map((ch) => (
                  <button
                    key={String(ch.id)}
                    type="button"
                    onClick={() => setSelectedChannel(ch.channel_name)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: selectedChannel === ch.channel_name ? 'none' : '1px solid var(--glass-border)',
                      background: selectedChannel === ch.channel_name ? 'var(--primary)' : 'transparent',
                      color: selectedChannel === ch.channel_name ? '#fff' : 'var(--text)',
                      cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    {ch.channel_label}
                    {' '}
                    (
                    {ch.total_sold || 0}
                    )
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => downloadChannelReport(channelOrders, selectedChannel)}
                  style={{
                    marginRight: 'auto', padding: '6px 14px', borderRadius: 8,
                    border: '1px solid var(--glass-border)', background: 'var(--glass)',
                    color: '#00C37A', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Download size={13} />
                  Excel
                </button>
              </div>

              <div style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                marginLeft: isMobile ? -16 : 0,
                marginRight: isMobile ? -16 : 0,
                paddingLeft: isMobile ? 16 : 0,
                paddingRight: isMobile ? 16 : 0,
              }}
              >
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: 'var(--glass)', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {['שם', 'שם משפחה', 'נייד', 'מייל', 'סוג כרטיס', 'סכום',
                        'מ׳ עסקה', 'ת״ז', 'יחצ״ן', 'אינסטגרם', 'ערוץ', 'תאריך'].map((h) => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedChannel === 'all'
                      ? orders
                      : orders.filter((o) => (o.sales_channel || 'axess') === selectedChannel)).map((order, idx) => (
                      <tr
                        key={order.id}
                        style={{
                          borderTop: '1px solid var(--glass-border)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{order.first_name}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{order.last_name}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, direction: 'ltr' }}>{order.phone}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{order.email || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{order.ticket_type || 'רגיל'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>
                          ₪
                          {order.total_price || 0}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                          {order.id?.slice(0, 8)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{order.id_number || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{order.promoter_name || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>
                          {order.instagram ? (
                            <a
                              href={`https://instagram.com/${order.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#00C37A', textDecoration: 'none' }}
                            >
                              @
                              {order.instagram}
                            </a>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12 }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 11,
                            background: (order.sales_channel || 'axess') === 'axess' ? 'rgba(0,195,122,0.15)' : 'rgba(59,130,246,0.15)',
                            color: (order.sales_channel || 'axess') === 'axess' ? '#00C37A' : '#3B82F6',
                          }}
                          >
                            {order.sales_channel || 'axess'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                          {new Date(order.created_at).toLocaleDateString('he-IL')}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={12} style={{ padding: 24, textAlign: 'center', color: 'var(--v2-gray-400)' }}>
                          אין רשומים עדיין
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    setImportChannelLabel('')
                    setImportHeaders([])
                    setImportRows([])
                    setColumnMap({})
                    setShowImportChannel(true)
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: 'none',
                    background: '#00C37A', color: '#000', fontWeight: 700,
                    cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Upload size={16} />
                  ייבוא מפלטפורמה חיצונית
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualChannelLabel('')
                    setManualChannelSold('')
                    setManualChannelRevenue('')
                    setShowAddChannel(true)
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: '1px solid var(--glass-border)',
                    background: 'var(--glass)', color: 'var(--text)',
                    cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={16} />
                  הוסף ערוץ ידני
                </button>
              </div>

              {showImportChannel && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 500, width: '100%',
                    position: 'relative', border: '1px solid var(--glass-border)',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowImportChannel(false)}
                      style={{
                        position: 'absolute', top: 12, left: 12, background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--v2-gray-400)',
                      }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>ייבוא מפלטפורמה חיצונית</h3>

                    <input
                      value={importChannelLabel}
                      onChange={(e) => setImportChannelLabel(e.target.value)}
                      placeholder="שם הפלטפורמה (למשל: Eventbrite)"
                      style={{
                        width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--glass-border)',
                        background: 'var(--glass)', color: 'var(--text)', padding: '0 12px', fontSize: 14,
                        marginBottom: 12, boxSizing: 'border-box',
                      }}
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('channel-import-file')?.click() }}
                      onClick={() => document.getElementById('channel-import-file')?.click()}
                      style={{
                        border: '2px dashed var(--glass-border)', borderRadius: 8, padding: 20, textAlign: 'center',
                        cursor: 'pointer', marginBottom: 12,
                      }}
                    >
                      <input
                        id="channel-import-file"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        hidden
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const text = await file.text()
                          const lines = text.split('\n').filter((l) => l.trim())
                          const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
                          const rows = lines.slice(1).map((l) => {
                            const vals = l.split(',').map((v) => v.trim().replace(/"/g, ''))
                            return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] || '' }), {})
                          })
                          setImportHeaders(headers)
                          setImportRows(rows)
                        }}
                      />
                      <Upload size={20} style={{ color: 'var(--v2-gray-400)', marginBottom: 8 }} />
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                        {importRows.length > 0 ? `${importRows.length} שורות נטענו` : 'גרור CSV/Excel או לחץ לבחירה'}
                      </p>
                    </div>

                    {importHeaders.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>מפה עמודות:</p>
                        {[
                          { field: 'phone', label: 'טלפון *' },
                          { field: 'first_name', label: 'שם פרטי' },
                          { field: 'last_name', label: 'שם משפחה' },
                          { field: 'price', label: 'מחיר' },
                          { field: 'ticket_type', label: 'סוג כרטיס' },
                          { field: 'external_order_id', label: 'מזהה הזמנה חיצוני' },
                        ].map((f) => (
                          <div key={f.field} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ width: 140, fontSize: 13, flexShrink: 0 }}>{f.label}</span>
                            <CustomSelect
                              value={columnMap[f.field] || ''}
                              onChange={(val) => setColumnMap((prev) => ({ ...prev, [f.field]: val }))}
                              placeholder="בחר עמודה"
                              options={[
                                { value: '', label: '— לא ממופה —' },
                                ...importHeaders.map((h) => ({ value: h, label: h })),
                              ]}
                              style={{ flex: 1, minWidth: 0 }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!importChannelLabel || importRows.length === 0 || !columnMap.phone}
                      onClick={async () => {
                        const res = await fetch(`${API_BASE}/api/admin/events/${id}/channels/import`, {
                          method: 'POST',
                          headers: authHeaders(),
                          body: JSON.stringify({
                            channel_label: importChannelLabel,
                            channel_name: 'import',
                            orders: importRows,
                            column_map: columnMap,
                          }),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          toast.error(data.error || 'ייבוא נכשל')
                          return
                        }
                        toast.success(`יובאו ${data.imported} רשומות!`)
                        setShowImportChannel(false)
                        setImportChannelLabel('')
                        setImportHeaders([])
                        setImportRows([])
                        setColumnMap({})
                        await loadData()
                      }}
                      style={{
                        width: '100%', height: 44, borderRadius: 8, border: 'none',
                        background: '#00C37A', color: '#000', fontWeight: 700,
                        fontSize: 15, cursor: 'pointer',
                      }}
                    >
                      ייבא רשומות
                    </button>
                  </div>
                </div>
              )}

              {showAddChannel && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
                >
                  <div style={{
                    background: 'var(--card)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%',
                    border: '1px solid var(--glass-border)', position: 'relative',
                  }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowAddChannel(false)}
                      style={{
                        position: 'absolute', top: 12, left: 12, background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--v2-gray-400)',
                      }}
                    >
                      <X size={20} />
                    </button>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>הוסף ערוץ ידני</h3>
                    <input
                      value={manualChannelLabel}
                      onChange={(e) => setManualChannelLabel(e.target.value)}
                      placeholder="שם הערוץ"
                      style={{
                        width: '100%', padding: 10, marginBottom: 10, borderRadius: 8,
                        border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={manualChannelSold}
                      onChange={(e) => setManualChannelSold(e.target.value)}
                      placeholder="נמכרו (מספר)"
                      style={{
                        width: '100%', padding: 10, marginBottom: 10, borderRadius: 8,
                        border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={manualChannelRevenue}
                      onChange={(e) => setManualChannelRevenue(e.target.value)}
                      placeholder="הכנסה (₪)"
                      style={{
                        width: '100%', padding: 10, marginBottom: 16, borderRadius: 8,
                        border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      disabled={!manualChannelLabel.trim()}
                      onClick={async () => {
                        const res = await fetch(`${API_BASE}/api/admin/events/${id}/channels`, {
                          method: 'POST',
                          headers: authHeaders(),
                          body: JSON.stringify({
                            channel_label: manualChannelLabel.trim(),
                            channel_name: 'custom',
                            total_sold: parseInt(manualChannelSold, 10) || 0,
                            total_revenue: parseFloat(manualChannelRevenue) || 0,
                          }),
                        })
                        if (!res.ok) {
                          toast.error('שגיאה בשמירה')
                          return
                        }
                        toast.success('נשמר')
                        setShowAddChannel(false)
                        await loadData()
                      }}
                      style={{
                          width: '100%', padding: 12, borderRadius: 8, border: 'none',
                          background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      שמור
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {activeTab === 'webview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--v2-gray-400)' }}>
              Webview של העסק — מדידה לפי שורות אנליטיקה שבהן
              {' '}
              <strong>utm_campaign</strong>
              {' '}
              או
              {' '}
              <strong>utm_source</strong>
              {' '}
              מכילים את slug האירוע (
              <code style={{ fontSize: 13 }}>{event.slug}</code>
              ).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>צפיות</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#06B6D4' }}>{eventWebStats.sessions}</div>
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 6 }}>הזמנות דרך Webview</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#00C37A' }}>{eventWebStats.conversions}</div>
              </div>
            </div>
            {webviewBusinessSlug ? (
              <a
                href={`${PUBLIC_WEBVIEW_ORIGIN}/w/${encodeURIComponent(webviewBusinessSlug)}?utm_campaign=${encodeURIComponent(event.slug || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 14, color: '#00C37A', textDecoration: 'underline', width: 'fit-content',
                }}
              >
                פתח Webview עם UTM לאירוע
              </a>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                לא מוגדר slug ל-Webview בעסק — הגדר בהגדרות Webview.
              </p>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard/webview')}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', width: 'fit-content',
                background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14,
              }}
            >
              קשר Webview
            </button>
          </div>
        )}

        {cancelConfirm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          >
            <div style={{
              background: '#1a1d2e', borderRadius: 14, padding: 24, maxWidth: 360, width: '100%', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
            }}
            >
              <p style={{ fontSize: 20, margin: '0 0 8px' }}>⚠️</p>
              <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>ביטול כרטיס</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>
                הינך עומד לבטל כרטיס של
                <br />
                <strong style={{ color: '#fff' }}>{cancelConfirm.name}</strong>
                <br />
                האם לבטל בכל זאת?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setCancelConfirm(null)}
                  style={{
                    flex: 1, height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  חזור
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleCancelOrder(cancelConfirm.orderId)
                    setCancelConfirm(null)
                  }}
                  style={{
                    flex: 1, height: 42, borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  בטל כרטיס
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 15 }}>
                <strong style={{ color: '#00C37A' }}>{checkedIn.length}</strong>
                {' '}
                נסרקו מתוך
                {' '}
                <strong>{approved.length}</strong>
                {' '}
                מאושרים
              </p>
              <div style={{ background: 'var(--glass)', borderRadius: 8, padding: '8px 16px', fontSize: 13 }}>
                {approved.length > 0 ? Math.round((checkedIn.length / approved.length) * 100) : 0}
                % הגיעו
              </div>
            </div>
            <div style={{ height: 12, borderRadius: 6, background: 'var(--glass)', marginBottom: 20 }}>
              <div style={{
                height: '100%', borderRadius: 6, background: '#00C37A',
                width: approved.length > 0 ? `${(checkedIn.length / approved.length) * 100}%` : '0%',
                transition: 'width 0.5s ease',
              }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
