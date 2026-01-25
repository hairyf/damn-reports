import type { NavigateOptions } from 'react-router-dom'

import { If, useWhenever } from '@hairy/react-lib'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { OverlaysProvider } from '@overlastic/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useHref, useNavigate } from 'react-router-dom'
import { useMount } from 'react-use'
import { useStore } from 'valtio-define'
import { queryClient } from './config/client'
import { StartupState } from './store/modules/user'

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [initial, setInitial] = useState(false)
  const { status } = useStore(store.user)
  useMount(() => {
    storage.getItem('installed').then(() => setInitial(true))
  })

  useWhenever(
    status === StartupState.INITIALIZING_ACCOUNT,
    // 登录重试多一些，避免启动 n8n 端口还未完全启动成功
    () => retry(store.user.initializeAccount, { retries: 10, delay: 1000 }),
    { immediate: true },
  )

  useWhenever(
    status === StartupState.TEMPLATE_INIT,
    () => retry(store.user.initializeWorkflow),
    { immediate: true },
  )

  return (
    <If cond={initial}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider navigate={navigate} useHref={useHref}>
          <OverlaysProvider>
            {children}
          </OverlaysProvider>
          <ToastProvider toastOffset={64} placement="top-center" />
        </HeroUIProvider>
      </QueryClientProvider>
    </If>
  )
}
