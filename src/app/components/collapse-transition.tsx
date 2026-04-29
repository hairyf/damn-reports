import type { DelHTMLAttributes, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export interface CollapseTransitionProps extends DelHTMLAttributes<HTMLDivElement> {
  visible: boolean
  children: ReactNode
}
export function CollapseTransition({ visible, children, ...attrs }: CollapseTransitionProps) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          {...attrs as any}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
