import type { PropsWithChildren } from 'react'
import { Sidebar } from './components/sidebar'

function Layout(props: PropsWithChildren) {
  return (
    <layouts.default sidebar={<Sidebar />}>
      {props.children}
    </layouts.default>
  )
}

export default Layout
