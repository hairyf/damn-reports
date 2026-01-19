import { Progress } from '@heroui/react'
import { Loader2 } from 'lucide-react'

interface StepStatusProps {
  icon: React.ReactNode
  title: string
  description: string
  progress: number
  loading?: boolean
}

export function StepStatus({ icon, title, description, progress, loading }: StepStatusProps) {
  return (
    <div className="p-8 text-center flex flex-col items-center w-full">
      <div className="mb-6">
        <div className="p-5 rounded-full dark:bg-foreground/10 bg-foreground/5">
          {icon}
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-2 tracking-tight">{title}</h2>
      <p className="mb-8 max-w-sm mx-auto text-foreground/50">{description}</p>

      <Progress
        classNames={{
          base: 'max-w-md mb-4',
          track: 'drop-shadow-md',
          indicator: 'bg-linear-to-r from-blue-500 to-blue-200',
          label: 'tracking-wider font-medium text-default-600',
          value: 'text-foreground/60',
        }}
        size="sm"
        value={progress}
        aria-label={`${title} 进度: ${progress}%`}
      />

      {loading && (
        <div className="flex items-center text-xs font-mono text-foreground/40">
          <Loader2 className="animate-spin mr-2" size={14} />
          PROCESSING...
        </div>
      )}
    </div>
  )
}
