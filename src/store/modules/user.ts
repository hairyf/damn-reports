import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { defineStore } from 'valtio-define'

export enum StartupState {
  UNZIPPING = 'unzipping',
  STARTING_SERVICE = 'starting_service',
  INITIALIZING_ACCOUNT = 'initializing_account',
  MANUAL_LOGIN = 'manual_login',
  DEEPSEEK_CONFIG = 'deepseek_config',
  TEMPLATE_INIT = 'template_init',
  COMPLETED = 'completed',
}

export interface N8nUser {
  createdAt: string
  disabled: boolean
  email: string
  featureFlags: Record<string, boolean>
  firstName: string
  globalScopes: string[]
  id: string
  isOwner: boolean
  isPending: boolean
  lastActiveAt: string
  lastName: string
  mfaAuthenticated: boolean
  mfaEnabled: boolean
  personalizationAnswers: Record<string, unknown> | null
  role: string
  settings: { userActivated: boolean }
  signInType: 'email'
}

export const user = defineStore({
  state: () => ({
    // 状态分类：运行状态
    n8nprocessStatus: 'initial' as 'initial' | 'unzipping' | 'starting' | 'running',
    n8nLoggedIn: false,

    // 状态分类：业务配置
    n8nDefaultAccountLoginEnabled: true,
    n8nUser: null as N8nUser | null,
    credentialId: null as string | null,
    credentialName: null as string | null,
    deepseekSkip: false,
    workflowId: null as string | null,
    workspaceId: null as number | null,

    // 敏感信息（建议不要持久化，或加密存储）
    n8nEmail: '',
    n8nPassword: '',
  }),
  actions: {
    async syncN8nStatus() {
      const status = await invoke<any>('get_n8n_status')
      this.n8nprocessStatus = status.toLowerCase()
    },
  },
  getters: {
    initialized() {
      return (
        !!(this.n8nprocessStatus === 'running'
          && this.n8nLoggedIn
          && (this.credentialId || this.deepseekSkip)
          && this.workflowId)
      )
    },
    status() {
      if (this.n8nprocessStatus === 'unzipping')
        return StartupState.UNZIPPING
      if (this.n8nprocessStatus === 'starting')
        return StartupState.STARTING_SERVICE
      if (!this.n8nLoggedIn) {
        return this.n8nDefaultAccountLoginEnabled ? StartupState.INITIALIZING_ACCOUNT : StartupState.MANUAL_LOGIN
      }
      if (!this.credentialId && !this.deepseekSkip)
        return StartupState.DEEPSEEK_CONFIG
      if (!this.workflowId)
        return StartupState.TEMPLATE_INIT
      return StartupState.COMPLETED
    },
  },
  persist: {
    key: 'user',
    paths: [
      'credentialId',
      'credentialName',
      'workflowId',
      'deepseekSkip',
      'n8nEmail',
      'n8nPassword',
      'n8nUser',
      'workspaceId',
      'workflowId',
    ],
  },
})

listen('n8n-status-updated', user.syncN8nStatus)
user.syncN8nStatus()
