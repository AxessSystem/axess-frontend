import { Utensils, Users, QrCode, MessageSquare, TrendingUp, Zap, BarChart3 } from 'lucide-react'
import IndustryPage from './IndustryPage'

export default function Restaurants() {
  return (
    <IndustryPage
      name="מסעדות וברים"
      slug="restaurants"
      icon={Utensils}
      heroTitle="מלא שולחנות. החזר לקוחות. הגדל טיפ."
      heroSubtitle="ניהול רשימת המתנה חכמה, זיהוי VIP אוטומטי, ותפריט דיגיטלי — הכל ב-SMS אחד."
      heroGradient="linear-gradient(135deg, #080C14 0%, #100A08 50%, #080C14 100%)"
      accentColor="#F59E0B"
      features={[
        {
          icon: Users,
          title: 'ניהול רשימת המתנה חכמה',
          desc: 'לקוח נרשם ב-SMS, מקבל עדכון כשהשולחן מוכן. ללא אפליקציה, ללא ביזבוז זמן.',
        },
        {
          icon: TrendingUp,
          title: 'זיהוי VIP אוטומטי',
          desc: 'לקוח שביקר 5+ פעמים מקבל SMS עם "שמרנו לך שולחן". נאמנות שמרגישים.',
        },
        {
          icon: QrCode,
          title: 'תפריט דיגיטלי בQR',
          desc: 'QR על השולחן → תפריט מלא בסמארטפון. עדכון מחירים בלחיצה, ללא הדפסות.',
        },
        {
          icon: MessageSquare,
          title: 'קריאה למלצר / חשבון ב-SMS',
          desc: 'לקוח שולח SMS → מלצר מקבל התראה. שיפור חוויה + הגדלת טיפ ממוצע.',
        },
        {
          icon: Zap,
          title: 'החזרת לקוחות שלא ביקרו 30 יום',
          desc: 'SMS אוטומטי עם קופון 10% לכל מי שלא ביקר חודש. שיעור חזרה: 28%.',
        },
        {
          icon: BarChart3,
          title: 'ניתוח שעות עומס',
          desc: 'ראה מתי הכי עמוס, מי הלקוחות הנאמנים, ומה המנות הפופולריות — הכל בדשבורד.',
        },
      ]}
      roiStats={[
        { value: '28%', label: 'חזרת לקוחות', sub: 'אחרי SMS עם קופון 30 יום' },
        { value: '+₪45', label: 'טיפ ממוצע', sub: 'לאחר הטמעת SMS חוויה' },
        { value: '0 תורים', label: 'ניהול המתנה', sub: 'SMS אוטומטי לכל הרשימה' },
      ]}
      validatorTitle="קופון דיגיטלי למסעדה"
      validatorDesc="לקוח מקבל SMS עם קופון ייחודי. בהגעה — מציג, מלצר סורק, מומש. ללא נייר, ללא טעויות."
    />
  )
}
