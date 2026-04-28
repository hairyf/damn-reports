import type { PropsWithChildren } from 'react'
import { Sidebar } from './components/sidebar'

import { Provider } from './provider'
import './globals.css'
import 'assistant-ui/style.css'

function Layout(props: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Provider>
          <layouts.default sidebar={<Sidebar />}>
            {props.children}
          </layouts.default>
        </Provider>
      </body>
    </html>
  )
}

export default Layout
