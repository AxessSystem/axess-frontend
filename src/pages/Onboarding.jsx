import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Monitor, CheckCircle, ArrowLeft, Clock } from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972500000000'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

export default function Onboarding() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary">
          <span className="text-lg font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>A</span>
        </div>
        <span className="text-2xl font-black text-dark" style={{ fontFamily: 'Outfit, sans-serif' }}>AXESS</span>
      </Link>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white rounded-3xl shadow-card-hover p-8 lg:p-12">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  <div className="w-8 h-1.5 rounded-full bg-gray-200" />
                </div>
                <span className="text-gray-500 text-sm">שלב 1 מתוך 2</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-dark mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                איך תרצה להתחיל?
              </h1>
              <p className="text-gray-500 mb-10 text-lg">
                בחר את הדרך הנוחה לך להצטרף ל-AXESS
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                {/* WhatsApp option */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className="relative border-2 border-primary bg-primary/5 rounded-2xl p-6 text-right hover:shadow-glow-primary transition-all duration-200 cursor-pointer"
                >
                  {/* Recommended badge */}
                  <div className="absolute top-4 left-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                    הכי מהיר ✨
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle size={28} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    📱 דרך WhatsApp
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    תתחיל אונבורדינג ישירות מהסמארטפון שלך — מהיר, קל, ללא טפסים
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 text-primary font-semibold text-sm">
                    בחר אפשרות זו
                    <ArrowLeft size={16} />
                  </div>
                </motion.button>

                {/* Web option — coming soon */}
                <div className="relative border-2 border-gray-200 bg-gray-50 rounded-2xl p-6 text-right opacity-60 cursor-not-allowed">
                  <div className="absolute top-4 left-4 bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                    בקרוב
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Monitor size={28} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    💻 דרך האתר
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    ממשק ניהול מלא בדפדפן — כניסה עם פרטי עסק
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center text-gray-400 text-sm">
                כבר יש לך חשבון?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  כניסה למערכת
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white rounded-3xl shadow-card-hover p-8 lg:p-12">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-gray-500 text-sm">שלב 2 מתוך 2</span>
              </div>

              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={36} className="text-primary" />
                </div>
                <h2 className="text-3xl font-black text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  מה מצפה לך
                </h2>
                <p className="text-gray-500 text-lg">
                  תוך 3 דקות תהיה מוכן לשלוח קמפיין ראשון
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: '🏢', label: 'פרטי העסק', time: '2 דקות', color: 'bg-blue-50 border-blue-100' },
                  { icon: '📤', label: 'שם שולח SMS', time: '30 שניות', color: 'bg-purple-50 border-purple-100' },
                  { icon: '🚀', label: 'קמפיין ראשון', time: '1 דקה', color: 'bg-green-50 border-green-100' },
                ].map(({ icon, label, time, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${color}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-dark">{label}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Clock size={14} />
                      {time}
                    </div>
                    <CheckCircle size={18} className="text-accent flex-shrink-0" />
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-3 w-full bg-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-glow-primary"
              >
                <MessageCircle size={22} />
                בואו נתחיל ←
              </motion.a>

              <button
                onClick={() => setStep(1)}
                className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
              >
                ← חזור
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
