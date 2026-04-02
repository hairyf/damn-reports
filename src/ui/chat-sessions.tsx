import type { Session } from '@/store/modules/session'
import { Button, Card, CardBody, ScrollShadow, Tooltip } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useOverlay } from '@overlastic/react'
import clsx from 'clsx'
import { useMount } from 'react-use'
import { useStore } from 'valtio-define'
import { Dialog } from '@/components/dialog'
import { MAIN_SESSION_ID } from '@/config/constants'
import { store } from '@/store'

export function ChatSessions() {
  const { sessions, session: activeSession } = useStore(store.session)
  const openDialog = useOverlay(Dialog)

  function handleNewSession() {
    store.session.prepare()
  }

  function handleDeleteSession(id: string) {
    store.session.remove(id)
  }

  async function handleClearMainSession() {
    const confirmed = await openDialog({
      title: '清空主会话',
      message: '确定要清空主会话的消息吗？此操作无法撤销。',
      confirmText: '清空',
      cancelText: '取消',
    })
    if (!confirmed)
      return
    store.session.clear(MAIN_SESSION_ID)
  }

  useMount(() => {
    store.session.clearStaleStreaming()
  })

  return (
    <Card className="w-56 flex-shrink-0 h-full" shadow="none">
      <CardBody className="h-full flex flex-col gap-3">
        <ScrollShadow className="flex-1 pr-1">
          <div className="flex flex-col gap-2">
            <Button
              color="primary"
              className="w-full"
              radius="full"
              startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
              onPress={handleNewSession}
            >
              开启新对话
            </Button>
            {(sessions as Session[]).map((item) => {
              const isActive = activeSession?.id === item.id
              return (
                <Tooltip
                  key={item.id}
                  content={item.title}
                  placement="right"
                >
                  <Button
                    key={item.id}
                    variant="light"
                    className={clsx(
                      'text-left pr-2',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-default-100 text-default-400',
                    )}
                    onPress={() => store.session.activate(item.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {item.title || '未命名会话'}
                      </div>
                    </div>
                    {item.id === MAIN_SESSION_ID
                      ? (
                          <Button
                            isIconOnly
                            size="sm"
                            as="span"
                            variant="light"
                            className="hover:!bg-white/50"
                            title="清空主会话"
                            onPress={handleClearMainSession}
                          >
                            <Icon icon="lucide:eraser" className="w-3 h-3" />
                          </Button>
                        )
                      : (
                          <Button
                            isIconOnly
                            size="sm"
                            as="span"
                            variant="light"
                            className="hover:!bg-white/50"
                            onPress={() => handleDeleteSession(item.id)}
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3" />
                          </Button>
                        )}
                  </Button>
                </Tooltip>
              )
            })}
          </div>
          {sessions.length === 0 && (
            <div className="text-sm text-default-400 py-8 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <Icon icon="lucide:notebook-text" className="size-12" />
                <div className="text-sm">
                  暂无会话
                </div>
              </div>
            </div>
          )}
        </ScrollShadow>
      </CardBody>
    </Card>
  )
}
