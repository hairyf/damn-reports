import clsx from 'clsx'

export function Main(props: { children: React.ReactNode, className?: string }) {
  return (
    <main className="flex-grow relative">
      <div className={clsx('px-6 pb-6 pt-2 absolute top-0 left-0 w-full h-full flex flex-col overflow-y-auto', props.className)}>
        {props.children}
      </div>
    </main>
  )
}
