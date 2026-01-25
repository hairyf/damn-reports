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

export const user = defineStore({
  state: () => ({
    info: null as N8nUser | null,
    // 状态分类：运行状态
    n8nprocessStatus: 'initial' as 'initial' | 'installing' | 'starting' | 'running',
    loggedIn: false,

    // 状态分类：业务配置
    n8nDefaultAccountLoginEnabled: true,
    credentialName: null as string | null,
    deepseekSkip: false,

    credential: null as string | null,
    workflow: null as string | null,
    workspace: null as number | null,

    // 敏感信息（建议不要持久化，或加密存储）
    n8nEmail: '',
    n8nPassword: '',
  }),
  actions: {
    async syncN8nStatus() {
      const status = await invoke<any>('get_n8n_status')
      this.n8nprocessStatus = status.toLowerCase()
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
      this.loggedIn = true
      return result.data!
    },
    async fallbackLogin() {
      console.log('start fallbackLogin')
      const result = await postN8nLogin({
        emailOrLdapLoginId: this.account.email,
        password: this.account.password,
      })
      if (typeof result.code === 'number')
        throw new TypeError(result.message)
      this.loggedIn = true
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
      this.loggedIn = true
      return result.data
    },

    async initializeAccount() {
      await this.login()
        .catch(this.register)
        .then(this.survey)
        .catch(this.fallbackLogin)

      if (!setting.ininitialized)
        setting.ininitialized = true
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
      return data
    },
    async createWorkspacePlaceHolder() {
      console.log('start createWorkspace')
      // 先检查是否已经存在 workflow 为 '__workflow__' 的记录
      const existing = await db
        .selectFrom('workspace')
        .selectAll()
        .where('workflow', '=', '__workflow__')
        .executeTakeFirst()

      if (existing) {
        // 如果已存在，返回现有记录的 id
        return existing.id.toString()
      }

      // 如果不存在，创建新记录
      const { insertId } = await db.workspace.create({
        name: 'Default Report Workflow',
        workflow: '__workflow__',
      })
      return insertId!.toString()
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
      store.user.$patch({
        credential: result.data.id,
        credentialName: result.data.name,
      })
    },
    async updateWorkspace(data: Partial<Selectable<Workspace>>) {
      await db.workspace.update(this.workspace!.toString(), data)
    },
    async initializeWorkflow() {
      if (this.workflow)
        return
      console.log('start initializeWorkflow')
      const workspace = await this.createWorkspacePlaceHolder()
      // 更新 workspace 状态
      this.workspace = Number(workspace)
      console.log('start createWorkflow')
      const data = await this.createWorkflow(workspace)
      await this.updateWorkspace({ workflow: data.id })
      // 更新 workflow 状态
      this.workflow = data.id
    },

  },
  getters: {
    ready() {
      return (
        !!(this.n8nprocessStatus === 'running'
          && this.loggedIn
          && (this.credential || this.deepseekSkip)
          && this.workflow)
      )
    },
    status() {
      if (['initial', 'installing', 'starting'].includes(this.n8nprocessStatus))
        return StartupState.STARTING_SERVICE
      if (!this.loggedIn) {
        return this.n8nDefaultAccountLoginEnabled ? StartupState.INITIALIZING_ACCOUNT : StartupState.MANUAL_LOGIN
      }
      if (!this.credential && !this.deepseekSkip)
        return StartupState.DEEPSEEK_CONFIG
      if (!this.workflow)
        return StartupState.TEMPLATE_INIT
      return StartupState.COMPLETED
    },
    account() {
      return {
        email: this.n8nEmail || N8N_REGISTER_DATA.email,
        password: this.n8nPassword || N8N_REGISTER_DATA.password,
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
      'n8nEmail',
      'n8nPassword',
      'info',
      'workspace',
      'workflow',
    ],
  },
})

listen('n8n-status-updated', user.syncN8nStatus)
user.syncN8nStatus()
