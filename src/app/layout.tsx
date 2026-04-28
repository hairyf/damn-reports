import type { PropsWithChildren } from 'react'
import { cn } from 'ai-elements'
import { Geist } from 'next/font/google'
import { Provider } from './provider'

import './globals.css'
import 'assistant-ui/style.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

function Layout(props: PropsWithChildren) {
  return (
    <html lang="en" className={cn('antialiased font-sans', geist.variable)}>
      <body className="min-h-screen">
        <Provider>
          {props.children}
        </Provider>
      </body>
    </html>
  )
}

export default Layout
