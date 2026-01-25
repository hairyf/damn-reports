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
  const { installed, ininitialized } = useStore(store.setting)

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
    <layouts.default>
      <Suspense fallback={<p>Loading...</p>}>
        {useRoutes(routes)}
      </Suspense>
    </layouts.default>
  )
}
export default App
