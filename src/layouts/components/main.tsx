import clsx from 'clsx'

export function Main(props: { children: React.ReactNode, className?: string }) {
  return (
    <main className="flex-grow relative">
      <div className={clsx('px-6 pb-6 pt-2 absolute inset-0 flex flex-col overflow-y-auto box-border', props.className)}>
        {props.children}
      </div>
    </main>
  )
}
