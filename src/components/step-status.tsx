import type { ProgressProps } from '@heroui/react'
import { Progress } from '@heroui/react'
import { Icon } from '@iconify/react'

interface StepStatusProps {
  icon: React.ReactNode
  title: string
  description: string
  extra?: React.ReactNode
  progress: number
  loading?: boolean
  progressProps?: ProgressProps
}

export function StepStatus({ icon, title, description, extra, progress, loading, progressProps }: StepStatusProps) {
  return (
    <div className="p-8 text-center flex flex-col items-center w-full max-w-xl">
      <div className="mb-6">
        <div className="p-5 rounded-full dark:bg-foreground/10 bg-foreground/5">
          {icon}
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-2 tracking-tight">{title}</h2>
      <p className="mb-8 max-w-sm mx-auto text-foreground/50">{description}</p>

      <Progress
        classNames={{
          base: 'mb-4',
          track: 'drop-shadow-md',
          indicator: 'bg-linear-to-r from-primary-500 to-primary-200',
          label: 'tracking-wider font-medium text-default-600',
          value: 'text-foreground/60',
        }}
        size="sm"
        value={progress}
        aria-label={`${title} 进度: ${progress}%`}
        {...progressProps}
      />

      {extra}

      {loading && (
        <div className="flex items-center text-xs font-mono text-foreground/40">
          <Icon icon="lucide:loader-2" className="animate-spin mr-2 w-3.5 h-3.5" />
          PROCESSING...
        </div>
      )}
    </div>
  )
}
