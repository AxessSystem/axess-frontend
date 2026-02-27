import { useState } from 'react'

const WHATSAPP_NUMBER = '972586829494' // AXESS WhatsApp number

export default function Terms() {
  const [accepted, setAccepted] = useState(false)

  function handleAccept() {
    setAccepted(true)
    const msg = encodeURIComponent('מאשר')
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  function handleDecline() {
    const msg = encodeURIComponent('דוחה')
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-black font-bold text-sm">A</div>
        <span className="font-bold text-lg tracking-wide">AXESS</span>
        <span className="text-white/40 text-sm mr-auto">פלטפורמת SMS מרקטינג</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">תנאי שימוש</h1>
        <p className="text-white/50 text-sm mb-10">עדכון אחרון: פברואר 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. כללי</h2>
            <p>
              AXESS היא פלטפורמת שיווק SMS המאפשרת לעסקים לשלוח הודעות SMS לנמענים שנתנו הסכמתם לקבל אותן.
              השימוש בפלטפורמה מהווה הסכמה לתנאים אלה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. הגדרות</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>"הפלטפורמה"</strong> — שירות AXESS לשיווק SMS</li>
              <li><strong>"לקוח"</strong> — עסק הנרשם לפלטפורמה</li>
              <li><strong>"נמען"</strong> — אדם שמספר הטלפון שלו נכלל ברשימת שליחה</li>
              <li><strong>"קמפיין"</strong> — שליחת הודעת SMS לרשימת נמענים</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. תנאי שימוש מותר</h2>
            <p className="mb-3">הלקוח מתחייב כי:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>כל הנמענים נתנו הסכמה מפורשת לקבל הודעות SMS שיווקיות</li>
              <li>ההודעות לא יכילו תוכן פוגעני, מטעה, בלתי חוקי או ספאם</li>
              <li>תכובד בקשת הסרה (STOP) מכל נמען</li>
              <li>לא ישלחו הודעות בין 22:00 ל-08:00</li>
              <li>הלקוח אחראי לעמידה בחוק התקשורת (בזק ושידורים), תשמ"ב-1982</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. תשלום וחיוב</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>מינימום רכישה: 1,500 הודעות (₪120)</li>
              <li>התשלום מראש — אין החזרים על קרדיט שנרכש</li>
              <li>מחיר לפי מדרגות כמות — ראה טבלת מחירים</li>
              <li>חשבוניות מס יישלחו לפי בחירת הלקוח (מייל / וואטסאפ)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. שם שולח (Sender ID)</h2>
            <p>
              שם השולח חייב לעמוד בדרישות ספק ה-SMS (TextMe). AXESS שומרת לעצמה את הזכות לדחות שמות
              שאינם עומדים בדרישות. אישור שם השולח עשוי לקחת עד 48 שעות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. אחריות</h2>
            <p>
              AXESS אינה אחראית לתוכן ההודעות שנשלחות על ידי הלקוחות. הלקוח נושא באחריות המלאה
              לעמידה בכל הדינים החלים על שיווק ישיר ב-SMS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. הפסקת שירות</h2>
            <p>
              AXESS רשאית להשעות או לסיים חשבון לקוח שהפר את תנאי השימוש, ללא החזר כספי.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. פרטיות</h2>
            <p>
              מדיניות הפרטיות המלאה זמינה ב-<a href="/privacy" className="text-[#25D366] hover:underline">/privacy</a>.
              AXESS לא תמכור מידע על לקוחות לצדדים שלישיים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. שינויים בתנאים</h2>
            <p>
              AXESS רשאית לעדכן תנאים אלה בכל עת. המשך השימוש לאחר עדכון מהווה הסכמה לתנאים החדשים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. יצירת קשר</h2>
            <p>
              לכל שאלה: <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-[#25D366] hover:underline" target="_blank" rel="noreferrer">WhatsApp</a>
            </p>
          </section>
        </div>

        {/* CTA Buttons */}
        <div className="mt-14 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAccept}
            disabled={accepted}
            className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-black font-bold py-4 px-8 rounded-xl text-lg transition-colors"
          >
            {accepted ? '✅ אישרת את התנאים' : '✅ מאשר תנאי שימוש'}
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium py-4 px-8 rounded-xl text-lg transition-colors"
          >
            דחה
          </button>
        </div>
        <p className="text-white/30 text-xs mt-4 text-center">
          לחיצה על "מאשר" תפתח שיחת WhatsApp ותשלח אישור אוטומטי
        </p>
      </main>
    </div>
  )
}
