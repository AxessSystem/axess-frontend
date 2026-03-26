import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, Check, ArrowRight, Download, AlertTriangle, XCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const MAP_OPTIONS = [
  { value: 'phone', label: 'טלפון' },
  { value: 'first_name', label: 'שם פרטי' },
  { value: 'last_name', label: 'שם משפחה' },
  { value: 'full_name', label: 'שם מלא' },
  { value: 'email', label: 'אימייל' },
  { value: 'city', label: 'עיר' },
  { value: 'notes', label: 'הערות' },
  { value: 'total_spent', label: 'סכום קניות' },
  { value: 'birth_date', label: 'תאריך לידה' },
  { value: 'age', label: 'גיל' },
  { value: 'gender', label: 'מגדר' },
  { value: 'id_number', label: 'תעודת זהות' },
  { value: 'subscribed', label: 'מנוי לדיוור' },
  { value: 'instagram', label: 'אינסטגרם' },
  { value: 'tags', label: 'תגיות' },
  { value: 'event_title', label: 'שם אירוע' },
  { value: 'ticket_price', label: 'מחיר כרטיס' },
  { value: 'scan_status', label: 'סטטוס סריקה' },
  { value: 'purchase_date', label: 'תאריך רכישה' },
  { value: 'payment_method', label: 'אמצעי תשלום' },
  { value: 'salesperson', label: 'איש מכירות' },
  { value: 'skip', label: 'דלג על עמודה זו' },
]

