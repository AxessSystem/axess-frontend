import { Hotel, QrCode, MessageSquare, TrendingUp, Users, Zap, BarChart3 } from 'lucide-react'
import IndustryPage from './IndustryPage'

export default function Hotels() {
  return (
    <IndustryPage
      name="בתי מלון"
      slug="hotels"
      icon={Hotel}
      heroTitle="חווית אורח דיגיטלית — מהזמנה עד צ'ק-אאוט"
      heroSubtitle="צ'ק-אין ללא תורים, Room Service ב-SMS, וחיסכון בעמלות בוקינג — הכל מתוך מערכת אחת."
      heroGradient="linear-gradient(135deg, #080C14 0%, #0A1020 50%, #080C14 100%)"
      accentColor="#6366F1"
      features={[
        {
          icon: QrCode,
          title: "צ'ק-אין דיגיטלי ללא תורים",
          desc: "האורח מקבל SMS לפני ההגעה. ממלא פרטים, מקבל QR. בכניסה — סריקה ישירה לחדר.",
        },
        {
          icon: MessageSquare,
          title: 'כרטיס אורח עם פרטי חדר',
          desc: 'מספר חדר, קוד WiFi, שעות ארוחת בוקר — הכל ב-SMS אחד שנשלח אוטומטית.',
        },
        {
          icon: Zap,
          title: 'Room Service דרך SMS',
          desc: 'אורח שולח SMS → מקבל תפריט → מזמין. ללא אפליקציה, ללא שיחת טלפון.',
        },
        {
          icon: TrendingUp,
          title: 'חיסכון עמלות בוקינג',
          desc: 'שלח SMS לאורחים קודמים עם הצעה להזמין ישירות. חסוך 15-20% עמלת פלטפורמה.',
        },
        {
          icon: Users,
          title: 'Upsell שדרוג חדר / ארוחות',
          desc: '24 שעות לפני ההגעה — הצע שדרוג חדר ב-₪150. שיעור המרה: 22% בממוצע.',
        },
        {
          icon: BarChart3,
          title: 'ניתוח שביעות רצון',
          desc: 'SMS אוטומטי אחרי צ\'ק-אאוט עם קישור לסקר קצר. בנה מאגר ביקורות אמיתיות.',
        },
      ]}
      roiStats={[
        { value: '22%', label: 'המרת Upsell', sub: 'שדרוג חדר ב-24 שעות לפני ההגעה' },
        { value: '-18%', label: 'חיסכון בעמלות', sub: 'הזמנות ישירות במקום בוקינג.קום' },
        { value: '4.8★', label: 'ממוצע ביקורות', sub: 'לאחר הטמעת SMS post-stay' },
      ]}
      validatorTitle="כרטיס אורח דיגיטלי"
      validatorDesc="האורח מקבל SMS עם כל פרטי השהייה — מספר חדר, WiFi, שירותים. ללא דלפק, ללא המתנה."
    />
  )
}
