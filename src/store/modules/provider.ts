export interface ProviderOptions {
  headers?: Record<string, string>
  apiKey?: string
  baseUrl?: string
}

export interface Provider {
  id: string
  name: string | 'custom'
  options?: ProviderOptions
  models: Model[]
}

export interface Model {
  id: string
  provider: string
  name: string
  enabled: boolean

  video?: boolean
  image?: boolean
  video_generate?: boolean
  image_generate?: boolean

  context?: string

  options?: any

  date?: string
  input?: string
  output?: string
}

export const provider = defineStore({
  state: () => ({
    models: {
      default: '',
      title: '',
      compress: '',
    },
  }),
})
