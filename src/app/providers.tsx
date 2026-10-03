import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from './auth-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
