import { addToast, Tooltip } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { store } from '@/store'

export interface OptimizeReportButtonProps {
  reportId: string
  text: string
  isStreaming?: boolean
}

export function OptimizeReportButton({
  reportId,
  text,
  isStreaming = false,
}: OptimizeReportButtonProps) {
  const queryClient = useQueryClient()
  const [optimizeOpen, setOptimizeOpen] = useState(false)
  const [optimizeInstruction, setOptimizeInstruction] = useState('')
  const optimizeInputRef = useRef<HTMLInputElement>(null)

  const optimizeMutation = useMutation({
    mutationFn: async (userInstruction?: string) => {
      if (!reportId || !text)
        return
      await store.report.optimize(reportId, text, userInstruction)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['report', reportId] }),
      ])
      store.report.resetStream()
    },
    onError: (err: Error) => {
      addToast({ title: '优化失败', description: err.message, color: 'danger' })
    },
  })

  function handleIconClick() {
    if (!optimizeOpen) {
      setOptimizeOpen(true)
      requestAnimationFrame(() => optimizeInputRef.current?.focus())
    }
  }

  function handleOptimizeKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setOptimizeOpen(false)
      optimizeMutation.mutate(optimizeInstruction || undefined)
      setOptimizeInstruction('')
    }
    if (e.key === 'Escape') {
      setOptimizeOpen(false)
      setOptimizeInstruction('')
    }
  }

  return (
    <Tooltip content="优化日报" isDisabled={optimizeOpen}>
      <motion.div
        className={clsx(
          'relative h-10 rounded-full overflow-hidden',
          optimizeOpen && '!bg-default-100',
        )}
        animate={{ width: optimizeOpen ? 240 : 40 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <AnimatePresence>
          {optimizeOpen && (
            <motion.input
              ref={optimizeInputRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.1 }}
              value={optimizeInstruction}
              onChange={e => setOptimizeInstruction(e.target.value)}
              onKeyDown={handleOptimizeKeyDown}
              onBlur={() => {
                // 延迟到下一 tick，避免 blur 早于 button click 导致点击无效
                setTimeout(() => {
                  if (!optimizeMutation.isPending) {
                    setOptimizeOpen(false)
                    setOptimizeInstruction('')
                  }
                }, 0)
              }}
              placeholder="优化要求（可选），回车确认"
              className="absolute inset-0 pr-10 pl-3 text-sm bg-transparent outline-none placeholder:text-default-400"
            />
          )}
        </AnimatePresence>
        <button
          type="button"
          className={clsx(
            'absolute right-0 top-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors',
            optimizeOpen
              ? 'pointer-events-none'
              : 'hover:bg-default-200 cursor-pointer disabled:opacity-50',
          )}
          onClick={handleIconClick}
          disabled={!optimizeOpen && (isStreaming || !reportId || !text)}
        >
          <Icon icon="lucide:sparkles" className="w-4 h-4" />
        </button>
      </motion.div>
    </Tooltip>
  )
}
