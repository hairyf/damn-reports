'use client'
import {  QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react"

export function Provider(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}
