import { Building2, Users, QrCode, MessageSquare, TrendingUp, Zap, BarChart3 } from 'lucide-react'
import IndustryPage from './IndustryPage'

export default function Organizations() {
  return (
    <IndustryPage
      name="ארגונים ורשויות"
      slug="organizations"
      icon={Building2}
      heroTitle="תקשורת ממוקדת. מדידה מדויקת."
      heroSubtitle="שליחה לפי תפקיד, ועדה, או אזור. אישורי נוכחות, ניהול חברויות, וסקרים — הכל ב-SMS."
      heroGradient="linear-gradient(135deg, #080C14 0%, #08100A 50%, #080C14 100%)"
      accentColor="var(--v2-accent)"
      features={[
        {
          icon: Users,
          title: 'שליחה לפי תפקיד / ועדה / אזור',
          desc: 'סגמנטציה מדויקת — שלח לחברי ועדה ספציפית, לאזור גיאוגרפי, או לתפקיד מסוים.',
        },
        {
          icon: QrCode,
          title: 'אישורי נוכחות דיגיטליים',
          desc: 'כל משתתף מקבל SMS עם QR. בכניסה לאירוע — סריקה. דוח נוכחות מלא אוטומטי.',
        },
        {
          icon: MessageSquare,
          title: 'ניהול חברויות ותשלומים',
          desc: 'SMS אוטומטי לחידוש חברות, תזכורת תשלום, ואישור קבלה. ללא מזכירות ידנית.',
        },
        {
          icon: Zap,
          title: 'סקרים מהירים ב-SMS',
          desc: 'שלח סקר 3 שאלות לכל החברים. קבל תוצאות בזמן אמת. שיעור מענה: 45%.',
        },
        {
          icon: TrendingUp,
          title: 'דוח השתתפות מלא',
          desc: 'ראה מי השתתף, מי לא, ומה המגמות לאורך זמן. קבל החלטות מבוססות נתונים.',
        },
        {
          icon: BarChart3,
          title: 'ניהול אירועים ואסיפות',
          desc: 'שלח הזמנה, קבל אישורי הגעה, שלח תזכורת יום לפני. הכל אוטומטי.',
        },
      ]}
      roiStats={[
        { value: '45%', label: 'מענה לסקרים', sub: 'ממוצע בסקרי SMS' },
        { value: '-60%', label: 'עבודה מנהלית', sub: 'אוטומציה של תהליכים ידניים' },
        { value: '×3', label: 'מעורבות חברים', sub: 'לאחר הטמעת SMS תקשורת' },
      ]}
      validatorTitle="אישור נוכחות דיגיטלי"
      validatorDesc="כל משתתף מקבל SMS עם QR ייחודי. בכניסה לאירוע — סריקה אחת. דוח נוכחות מלא אוטומטי."
    />
  )
}
