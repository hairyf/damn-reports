/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
import { If } from '@hairy/react-lib'
import { Icon } from '@iconify/react'
import { invoke } from '@tauri-apps/api/core'
import clsx from 'clsx'
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
  const { percentage, detail, title, type, progress } = useStore(store.installer)
  const details = useHistory(detail, 5, true)

  useMount(() => invoke('install_dependencies'))

  return (
    <div className={clsx('relative flex min-h-screen border-none')}>
      <div className="flex flex-col flex-1">
        <Navbar />
        <Main className="flex justify-center items-center">
          <StepStatus
            icon={<Icon icon="lucide:download" className="text-primary-500 w-8 h-8" />}
            title={title}
            description={`${type === 'download' ? detail : '解压中'} ${progress.toFixed(2)}%`}
            progress={percentage}
            progressProps={{ showValueLabel: true }}
            loading={type === 'download'}
            extra={(
              <If cond={type === 'extract'}>
                <div className="bg-foreground/2 rounded-md p-2 w-full h-[116px] border-1 border-foreground/10 text-left text-foreground/50">
                  {(details.length ? details : ['']).map((detail, index) => (
                    <p key={index} className="text-sm flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      <Icon icon="lucide:chevron-right" className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{detail}</span>
                    </p>
                  ))}
                </div>
              </If>
            )}
          />
        </Main>
      </div>
    </div>
  )
}
