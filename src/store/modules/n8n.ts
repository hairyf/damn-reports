/* eslint-disable no-console */
import type { Selectable } from 'kysely'
import type { N8nUser } from '@/apis/index.types'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { defineStore } from 'valtio-define'
import { setting } from './setting'

export enum StartupState {
  UNZIPPING = 'unzipping',
  STARTING_SERVICE = 'starting_service',
  INITIALIZING_ACCOUNT = 'initializing_account',
  MANUAL_LOGIN = 'manual_login',
  DEEPSEEK_CONFIG = 'deepseek_config',
  TEMPLATE_INIT = 'template_init',
  COMPLETED = 'completed',
}

export const n8n = defineStore({
  state: () => ({
    userInfo: null as N8nUser | null,
    // 状态分类：运行状态
    process: 'initial' as 'initial' | 'installing' | 'starting' | 'running' | 'stopped',

    // 状态分类：业务配置
    defaultLoginEnabled: true,
    credentialName: null as string | null,
    deepseekSkip: false,

    credential: null as string | null,
    workflow: null as string | null,
    workspace: null as number | null,

    // 敏感信息（建议不要持久化，或加密存储）
    email: '',
    password: '',
  }),
  actions: {
    async invokeN8nStatus() {
      const status = await invoke<any>('get_n8n_status')
      this.process = status.toLowerCase()
    },

    async survey() {
      await postN8nMeSurvey({
        version: 'v4',
        personalization_survey_submitted_at: new Date().toISOString(),
        personalization_survey_n8n_version: 'v4',
      })
    },

    async login() {
      console.log('start login')
      const result = await getN8nLogin()
      if (result.status === 'error')
        throw new TypeError(result.message)
      this.userInfo = result.data!
      return result.data!
    },

    async loginWithPassword() {
      console.log('start loginWithPassword')
      const result = await postN8nLogin({
        emailOrLdapLoginId: this.account.email,
        password: this.account.password,
      })
      if (typeof result.code === 'number')
        throw new TypeError(result.message)
      this.userInfo = result.data!
      return result.data
    },

    async register() {
      console.log('start register')
      const result = await postN8nRegister({
        ...N8N_REGISTER_DATA,
        ...this.account,
      })
      if (typeof result.code === 'number')
        throw new TypeError(result.message)
      if (!result)
        throw new TypeError('Failed to register n8n account')
      this.userInfo = result.data!
      return result.data
    },

    async initializeAccount() {
      await this.login()
        .catch(this.register)
        .then(this.survey)
        .catch(this.loginWithPassword)

      this.beInitialized()
    },

    async createWorkflow(workspace: string) {
      const deepSeekApi = this.credential
        ? { id: this.credential!, name: this.credentialName! }
        : undefined
      const body = getReportWorkflowData({
        workflowId: Number(workspace),
        name: 'Default Report Workflow',
        credentials: { deepSeekApi },
      })
      const data = await postN8nWorkflow(body)
      if (!data?.id)
        throw new TypeError('Failed to create workflow')

      if (this.credential) {
        await postN8nWorkflowWorkflowIdActivate(
          { workflowId: data.id },
          {
            versionId: data.versionId,
            expectedChecksum: data.checksum,
            name: `Version ${data.versionId.split('-')[0]}`,
            description: '',
          },
        )
      }
      return data
    },

    async createCredential(apiKey: string) {
      console.log('start createCredential')
      const result = await postN8nCredentials({
        isGlobal: false,
        isResolvable: false,
        data: { apiKey },
        name: 'DeepSeek account',
        type: 'deepSeekApi',
      })
      this.credential = result.data.id
      this.credentialName = result.data.name
    },

    async updateWorkspace(data: Partial<Selectable<Workspace>>) {
      await db.workspace.update(this.workspace!.toString(), data)
    },

    async initializeWorkflow() {
      if (this.workflow)
        return
      console.log('start initializeWorkflow')
      const workspace = await db.workspace.getOrCreatePlaceHolder()
      // 更新 workspace 状态
      this.workspace = Number(workspace)
      console.log('start createWorkflow')
      const data = await this.createWorkflow(workspace)
      await this.updateWorkspace({ workflow: data.id })
      // 更新 workflow 状态
      this.workflow = data.id
      this.beInitialized()
    },

    async beInitialized() {
      if (!this.workflow || setting.ininitialized)
        return
      setting.ininitialized = true
    },
  },
  getters: {
    ready() {
      return (
        !!(this.process === 'running'
          && this.userInfo
          && (this.credential || this.deepseekSkip)
          && this.workflow)
      )
    },
    loggedIn() {
      return !!this.userInfo
    },
    status() {
      if (['initial', 'installing', 'starting'].includes(this.process))
        return StartupState.STARTING_SERVICE
      if (!this.userInfo) {
        return this.defaultLoginEnabled ? StartupState.INITIALIZING_ACCOUNT : StartupState.MANUAL_LOGIN
      }
      if (!this.credential && !this.deepseekSkip)
        return StartupState.DEEPSEEK_CONFIG
      if (!this.workflow)
        return StartupState.TEMPLATE_INIT
      return StartupState.COMPLETED
    },
    account() {
      return {
        email: this.email || N8N_REGISTER_DATA.email,
        password: this.password || N8N_REGISTER_DATA.password,
      }
    },
  },
  persist: {
    key: 'user',
    paths: [
      'credential',
      'credentialName',
      'workflow',
      'deepseekSkip',
      'email',
      'password',
      'userInfo',
      'workspace',
      'workflow',
    ],
  },
})

listen('n8n-status-updated', n8n.invokeN8nStatus)

// 延迟执行 IPC 调用，确保 Tauri 后端已完全初始化
// 使用 setTimeout 确保在下一个事件循环中执行
setTimeout(() => {
  n8n.invokeN8nStatus().catch((err) => {
    // 静默处理初始调用失败，应用启动时后端可能还未完全就绪
    console.debug('Initial n8n status check failed (expected during app startup):', err)
  })
}, 100)
