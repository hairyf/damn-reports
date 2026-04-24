import { ToastProvider } from '@heroui/react'
import { QueryClientProvider } from '@tanstack/react-query'


export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
        {children}
      <ToastProvider />
    </QueryClientProvider>
  )
}
