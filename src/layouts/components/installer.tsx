/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
import { Icon } from '@iconify/react'
import { invoke } from '@tauri-apps/api/core'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useMount } from 'react-use'
import { useStore } from 'valtio-define'
import { Main } from './main'
import { Navbar } from './navbar'

function useHistory<T>(state: T, limit = 5, reverse = false) {
  const [history, setHistory] = useState<T[]>([])
  useEffect(() => {
    setHistory((prev) => {
      if (!state)
        return prev
      if (prev.length >= limit) {
        return [state, ...prev.slice(0, limit - 1)]
      }
      return [...prev, state]
    })
  }, [state, limit])
  return reverse ? history.reverse() : history
}

export function Installer() {
  const { percentage, detail, title, log } = useStore(store.installer)
  const logs = useHistory(log, 5)

  useMount(() => invoke('install_dependencies'))

  return (
    <div className={clsx('relative flex min-h-screen border-none')}>
      <div className="flex flex-col flex-1">
        <Navbar />
        <Main className="flex justify-center items-center">
          <StepStatus
            icon={<Icon icon="lucide:download" className="text-primary-500 w-8 h-8" />}
            title={title}
            description={detail}
            progress={percentage}
            progressProps={{ showValueLabel: true }}
            extra={(
              <div className="bg-foreground/2 rounded-md p-2 w-full h-[116px] border-1 border-foreground/10 text-left text-foreground/50">
                {(logs.length ? logs : ['Waiting for logs...']).map((logItem, index) => (
                  <p key={index} className="text-sm flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    <Icon icon="lucide:chevron-right" className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{logItem}</span>
                  </p>
                ))}
              </div>
            )}
          />
        </Main>
      </div>
    </div>
  )
}
