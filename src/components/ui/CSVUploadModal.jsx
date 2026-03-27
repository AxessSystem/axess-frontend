import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

const GOOUT_FIELD_MAP = {
  'Event Title': 'event_title',
  'Payment ID': 'payment_id',
  'Order ID': 'order_id',
  'Status': 'goout_status',
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Invited By ID': 'invited_by_id',
  'Phone': 'buyer_phone',
  'Email': 'buyer_email',
  'Subscribe': 'subscribed',
  'ID Number': 'identification_number',
  'Gender': 'gender',
  'Date of Birth': 'date_of_birth',
  'Age': 'age',
  'Purchase Date': 'purchase_date',
  'Payment Method': 'payment_method',
  'Producer Credit': 'producer_credit',
  'Total Items': 'total_items',
  'Salesperson': 'salesperson',
  'Scan Status': 'scan_status',
  'Last Reader Update': 'last_reader_update',
  'Producer Comment': 'producer_comment',
  'Instagram URL': 'instagram_url',
  'Item Name': 'item_name',
  'Ticket Price': 'ticket_price',
  'Total Participants': 'total_participants',
  'Total Income': 'total_income',
}

function normalizeRow(raw, producerId, eventId) {
  const row = {}
  for (const [csvKey, dbKey] of Object.entries(GOOUT_FIELD_MAP)) {
    const val = raw[csvKey]
    if (val !== undefined && val !== '') {
      row[dbKey] = val
    }
  }

  if (!row.order_id) return null
  if (!row.buyer_phone) return null

  row.producer_id = producerId
  if (eventId) row.event_id = eventId

  if (row.ticket_price) row.ticket_price = parseFloat(row.ticket_price) || null
  if (row.total_income) row.total_income = parseFloat(row.total_income) || null
  if (row.total_items) row.total_items = parseInt(row.total_items) || 1
  if (row.total_participants) row.total_participants = parseInt(row.total_participants) || 1
  if (row.age) row.age = parseInt(row.age) || null
  if (row.subscribed) row.subscribed = ['true', '1', 'yes'].includes(String(row.subscribed).toLowerCase())

  const genderMap = { 'Male': 'male', 'Female': 'female', 'זכר': 'male', 'נקבה': 'female' }
  if (row.gender) row.gender = genderMap[row.gender] || 'unknown'

  const statusMap = { 'Paid': 'Paid', 'Approved': 'Approved', 'Pending': 'Pending', 'Cancelled': 'Cancelled', 'Refunded': 'Refunded' }
  if (row.goout_status) row.goout_status = statusMap[row.goout_status] || 'Pending'

  return row
}

export default function CSVUploadModal({ eventId, producerId: propProducerId, onClose, onSuccess }) {
  const { producerId: authProducerId, isAdmin } = useAuth()
  const [pickedProducerId, setPickedProducerId] = useState(propProducerId || '')
  const producerId = propProducerId || authProducerId || (pickedProducerId || null)

  const { data: producers } = useQuery({
    queryKey: ['admin-producers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data || []
    },
    enabled: isAdmin && !propProducerId && !authProducerId,
  })

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setResult(null)

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        setPreview({
          total: data.length,
          sample: data.slice(0, 3),
          headers: Object.keys(data[0] || {}),
        })
      },
    })
  }

  const handleUpload = async () => {
    if (!file || !producerId) return
    setUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        const rows = data
          .map(r => normalizeRow(r, producerId, eventId))
          .filter(Boolean)

        const BATCH = 50
        let inserted = 0, failed = 0
        const importBatchId = `csv_${Date.now()}`

        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH).map(r => ({
            ...r,
            import_batch_id: importBatchId,
            source: 'goout_csv',
          }))

          const { error } = await supabase
            .from('transactions')
            .upsert(batch, { onConflict: 'order_id', ignoreDuplicates: false })

          if (error) {
            failed += batch.length
            console.error('Batch error:', error)
          } else {
            inserted += batch.length
          }
        }

        setResult({ total: rows.length, inserted, failed })
        setUploading(false)
        if (inserted > 0) onSuccess?.()
      },
      error: (err) => {
        toast.error(`שגיאה בפרסור: ${err.message}`)
        setUploading(false)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-100 border border-border rounded-2xl w-full max-w-lg shadow-card animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-wa" />
            <h2 className="font-bold text-white">ייבוא CSV מ-GoOut</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Producer picker for admin when no event selected */}
          {isAdmin && !propProducerId && !authProducerId && (
            <div>
              <label className="label">בחר מפיק *</label>
              <CustomSelect
                value={pickedProducerId}
                onChange={(val) => setPickedProducerId(val)}
                className="input"
                options={[
                  { value: '', label: 'בחר מפיק' },
                  ...(producers || []).map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${file ? 'border-wa/40 bg-wa/5' : 'border-border hover:border-border-light hover:bg-surface-50'}
            `}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText size={20} className="text-wa" />
                <div className="text-right">
                  <p className="text-white font-medium text-sm">{file.name}</p>
                  <p className="text-muted text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-muted mx-auto mb-2" />
                <p className="text-white font-medium text-sm">גרור קובץ CSV לכאן</p>
                <p className="text-muted text-xs mt-1">או לחץ לבחירה — פורמט GoOut בלבד</p>
              </>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-surface-300 rounded-xl p-4 text-sm">
              <p className="text-white font-medium mb-2">תצוגה מקדימה</p>
              <p className="text-muted">
                {preview.total} שורות · {preview.headers.length} עמודות
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {preview.headers.slice(0, 8).map(h => (
                  <span key={h} className="badge-gray text-[10px]">{h}</span>
                ))}
                {preview.headers.length > 8 && (
                  <span className="text-muted text-xs">+{preview.headers.length - 8} עוד</span>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${
              result.failed === 0 ? 'bg-wa/10 border border-wa/20' : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              {result.failed === 0
                ? <CheckCircle size={18} className="text-wa flex-shrink-0 mt-0.5" />
                : <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              }
              <div>
                <p className="text-white font-medium text-sm">
                  {result.inserted} שורות יובאו בהצלחה
                </p>
                {result.failed > 0 && (
                  <p className="text-yellow-400 text-xs mt-0.5">{result.failed} שורות נכשלו</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={!file || !producerId || uploading || !!result}
              className="btn-primary flex-1"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  מייבא...
                </>
              ) : (
                <>
                  <Upload size={16} /> ייבוא
                </>
              )}
            </button>
            <button onClick={onClose} className="btn-secondary">
              {result ? 'סגור' : 'ביטול'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
