import { motion } from 'framer-motion'

export function CornerActions() {
  return (
    <motion.div layout className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <StepStatusChip />
      <UpdateStatus />
    </motion.div>
  )
}
