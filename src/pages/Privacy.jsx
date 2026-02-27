export default function Privacy() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-black font-bold text-sm">A</div>
        <span className="font-bold text-lg tracking-wide">AXESS</span>
        <span className="text-white/40 text-sm mr-auto">פלטפורמת SMS מרקטינג</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">מדיניות פרטיות</h1>
        <p className="text-white/50 text-sm mb-10">עדכון אחרון: פברואר 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. מידע שאנו אוספים</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>פרטי עסק: שם, כתובת, ח.פ/ע.מ, מייל, טלפון</li>
              <li>פרטי איש קשר: שם, תפקיד</li>
              <li>נתוני שימוש: קמפיינים שנשלחו, קליקים, תשובות</li>
              <li>רשימות נמענים שהועלו על ידי הלקוח</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. שימוש במידע</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>מתן השירות — שליחת SMS, דוחות, חשבוניות</li>
              <li>תמיכה ושירות לקוחות</li>
              <li>שיפור הפלטפורמה (נתונים אנונימיים בלבד)</li>
              <li>עמידה בדרישות חוקיות</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. שיתוף מידע</h2>
            <p className="mb-3">AXESS לא מוכרת מידע אישי. מידע משותף רק עם:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>ספק SMS (TextMe) — לצורך שליחת הודעות בלבד</li>
              <li>Supabase — אחסון נתונים מאובטח</li>
              <li>רשויות חוק — בהתאם לדרישה חוקית</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. אבטחת מידע</h2>
            <p>
              כל הנתונים מאוחסנים בצורה מוצפנת. גישה לנתונים מוגבלת לצוות AXESS בלבד.
              אנו משתמשים ב-HTTPS לכל התקשורת.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. זכויות המשתמש</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>עיון במידע האישי השמור עליך</li>
              <li>תיקון מידע שגוי</li>
              <li>מחיקת חשבון ונתונים</li>
              <li>קבלת עותק של הנתונים</li>
            </ul>
            <p className="mt-3">לבקשות פנה אלינו ב-WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. עוגיות (Cookies)</h2>
            <p>
              הפלטפורמה משתמשת בעוגיות הכרחיות לצורך אימות משתמשים בלבד. אין שימוש בעוגיות פרסומיות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. שמירת מידע</h2>
            <p>
              נתוני קמפיינים נשמרים למשך 3 שנים. נתוני נמענים נשמרים כל עוד החשבון פעיל.
              לאחר סגירת חשבון — מחיקה תוך 90 יום.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. יצירת קשר</h2>
            <p>
              ממונה הגנת פרטיות: <a href="https://wa.me/972586829494" className="text-[#25D366] hover:underline" target="_blank" rel="noreferrer">WhatsApp</a>
            </p>
          </section>
        </div>

        <div className="mt-12">
          <a
            href="/terms"
            className="inline-block border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            ← חזרה לתנאי שימוש
          </a>
        </div>
      </main>
    </div>
  )
}
