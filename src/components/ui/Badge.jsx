export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-600 border border-gray-200',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-accent/10 text-accent border border-accent/20',
    warning: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
    danger: 'bg-red-50 text-red-500 border border-red-200',
    new: 'bg-primary text-white',
    pro: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    active: 'bg-accent/10 text-accent border border-accent/20',
    draft: 'bg-gray-100 text-gray-500 border border-gray-200',
    scheduled: 'bg-blue-50 text-blue-600 border border-blue-200',
    sent: 'bg-accent/10 text-accent border border-accent/20',
    failed: 'bg-red-50 text-red-500 border border-red-200',
  }

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant] || variants.default} ${sizes[size]}`}>
      {children}
    </span>
  )
}
