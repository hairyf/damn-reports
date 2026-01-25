import type { NavigateOptions } from 'react-router-dom'

import { If, useWhenever } from '@hairy/react-lib'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { OverlaysProvider } from '@overlastic/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useHref, useNavigate } from 'react-router-dom'
import { useMount } from 'react-use'
import { useStore } from 'valtio-define'
import { queryClient } from './config/client'

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [initial, setInitial] = useState(false)
  const user = useStore(store.user)
  useMount(() => storage.getItem('installed').then(() => setInitial(true)))
  // 检测工作流是否真实存在，不存在则清除状态
  useWhenever(user.loggedIn && user.workflow, async () => {
    const detail = await getN8nWorkflow(user.workflow!)
    if (!detail)
      store.user.$patch({ workflow: null })
  }, { immediate: true })

  // 检测凭证是否真实存在，不存在则清除状态
  useWhenever(user.credential, async () => {
    const credentials = await getN8nCredentials()
    if (!credentials.data.find(credential => credential.id === user.credential))
      store.user.$patch({ credential: null, credentialName: null })
  }, { immediate: true })
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
