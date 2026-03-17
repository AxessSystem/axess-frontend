export default function AdminUsersPage() {
  return (
    <div dir="rtl" style={{ maxWidth: 1000 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>משתמשי מערכת — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        כאן תוצג רשימת משתמשי AXESS (צוות, Admins, תמיכה) עם הרשאות ותפקידים. כרגע זה placeholder בלבד.
      </p>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
        <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
          בשלב הבא נוסיף טבלת משתמשים, פילטרים לפי תפקיד והרשאות, וכלי ניהול הרשאות.
        </p>
      </div>
    </div>
  )
}

