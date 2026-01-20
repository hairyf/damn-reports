import { useWhenever } from '@hairy/react-lib'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from 'valtio-define'
import { StartupState } from '@/store/modules/user'
import { Main } from './main'
import { Navbar } from './navbar'

export interface RetryOptions {
  retries?: number
  delay?: number
}

export function Initiator() {
  const { status, n8nEmail, n8nPassword, credentialId, credentialName } = useStore(store.user)
  async function registerN8nAccount() {
    const result = await postN8nRegister({
      ...N8N_REGISTER_DATA,
      email: n8nEmail || N8N_REGISTER_DATA.email,
      password: n8nPassword || N8N_REGISTER_DATA.password,
    })
    if (typeof result.code === 'number')
      throw new TypeError(result.message)
    if (!result)
      throw new TypeError('Failed to register n8n account')
    return result.data
  }

  async function loginN8nAccount() {
    const login_data = {
      emailOrLdapLoginId: n8nEmail || N8N_REGISTER_DATA.email,
      password: n8nPassword || N8N_REGISTER_DATA.password,
    }
    const result = await postN8nLogin(login_data)
    if (typeof result.code === 'number')
      throw new TypeError(result.message)
    return result.data
  }
  async function initializeN8nAccount() {
    try {
      const n8nUser = await registerN8nAccount()
      await loginN8nAccount()
      await postN8nMeSurvey({
        version: 'v4',
        personalization_survey_submitted_at: new Date().toISOString(),
        personalization_survey_n8n_version: 'v4',
      })
      store.user.$patch({ n8nLoggedIn: true, n8nUser })
    }
    catch {
      const n8nUser = await loginN8nAccount()
      store.user.$patch({ n8nLoggedIn: true, n8nUser })
    }
  }

  async function initializeN8nWorkflow() {
    const { insertId } = await db.workspace.create({
      name: 'Default Report Workflow',
      workflow: '__workflow__',
    })
    const workspaceId = insertId?.toString()

    if (!workspaceId)
      throw new TypeError('Failed to create workspace')

    const requestData = getReportWorkflowData({
      workflowId: Number(workspaceId),
      name: 'Default Report Workflow',
      credentials: {
        deepSeekApi: credentialId
          ? {
              id: credentialId!,
              name: credentialName!,
            }
          : undefined,
      },
    })

    const data = await postN8nWorkflow(requestData)

    if (!data?.id)
      throw new TypeError('Failed to create workflow')

    await postN8nWorkflowWorkflowIdActivate(
      { workflowId: data.id },
      {
        versionId: data.versionId,
        expectedChecksum: data.checksum,
        name: `Version ${data.versionId.split('-')[0]}`,
        description: '',
      },
    )

    await db.workspace.update(workspaceId, { workflow: data.id })

    store.user.$patch({ workflowId: data.id, workspaceId: Number(workspaceId) })
  }

  useWhenever(
    status === StartupState.INITIALIZING_ACCOUNT,
    // 登录重试多一些，避免启动 n8n 端口还未完全启动成功
    () => retry(initializeN8nAccount, { retries: 10, delay: 1000 }),
    { immediate: true },
  )

  useWhenever(
    status === StartupState.TEMPLATE_INIT,
    () => retry(initializeN8nWorkflow),
    { immediate: true },
  )

  function renderStatus() {
    switch (status) {
      case StartupState.UNZIPPING:
        return (
          <StepStatus
            icon={<Icon icon="lucide:package-check" className="text-blue-400 w-8 h-8" />}
            title="解压 n8n 服务"
            description="正在准备环境组件，这可能需要一点时间..."
            progress={33}
            loading
          />
        )
      case StartupState.STARTING_SERVICE:
        return (
          <StepStatus
            icon={<Icon icon="lucide:zap" className="text-yellow-400 w-8 h-8" />}
            title="正在启动 n8n 服务"
            description="正在拉起后台进程与依赖服务..."
            progress={66}
            loading
          />
        )
      case StartupState.INITIALIZING_ACCOUNT:
        return (
          <StepStatus
            icon={<Icon icon="lucide:user-plus" className="text-emerald-400 w-8 h-8" />}
            title="n8n 服务已启动"
            description="正在加载系统账号..."
            progress={90}
            loading
          />
        )
      case StartupState.MANUAL_LOGIN:
        return (
          <StepN8nManualLogin />
        )
      case StartupState.DEEPSEEK_CONFIG:
        return (
          <StepDeepSeekApiKey />
        )
      case StartupState.TEMPLATE_INIT:
        return (
          <StepStatus
            icon={<Icon icon="lucide:layout" className="text-purple-400 w-8 h-8" />}
            title="账号初始化成功"
            description="工作区资源初始化，正在加载自动化任务模版..."
            progress={95}
            loading
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={clsx('relative flex min-h-screen border-none')}>
      <div className="flex flex-col flex-1">
        <Navbar />
        <Main className="flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              className="w-full max-w-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {renderStatus()}
            </motion.div>
          </AnimatePresence>
        </Main>
      </div>
    </div>
  )
}
