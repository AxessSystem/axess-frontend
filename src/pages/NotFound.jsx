import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-200 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black text-gradient-wa mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">הדף לא נמצא</h1>
        <p className="text-muted mb-8">הכתובת שביקשת אינה קיימת במערכת.</p>
        <Link to="/" className="btn-primary">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
