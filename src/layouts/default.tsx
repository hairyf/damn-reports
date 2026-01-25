import { If, useWhenever } from '@hairy/react-lib'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from 'valtio-define'
import { Navbar } from '@/layouts/components/navbar'
import { Sidebar } from '@/layouts/components/sidebar'
import { Initiator } from './components/initiator'
import { Installer } from './components/installer'
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
  const { ready } = useStore(store.user)
  const { installed, ininitialized } = useStore(store.setting)

  const isNeedInitiator = !installed || (!ready && !ininitialized)
  function render(content: React.ReactNode) {
    if (!installed)
      return <Installer />
    // 如果已经初始化过了，后台静默运行
    if (isNeedInitiator)
      return <Initiator />
    return content
  }

  // 如果未安装或未初始化，则重置用户状态，避免阻塞启动
  useWhenever(!installed || !ininitialized, () => {
    store.user.$patch({
      n8nDefaultAccountLoginEnabled: true,
      credentialName: null,
      info: null,
      credential: null,
      workflow: null,
      workspace: null,
      deepseekSkip: false,
      n8nEmail: '',
      n8nPassword: '',
    })
  })

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={isNeedInitiator ? 'initiator' : 'layout'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          {render(
            <div className={clsx('relative flex min-h-screen', props.classNames?.root)}>
              <Sidebar />
              <div className="flex flex-col flex-1">
                <Navbar />
                <Main className={props.classNames?.main}>
                  {props.children}
                </Main>
              </div>
            </div>,
          )}
        </motion.div>
      </AnimatePresence>
      <If cond={!isNeedInitiator}>
        <StepStatusChip />
      </If>
    </>
  )
}
