import {
  addToast,
  Button,
  Card,
  CardBody,
  ScrollShadow,
  Spinner,
  Textarea,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

function Page() {
  const sessionStore = useStore(store.session)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const sessions = sessionStore.sessions
  const activeSession = useMemo(() => {
    if (sessionStore.activeSession)
      return sessionStore.activeSession
    return sessions[0] ?? null
  }, [sessionStore.activeSession, sessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeSession?.id, activeSession?.messages])

  async function handleSend() {
    const content = input.trim()
    if (!content)
      return

    // 先清空输入框，提供更及时的交互反馈
    setInput('')

    try {
      await store.session.startStreaming(content)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '发送失败，请稍后重试'
      addToast({
        title: '发送失败',
        description: message,
        color: 'danger',
      })
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!sessionStore.isStreaming)
        handleSend()
    }
  }

  function handleNewSession() {
    store.session.createSession()
    setInput('')
  }

  function handleDeleteSession(id: string) {
    store.session.deleteSession(id)
  }

  return (
    <div className="flex flex-1 h-full gap-4">
      {/* 会话列表 */}
      <Card className="w-64 flex-shrink-0 h-full" shadow="none">
        <CardBody className="h-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:messages-square" className="w-4 h-4 text-default-500" />
              <span className="font-medium">会话</span>
            </div>
            <Button
              isIconOnly
              size="sm"
              radius="full"
              variant="light"
              onPress={handleNewSession}
            >
              <Icon icon="lucide:plus" className="w-4 h-4" />
            </Button>
          </div>

          <ScrollShadow className="flex-1 pr-1">
            {sessions.length === 0 && (
              <div className="text-sm text-default-400 py-8 text-center">
                暂无会话
              </div>
            )}
            {sessions.map((item) => {
              const isActive = activeSession?.id === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => store.session.setActiveSession(item.id)}
                  className={clsx(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm group',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-default-100 text-default-600',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {item.title || '未命名会话'}
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onPress={() => {
                      handleDeleteSession(item.id)
                    }}
                  >
                    <Icon icon="lucide:trash-2" className="w-3 h-3" />
                  </Button>
                </button>
              )
            })}
          </ScrollShadow>
        </CardBody>
      </Card>

      {/* 消息区 */}
      <Card className="flex-1 flex flex-col h-full" shadow="none">
        <CardBody className="flex flex-col h-full gap-3">
          <div className="flex-1 min-h-0 rounded-xl p-3 overflow-hidden">
            {activeSession && activeSession.messages.length > 0
              ? (
                  <ScrollShadow className="h-full pr-2">
                    {activeSession.messages.map((message) => {
                      const isUser = message.role === 'user'
                      const isAssistantLoading = !isUser
                        && !message.content
                        && sessionStore.isStreaming
                        && message.id === activeSession.messages[activeSession.messages.length - 1]?.id
                      return (
                        <div
                          key={message.id}
                          className={clsx(
                            'flex mb-3',
                            isUser ? 'justify-end' : 'justify-start',
                          )}
                        >
                          <div
                            className={clsx(
                              'rounded-2xl px-3 py-2 max-w-[75%] text-sm whitespace-pre-wrap',
                              isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-default-100 text-foreground',
                            )}
                          >
                            {isAssistantLoading
                              ? (
                                  <div className="flex items-center gap-2">
                                    <Spinner size="sm" color="default" />
                                    <span>加载中...</span>
                                  </div>
                                )
                              : message.content}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </ScrollShadow>
                )
              : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-default-400">
                    <Icon icon="lucide:messages-square" className="size-16" />
                    <div className="text-sm">
                      开始发送第一条消息，创建你的会话。
                    </div>
                  </div>
                )}
          </div>

          {/* 输入区 */}
          <div className="flex flex-col gap-2">
            <Textarea
              minRows={2}
              maxRows={6}
              value={input}
              onValueChange={setInput}
              onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler<HTMLDivElement>}
              placeholder="输入你的内容，Enter 发送，Shift+Enter 换行"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-default-400">
                {sessionStore.isStreaming ? '正在生成回复，可以点击停止。' : '\u00A0'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="flat"
                  color="default"
                  onPress={() => store.session.stopStreaming()}
                  isDisabled={!sessionStore.isStreaming}
                >
                  停止
                </Button>
                <Button
                  color="primary"
                  onPress={handleSend}
                  isDisabled={sessionStore.isStreaming || !input.trim()}
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default Page
