export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-muted text-sm max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}
