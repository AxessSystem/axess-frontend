import { Dumbbell, QrCode, MessageSquare, TrendingUp, Users, Zap, BarChart3 } from 'lucide-react'
import IndustryPage from './IndustryPage'

export default function Gyms() {
  return (
    <IndustryPage
      name="חדרי כושר ואולפנים"
      slug="gyms"
      icon={Dumbbell}
      heroTitle="שמור על חברים. מנע נטישה."
      heroSubtitle="כרטיסייה דיגיטלית, תזכורת חידוש מנוי, והרשמה לשיעורים ב-SMS — ללא אפליקציה."
      heroGradient="linear-gradient(135deg, #080C14 0%, #0A1008 50%, #080C14 100%)"
      accentColor="var(--v2-primary)"
      features={[
        {
          icon: QrCode,
          title: 'כרטיסייה דיגיטלית בסמארטפון',
          desc: 'כל כניסה נסרקת ב-QR. חבר רואה כמה כניסות נותרו, ניהול מלא ללא כרטיסים פיזיים.',
        },
        {
          icon: MessageSquare,
          title: 'תזכורת חידוש מנוי 7 ימים לפני',
          desc: 'SMS אוטומטי עם קישור לחידוש. הפחתת נטישה ב-40% בממוצע.',
        },
        {
          icon: Users,
          title: 'הרשמה לשיעורים ב-SMS',
          desc: 'חבר שולח SMS → נרשם לשיעור. קבל אישור + תזכורת שעה לפני. ללא אפליקציה.',
        },
        {
          icon: Zap,
          title: 'אתגרים שבועיים + gamification',
          desc: 'שלח אתגר שבועי לכל החברים. מי שמגיע 4 פעמים מקבל הטבה. מעורבות ×2.',
        },
        {
          icon: TrendingUp,
          title: 'דוח נוכחות אוטומטי',
          desc: 'ראה מי מגיע, מי לא, ומי בסכנת נטישה. שלח SMS ממוקד לחברים לא פעילים.',
        },
        {
          icon: BarChart3,
          title: 'ניתוח שעות עומס',
          desc: 'מתי הכי עמוס? מתי יש מקום? שלח SMS לחברים להגיע בשעות שקטות. שיפור חוויה.',
        },
      ]}
      roiStats={[
        { value: '-40%', label: 'נטישת מנויים', sub: 'לאחר הטמעת SMS חידוש' },
        { value: '×2', label: 'מעורבות חברים', sub: 'אתגרים שבועיים + gamification' },
        { value: '85%', label: 'שביעות רצון', sub: 'ממוצע בסקרי SMS post-visit' },
      ]}
      validatorTitle="כרטיסייה דיגיטלית"
      validatorDesc="כל כניסה נסרקת ב-QR. חבר רואה יתרת כניסות, מנהל הכושר רואה נוכחות — הכל בזמן אמת."
    />
  )
}
