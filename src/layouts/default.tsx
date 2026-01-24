import { If } from '@hairy/react-lib'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from 'valtio-define'
import { Navbar } from '@/layouts/components/navbar'
import { Sidebar } from '@/layouts/components/sidebar'
import { Initiator } from './components/initiator'
import { Main } from './components/main'

export interface DefaultLayoutProps {
  title?: string
  children: React.ReactNode
  classNames?: {
    root?: string
    main?: string
  }
}

export function DefaultLayout(props: DefaultLayoutProps) {
  const { initialized } = useStore(store.user)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={initialized ? 'layout' : 'initiator'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
      >
        <If cond={true} else={<Initiator />}>
          <div className={clsx('relative flex min-h-screen', props.classNames?.root)}>
            <Sidebar />
            <div className="flex flex-col flex-1">
              <Navbar />
              <Main className={props.classNames?.main}>
                {props.children}
              </Main>
            </div>
          </div>
        </If>
      </motion.div>
    </AnimatePresence>
  )
}
