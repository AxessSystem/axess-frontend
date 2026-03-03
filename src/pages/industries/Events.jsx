import { Music, BarChart3, Users, Zap, QrCode, MessageSquare, TrendingUp, ShoppingCart } from 'lucide-react'
import IndustryPage from './IndustryPage'

export default function Events() {
  return (
    <IndustryPage
      name="אירועים ומסיבות"
      slug="events"
      icon={Music}
      heroTitle="ניהול אירועים חכם — מהכרטיס ועד הבר"
      heroSubtitle="שלח כרטיסי כניסה דיגיטליים, עקוב אחר מכירות בזמן אמת, ודחוף נוטשים לקנות לפני שיאחר."
      heroGradient="linear-gradient(135deg, #080C14 0%, #0F1020 50%, #0A0E18 100%)"
      accentColor="var(--v2-primary)"
      features={[
        {
          icon: ShoppingCart,
          title: 'דף מכירה ייחודי לכל אירוע',
          desc: 'לקוחות רוכשים ישירות — ללא עמלות חיצוניות.',
        },
        {
          icon: QrCode,
          title: 'כרטיסי כניסה דיגיטליים עם QR',
          desc: 'כל כרטיס מגיע ב-SMS עם QR ייחודי. סריקה בכניסה — ללא תורים, ללא נייר.',
        },
        {
          icon: Users,
          title: 'ניהול יחצ"נים ומכירות',
          desc: 'כל יחצ"ן מקבל קוד ייחודי. עקוב אחר מכירות כל אחד בנפרד בזמן אמת.',
        },
        {
          icon: Zap,
          title: 'דחיפה לנוטשים אוטומטית',
          desc: 'SMS אוטומטי ל-250 שגלשו בדף האירוע ולא קנו. שיעור המרה ממוצע: 18%.',
        },
        {
          icon: MessageSquare,
          title: 'Upsell בקבוקים בזמן האירוע',
          desc: 'שלח הצעה לרכישת בקבוק/שולחן לכל מי שנכנס. הכנסה נוספת ללא מאמץ.',
        },
        {
          icon: BarChart3,
          title: 'גרף מכירות בזמן אמת',
          desc: 'ראה כמה כרטיסים נמכרו, מי מכר, ומה הכנסה משוערת — הכל בדשבורד חי.',
        },
        {
          icon: TrendingUp,
          title: 'קמפיין החזרת לקוחות',
          desc: 'אחרי האירוע — שלח SMS לכל המשתתפים עם הזמנה לאירוע הבא. בניית קהל נאמן.',
        },
      ]}
      roiStats={[
        { value: '₪85', label: 'הוצאה ממוצעת לכרטיס', sub: 'ממוצע רכישה ישירה' },
        { value: '+35%', label: 'הכנסה נוספת', sub: 'מ-Upsell בקבוקים ושולחנות' },
        { value: '18%', label: 'המרת נוטשים', sub: 'ממוצע לאחר SMS אוטומטי' },
        { value: '3 דק׳', label: 'זמן הקמה', sub: 'מרישום ועד קמפיין חי' },
      ]}
      validatorTitle="כרטיס כניסה דיגיטלי"
      validatorDesc="כל אורח מקבל SMS עם כרטיס ייחודי. בכניסה — סריקה אחת. ללא תורים, ללא נייר, ללא בלבול."
    />
  )
}
