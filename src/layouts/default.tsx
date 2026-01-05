import clsx from 'clsx'
import { Navbar } from '@/layouts/components/navbar'
import { Sidebar } from '@/layouts/components/sidebar'

export interface DefaultLayoutProps {
  title?: string
  children: React.ReactNode
  classNames?: {
    root?: string
    main?: string
  }
}

export function DefaultLayout(props: DefaultLayoutProps) {
  return (
    <div className={clsx('relative flex min-h-screen', props.classNames?.root)}>
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-grow relative">
          <div className={clsx('px-6 pb-6 pt-3 absolute top-0 left-0 w-full h-full flex flex-col overflow-y-auto', props.classNames?.main)}>
            {props.title && (
              <div className="mb-4">
                <span className={title({ size: 'sm' })}>{props.title}</span>
              </div>
            )}
            {props.children}
          </div>
        </main>
      </div>
    </div>
  )
}
