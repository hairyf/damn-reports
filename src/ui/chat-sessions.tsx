import { Button, Card, CardBody, ScrollShadow } from '@heroui/react'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export function ChatSessions() {
  const { sessions, activeSession } = useStore(store.session)

  function handleNewSession() {
    store.session.prepareNewChat()
  }

  function handleDeleteSession(id: string) {
    store.session.deleteSession(id)
  }

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
            {sessions.map((item) => {
              const isActive = activeSession?.id === item.id
              return (
                <Button
                  key={item.id}
                  variant="light"
                  className={clsx(
                    'text-left pr-2',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-default-100 text-default-400',
                  )}
                  onPress={() => store.session.setActiveSession(item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {item.title || '未命名会话'}
                    </div>
                  </div>
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
                </Button>
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
