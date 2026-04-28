import type { PropsWithChildren } from 'react'
import { Provider } from './provider'
import './globals.css'
import 'assistant-ui/style.css'

function Layout(props: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Provider>
          {props.children}

        </Provider>
      </body>
    </html>
  )
}

export default Layout
