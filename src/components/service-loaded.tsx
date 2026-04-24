'use client'

import { useFetchRequestIntercept } from "@hairy/react-lib"
import { useQuery } from "@tanstack/react-query"
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { PropsWithChildren } from "react"

/**
 * Ensure the next sidebar server is loaded
 * @param props 
 * @returns
 */
export function ServiceLoaded(props: PropsWithChildren) {
  useFetchRequestIntercept((fetch, url, init) => {
    if (url.toString().startsWith('/') && process.env.NODE_ENV === 'production')
      return tauriFetch(`http://127.0.0.1:1420${url}`, init)
    return fetch(url, init)
  })

  const { data } = useQuery<{ ok: true }>({
    queryKey: ['/api/heart'],
    queryFn: () => fetch('/api/heart')
      .then(r => r.json()),
    retry: 10
  })

  return data?.ok && props.children
}