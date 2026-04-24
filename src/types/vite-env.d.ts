/// <reference types="vite/client" />
/// <reference types="vite-plugin-app-router/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_API_KEY?: string
  readonly VITE_LLM_BASE_URL?: string
}
