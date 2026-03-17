export default function AdminSystemPage() {
  return (
    <div dir="rtl" style={{ maxWidth: 1000 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>System Health — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        מסך סטטוס מערכת מרכזי (DB, Queues, Providers). כרגע מציג placeholder בלבד.
      </p>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
        <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
          בשלב הבא נוסיף כרטיסי סטטוס לכל רכיב מערכת, כולל זמני תגובה ו־uptime.
        </p>
      </div>
    </div>
  )
}

