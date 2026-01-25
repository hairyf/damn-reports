import { useWhenever } from '@hairy/react-lib'
import { Suspense } from 'react'
import { useNavigate, useRoutes } from 'react-router-dom'
import { useMount } from 'react-use'
import { useStore } from 'valtio-define'
import routes from '~react-pages'
import { StartupState } from './store/modules/user'

function App() {
  const navigate = useNavigate()
  const { status } = useStore(store.user)

  useMount(() => window.navigate = navigate)

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
    <layouts.default>
      <Suspense fallback={<p>Loading...</p>}>
        {useRoutes(routes)}
      </Suspense>
    </layouts.default>
  )
}
export default App