export default function ImportModal({ isOpen, onClose, businessId, onImportDone }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [stats, setStats] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [errorCsvBase64, setErrorCsvBase64] = useState(null)
  const [duplicateFileWarning, setDuplicateFileWarning] = useState(null)
  const [inlineError, setInlineError] = useState(null)
  const [inlineWarning, setInlineWarning] = useState(null)
  const fileRef = useRef()

  const reset = () => {
    setStep(1)
    setFile(null)
    setPreview(null)
    setColumnMapping({})
    setStats(null)
    setResult(null)
    setErrorCsvBase64(null)
    setDuplicateFileWarning(null)
    setInlineError(null)
    setInlineWarning(null)
  }

  const handleClose = () => {
    reset()
    onClose?.()
  }

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(null)
  }

  const parseApiError = (text, fallback) => {
    try {
      const j = JSON.parse(text)
      return j?.error || fallback
    } catch {
      return (text && text.trim()) ? text : fallback
    }
  }

  const handleAnalyze = async () => {
    if (!file || !businessId) return
    setInlineError(null)
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('business_id', businessId)
      const res = await fetch(`${API_BASE}/api/admin/import/preview`, {
        method: 'POST',
        body: fd,
      })
      const text = await res.text()
      if (!res.ok) {
        setInlineError(parseApiError(text, 'שגיאה בניתוח הקובץ'))
        return
      }
      const data = JSON.parse(text)
      setPreview(data)
      setColumnMapping(data.suggested_mapping || {})
      setStep(2)
    } catch (err) {
      console.error(err)
      setInlineError(err.message || 'שגיאה בניתוח הקובץ')
    } finally {
      setImporting(false)
    }
  }

  const handleConfirm = async (forceReimport = false) => {
    if (!file || !businessId || !columnMapping) return
    setDuplicateFileWarning(null)
    setInlineError(null)
    setImporting(true)
    try {
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      const chunkSize = 8192
      let binary = ''
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
      }
      const base64 = btoa(binary)
      const res = await fetch(`${API_BASE}/api/admin/import/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          file_data: base64,
          column_mapping: columnMapping,
          filename: file.name,
          force_reimport: forceReimport,
        }),
      })
      const text = await res.text()
      let data = {}
      try { if (text) data = JSON.parse(text) } catch (_) {}
      if (res.status === 409 && data.already_imported) {
        setDuplicateFileWarning(data.error || 'הקובץ שהעלת כבר קיים במערכת')
        setImporting(false)
        return
      }
      if (!res.ok) {
        setInlineError(parseApiError(text, 'שגיאה בייבוא'))
        setImporting(false)
        return
      }
      setResult(data)
      setErrorCsvBase64(data.error_csv_base64 || null)
      setStep(4)
    } catch (err) {
      console.error(err)
      setInlineError(err.message || 'שגיאה בייבוא')
    } finally {
      setImporting(false)
    }
  }

  const downloadErrors = () => {
    if (!errorCsvBase64) return
    const bin = atob(errorCsvBase64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import_errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const suggestedKeys = preview ? Object.keys(preview.suggested_mapping || {}) : []
  const isAutoMapped = (col) => suggestedKeys.includes(col) && preview?.suggested_mapping?.[col] && preview.suggested_mapping[col] !== `custom_` + col

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
          maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
        dir="rtl"
      >
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 22, color: '#ffffff' }}>
              {step === 1 && 'ייבוא לקוחות'}
              {step === 2 && 'מפה את העמודות'}
              {step === 3 && 'תצוגה מקדימה לפני ייבוא'}
              {step === 4 && 'הייבוא הושלם'}
            </h2>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{
                  background: 'var(--v2-primary-glow)', border: '1px solid var(--v2-primary)', borderRadius: 'var(--radius-md)',
                  padding: 16, marginBottom: 20, fontSize: 14, lineHeight: 1.7, color: 'var(--v2-gray-300)',
                }}>
                  <div dangerouslySetInnerHTML={{
                    __html: 'הלקוחות שלך כבר כאן —<br/>פשוט תן להם לפגוש אותך מחדש<br/>העלה את הרשימה הקיימת ותוך דקות<br/>תוכל לשלוח קמפיין ממוקד לכולם.',
                  }} />
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--v2-primary)' }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--glass-border)'; handleFile(e.dataTransfer.files[0]) }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                >
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
                  <Upload size={40} style={{ color: 'var(--v2-primary)', margin: '0 auto 12px', display: 'block' }} />
                  <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>גרור קובץ לכאן או לחץ לבחירה</div>
                  <div style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}>תומך ב-CSV ו-Excel (.xlsx, .xls)</div>
                </div>
                {inlineError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: 14,
                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: 14,
                  }}>
                    <XCircle size={20} style={{ flexShrink: 0 }} />
                    {inlineError}
                  </div>
                )}
                {file && (
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} style={{ color: 'var(--v2-primary)' }} />
                      <span style={{ color: '#fff' }}>{file.name}</span>
                      <span style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={importing || !businessId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)',
                        border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: importing ? 'wait' : 'pointer',
                      }}
                    >
                      {importing ? 'מנתח...' : 'נתח קובץ'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && preview && (
              <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p style={{ color: 'var(--v2-gray-400)', marginBottom: 16 }}>וודא שהמערכת מבינה את הנתונים שלך</p>
                <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ textAlign: 'right', padding: 10, color: 'var(--v2-gray-400)', fontSize: 12 }}>עמודה בקובץ</th>
                        <th style={{ textAlign: 'right', padding: 10, color: 'var(--v2-gray-400)', fontSize: 12 }}>מיפוי ל</th>
                        <th style={{ textAlign: 'right', padding: 10, color: 'var(--v2-gray-400)', fontSize: 12 }}>דוגמה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.columns.map(col => (
                        <tr key={col} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: 10, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {col}
                            {preview.suggested_mapping?.[col] && preview.suggested_mapping[col] !== 'skip' && !String(preview.suggested_mapping[col] || '').startsWith('custom_') && (
                              <span style={{ fontSize: 11, color: 'var(--v2-primary)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                <Check size={12} /> זוהה אוטומטית
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 10 }}>
                            <select
                              value={columnMapping[col] || 'skip'}
                              onChange={e => setColumnMapping(m => ({ ...m, [col]: e.target.value }))}
                              style={{
                                width: '100%', padding: '8px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 13,
                              }}
                            >
                              {MAP_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: 10, color: 'var(--v2-gray-400)', fontSize: 13 }}>
                            {preview.preview_rows?.[0]?.[col] ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginBottom: 20, fontSize: 14, color: 'var(--v2-gray-400)' }}>
                  <div>נמצאו {preview.stats?.total ?? 0} שורות</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span style={{ color: 'var(--v2-primary)' }}>{preview.stats?.valid_phones ?? 0} טלפונים תקינים</span>
                    <span style={{ color: '#EF4444' }}>{preview.stats?.invalid_phones ?? 0} טלפונים שגויים</span>
                  </div>
                </div>
                <button
                  onClick={() => { setStats(preview); setStep(3) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--v2-primary)', color: 'var(--v2-dark)',
                    border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  המשך לתצוגה מקדימה
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 3 && preview && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-primary)' }}>{preview.stats?.valid_phones ?? 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>יעובדו (תקינים)</div>
                  </div>
                  <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>{preview.stats?.total ?? 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>סה"כ שורות</div>
                  </div>
                  <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444' }}>{preview.stats?.invalid_phones ?? 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>שגויים</div>
                  </div>
                </div>
                {preview.preview_rows?.length > 0 && (
                  <div style={{ overflowX: 'auto', marginBottom: 20, maxHeight: 180, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          {preview.columns.slice(0, 5).map(c => (
                            <th key={c} style={{ textAlign: 'right', padding: 8, color: 'var(--v2-gray-400)' }}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview_rows.slice(0, 5).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            {preview.columns.slice(0, 5).map(c => (
                              <td key={c} style={{ padding: 8, color: '#fff' }}>{row[c] ?? '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {(preview.stats?.invalid_phones ?? 0) > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: 14,
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: 'var(--radius-md)', color: '#f59e0b', fontSize: 14,
                  }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    יש {preview.stats?.invalid_phones} שורות עם טלפון לא תקין — יופעו קובץ שגויים לאחר הייבוא
                  </div>
                )}
                {inlineError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: 14,
                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: 14,
                  }}>
                    <XCircle size={20} style={{ flexShrink: 0 }} />
                    {inlineError}
                  </div>
                )}
                {duplicateFileWarning && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, padding: 16,
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: 'var(--radius-md)', color: '#f59e0b', fontSize: 14,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                      {duplicateFileWarning}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleConfirm(true)}
                        disabled={importing}
                        style={{
                          padding: '10px 20px', background: '#F59E0B', color: '#000',
                          border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: importing ? 'wait' : 'pointer',
                        }}
                      >
                        {importing ? 'מייבא...' : 'המשך בכל זאת'}
                      </button>
                      <button
                        onClick={() => setDuplicateFileWarning(null)}
                        style={{
                          padding: '10px 20px', background: 'transparent', color: '#F59E0B',
                          border: '1px solid #F59E0B', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      padding: '12px 24px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-full)', color: '#fff', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    חזור לעריכה
                  </button>
                  <button
                    onClick={() => handleConfirm(false)}
                    disabled={importing}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px 24px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none',
                      borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: 16, cursor: importing ? 'wait' : 'pointer',
                    }}
                  >
                    {importing ? 'מייבא...' : 'ייבא עכשיו'}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && result && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: 14,
                  background: 'var(--primary-dim, rgba(0,195,122,0.12))', border: '1px solid var(--v2-primary)',
                  borderRadius: 'var(--radius-md)', color: 'var(--v2-primary)', fontSize: 14,
                }}>
                  <Check size={20} style={{ flexShrink: 0 }} />
                  הקובץ יובא בהצלחה
                </div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>הייבוא הושלם</h3>
                  <p style={{ color: 'var(--v2-gray-400)' }}>{result.new_rows} לקוחות חדשים נוספו</p>
                  <p style={{ color: 'var(--v2-gray-400)' }}>{result.updated_rows} לקוחות עודכנו</p>
                  {(result.duplicate_rows ?? 0) > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: 12,
                      background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: 'var(--radius-md)', color: '#f59e0b', fontSize: 14,
                    }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                      {result.duplicate_rows} שורות כפולות דולגו
                    </div>
                  )}
                  {result.error_rows > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: 12,
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: 14,
                    }}>
                      <XCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{result.error_rows} שורות לא יובאו</span>
                      <button
                        onClick={downloadErrors}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8,
                          padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
                          borderRadius: 'var(--radius-md)', color: '#ef4444', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <Download size={16} /> הורד קובץ שגויים
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { onImportDone?.(); handleClose(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 24px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none',
                    borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                  }}
                >
                  סגור וצור קמפיין
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
