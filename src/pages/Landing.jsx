import { Link } from 'react-router-dom'
import { Zap, Shield, BarChart3, MessageCircle, Upload, Users, ChevronLeft, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'ניהול אירועים חכם',
    desc: 'יצירה ועריכת אירועים, העלאת CSV מ-GoOut, מעקב בזמן אמת.',
  },
  {
    icon: Shield,
    title: 'אבטחה עם RLS',
    desc: 'כל מפיק רואה רק את הנתונים שלו — Row Level Security ב-Supabase.',
  },
  {
    icon: MessageCircle,
    title: 'שיווק ב-WhatsApp',
    desc: 'הכנה ושליחת הודעות שיווק מותאמות אישית לכל קהל יעד.',
  },
  {
    icon: BarChart3,
    title: 'דוחות ועמלות',
    desc: 'מעקב מלא אחר מכירות, עמלות Axess, ולידים שהוכנסו.',
  },
  {
    icon: Upload,
    title: 'ייבוא CSV/Excel',
    desc: 'ייבוא עסקאות מ-GoOut בלחיצה, עם עיבוד ומיפוי אוטומטי.',
  },
  {
    icon: Users,
    title: 'ניהול קהל',
    desc: 'מאגר קהל מרכזי עם תיוג חכם, חיפוש, ופרופיל מלא לכל משתמש.',
  },
]

const stats = [
  { value: '∞', label: 'אירועים' },
  { value: '100%', label: 'בידוד נתונים' },
  { value: 'Real-time', label: 'עדכונים' },
  { value: '10%', label: 'עמלת Axess' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-dark" dir="rtl">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-wa flex items-center justify-center glow-wa">
              <span className="text-sm font-black text-white">A</span>
            </div>
            <span className="text-lg font-black text-gradient-wa">AXESS</span>
          </div>
          <Link to="/login" className="btn-primary text-sm px-5 py-2">
            כניסה למערכת
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-wa/10 border border-wa/20 text-wa text-sm font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-wa animate-pulse" />
          Event OS & Marketing Engine
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          ניהול אירועים{' '}
          <span className="text-gradient-wa">חכם</span>
          {' '}ומרכזי
        </h1>

        <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Axess מאחד ניהול קהל, עסקאות, צ'ק-אין, שולחנות ושיווק WhatsApp
          בממשק אחד — לאדמינים ולמפיקים.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/login" className="btn-primary text-base px-8 py-3 text-lg">
            התחל עכשיו
            <ChevronLeft size={20} />
          </Link>
          <a
            href="#features"
            className="btn-secondary text-base px-8 py-3"
          >
            גלה יותר
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
          {stats.map(({ value, label }) => (
            <div key={label} className="card text-center py-6">
              <div className="text-3xl font-black text-gradient-wa mb-1">{value}</div>
              <div className="text-sm text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">כלים לאדמין ולמפיק</h2>
          <p className="text-muted">הכל במקום אחד, מאובטח ומבודד לפי הרשאות</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-hover group">
              <div className="w-10 h-10 rounded-xl bg-wa/10 flex items-center justify-center mb-4 group-hover:bg-wa/20 transition-colors">
                <Icon size={20} className="text-wa" />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="card border-wa/20 text-center py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-wa/5 to-transparent pointer-events-none" />
          <h2 className="text-3xl font-black text-white mb-4 relative z-10">
            מוכן להתחיל?
          </h2>
          <p className="text-muted mb-8 relative z-10">
            כנס עם פרטי הגישה שלך ונהל את האירועים שלך בצורה חכמה יותר.
          </p>
          <Link to="/login" className="btn-primary text-base px-10 py-3 relative z-10">
            כניסה למערכת
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
        <p className="text-muted text-sm">
          © 2025 Axess — Event OS. בנוי עם ❤️ ו-WhatsApp.
        </p>
      </footer>
    </div>
  )
}
