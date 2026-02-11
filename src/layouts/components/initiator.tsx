import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { StepDeepSeekApiKey } from '@/components/step-deepseek-api-key'
import { Main } from './main'
import { Navbar } from './navbar'

export function Initiator() {
  return (
    <div className={clsx('relative flex min-h-screen border-none')}>
      <div className="flex flex-col flex-1">
        <Navbar />
        <Main className="flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              className="w-full max-w-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <StepDeepSeekApiKey />
            </motion.div>
          </AnimatePresence>
        </Main>
      </div>
    </div>
  )
}
