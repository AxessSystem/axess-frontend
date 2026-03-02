import { ShoppingBag, TrendingUp, Users, Zap, MessageSquare, QrCode, BarChart3 } from 'lucide-react'
import IndustryPage from './IndustryPage'

export default function Retail() {
  return (
    <IndustryPage
      name="חנויות וקמעונאות"
      slug="retail"
      icon={ShoppingBag}
      heroTitle="כל קונה — לקוח חוזר"
      heroSubtitle="קופונים ממוקדים לפי רכישות, מועדון לקוחות דיגיטלי, ו-Back in Stock אוטומטי — הכל ב-SMS."
      heroGradient="linear-gradient(135deg, #080C14 0%, #0A0C10 50%, #080C14 100%)"
      accentColor="var(--v2-primary)"
      features={[
        {
          icon: MessageSquare,
          title: 'קופונים ממוקדים לפי רכישות',
          desc: 'לקוח שקנה נעליים מקבל SMS עם 15% על גרביים. רלוונטיות = המרה גבוהה.',
        },
        {
          icon: Zap,
          title: 'Back in Stock אוטומטי',
          desc: 'מוצר חזר למלאי → SMS אוטומטי לכל מי שהתעניין. שיעור המרה: 34%.',
        },
        {
          icon: QrCode,
          title: 'מועדון לקוחות דיגיטלי',
          desc: 'כרטיס חבר ב-SMS. נקודות, הטבות, סטטוס — ללא אפליקציה, ללא הרשמה מסובכת.',
        },
        {
          icon: Users,
          title: 'סגמנטציה חכמה לפי היסטוריה',
          desc: 'שלח הצעות שונות ללקוחות VIP, לחדשים, ולנוטשים. כל קהל — מסר מדויק.',
        },
        {
          icon: TrendingUp,
          title: 'יומולדת + הטבה אוטומטית',
          desc: 'SMS אוטומטי ביום ההולדת עם קופון מיוחד. שיעור מימוש: 41% בממוצע.',
        },
        {
          icon: BarChart3,
          title: 'ניתוח ביצועי קמפיינים',
          desc: 'ראה מה עבד, מה לא, ומה ה-ROI של כל קמפיין. קבל החלטות מבוססות נתונים.',
        },
      ]}
      roiStats={[
        { value: '34%', label: 'Back in Stock', sub: 'המרה ממוצעת לאחר SMS' },
        { value: '41%', label: 'מימוש יומולדת', sub: 'קופון אוטומטי ביום ההולדת' },
        { value: '×3.2', label: 'ROI ממוצע', sub: 'על כל ₪1 שהושקע בקמפיין' },
      ]}
      validatorTitle="קופון דיגיטלי לחנות"
      validatorDesc="לקוח מקבל SMS עם קופון ייחודי. בקופה — מציג, קופאי סורק, מומש. מדידה מדויקת של כל מימוש."
    />
  )
}
