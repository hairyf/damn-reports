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

export interface PostN8nCredentialsBody {
  isGlobal: boolean
  isResolvable: boolean
  data: { apiKey: string }
  name: string
  type: string
}

export interface PostN8nCredentialsResult {
  code?: number
  data: {
    updatedAt: string
    name: string
    data: string
    type: string
    isManaged: false
    isResolvable: false
    id: string
    resolverId: string | null
    createdAt: string
    isGlobal: boolean
    resolvableAllowFallback: boolean
    scopes: string[]
  }
  message?: string
}

export interface PatchN8nMeBody {
  firstName: string
  lastName: string
  email: string
}

export interface PatchN8nMeResult {
  code?: number
  data: any
  message?: string
}

export interface PostN8nLoginBody {
  emailOrLdapLoginId: string
  password: string
}

export interface PostN8nLoginResult {
  code?: number
  message?: string
  data: N8nUser
}

export interface GetN8nLoginResult {
  status?: 'error'
  message?: 'Unauthorized'
  data?: N8nUser
}

export interface PostN8nMeSurveyParams {
  version: string
  personalization_survey_submitted_at: string
  personalization_survey_n8n_version: string
}

export interface PostN8nRegisterBody {
  agree: boolean
  email: string
  firstName: string
  lastName: string
  password: string
}

export interface PostN8nWorkflowWorkflowIdActivateBody {
  // versionId
  versionId: string
  // checksum
  expectedChecksum: string
  // Version [versionId.split('-')[0]]
  name: string
  description: string
}

export interface PostN8nRegisterResult {
  code?: number
  data: N8nUser
  message?: string
}

export interface PostN8nWorkflowResult {
  updatedAt: string
  createdAt: string
  id: string
  name: string
  nodes: {
    parameters: any
    type: string
    [key: string]: any
  }[]
  connections: {
    [key: string]: {
      main: {
        [key: string]: any
      }[]
    }
  }
  [key: string]: any
}

export interface GetN8nWorkflowResult {
  updatedAt: string
  createdAt: string
  id: string
  name: string
  nodes: {
    parameters: any
    type: string
    [key: string]: any
  }[]
  connections: {
    [key: string]: {
      main: {
        [key: string]: any
      }[]
    }
  }
  [key: string]: any
}

export interface GetN8nCredentialsIdResult {
  updatedAt: string
  name: string
  data: string
  type: string
  isManaged: boolean
  isResolvable: boolean
  id: string
  resolverId: string | null
  createdAt: string
  isGlobal: boolean
  resolvableAllowFallback: boolean
  scopes: string[]
}

export interface GetN8nCredentialsResult {
  code?: number
  data: GetN8nCredentialsIdResult[]
  message?: string
}
