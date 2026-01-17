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

export interface PostN8nLoginBody {
  emailOrLdapLoginId: string
  password: string
}

export interface PostN8nLoginResult {
  code?: number
  message?: string
  data: any
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

export interface PostN8nRegisterResult {
  code?: number
  data: any
  message?: string
}

export interface PostN8nWorkflowResult {
  updatedAt: string
  createdAt: string
  id: string
  name: string
}
