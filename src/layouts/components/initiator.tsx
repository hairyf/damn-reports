import { Navbar as HeroUINavbar } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

export function InitiatorLayout() {

  const { data: _n8n_status } = useQuery<'initial' | 'starting' | 'running'>({
    queryKey: ["n8n-status"],
    queryFn: () => invoke("get_n8n_status").then((r: any) => r.toLowerCase()),
    refetchInterval: 500,
  })

  return (
    <HeroUINavbar maxWidth="full" position="sticky" className="relative">
      <div className="absolute inset-0 w-full" data-tauri-drag-region />
    </HeroUINavbar>
  )
}
