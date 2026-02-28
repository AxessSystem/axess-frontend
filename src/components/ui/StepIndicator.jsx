import { Check } from 'lucide-react'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const idx = i + 1
        const isCompleted = idx < currentStep
        const isActive = idx === currentStep
        const isLast = i === steps.length - 1

        return (
          <div key={idx} className="flex items-center flex-1 min-w-0">
            {/* Step circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent text-white'
                    : isActive
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'bg-surface-50 text-muted border border-border'
                }`}
              >
                {isCompleted ? <Check size={16} /> : idx}
              </div>
              <div className={`text-xs mt-1.5 text-center whitespace-nowrap hidden sm:block ${
                isActive ? 'text-white font-medium' : isCompleted ? 'text-accent' : 'text-muted'
              }`}>
                {step}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                isCompleted ? 'bg-accent' : 'bg-border'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
