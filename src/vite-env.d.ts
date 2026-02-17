/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEST_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
