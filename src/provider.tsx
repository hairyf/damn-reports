import type { NavigateOptions } from 'react-router-dom'

import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { OverlaysProvider } from '@overlastic/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useHref, useNavigate } from 'react-router-dom'
import { queryClient } from './config/client'

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        <OverlaysProvider>
          {children}
        </OverlaysProvider>
        <ToastProvider toastOffset={64} placement="top-center" />
      </HeroUIProvider>
    </QueryClientProvider>
  )
}
