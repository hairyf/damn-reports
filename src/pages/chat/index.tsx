import type { FileUIPart } from 'ai'
import {
  addToast,
  Button,
  Card,
  CardBody,
  ScrollShadow,
  Spinner,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  Suggestion,
  Suggestions,
  usePromptInputAttachments,
  usePromptInputController,
} from 'ai-elements'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

const QUICK_TAGS = [
  { label: '分析数据', icon: 'lucide:bar-chart-2' },
  { label: '随便聊聊', icon: 'lucide:box' },
  { label: '总结文本', icon: 'lucide:file-text' },
  { label: '写代码', icon: 'lucide:code' },
  { label: '给建议', icon: 'lucide:graduation-cap' },
  { label: '更多', icon: 'lucide:more-horizontal' },
] as const

function AttachButton() {
  const { openFileDialog } = usePromptInputAttachments()
  return (
    <button
      type="button"
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      onClick={openFileDialog}
      title="附件"
      aria-label="附件"
    >
      <Icon icon="lucide:paperclip" className="size-4" />
    </button>
  )
}

function MessageAreaExtras() {
  const attachments = usePromptInputAttachments()
  const controller = usePromptInputController()

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      controller.textInput.setInput(suggestion)
    },
    [controller],
  )

  return (
    <div className="flex flex-col gap-2">
      {attachments.files.length > 0 && (
        <Attachments variant="grid" className="mt-1">
          {attachments.files.map(file => (
            <Attachment
              key={file.id}
              data={file}
              onRemove={() => attachments.remove(file.id)}
            >
              <AttachmentPreview />
              <AttachmentRemove />
            </Attachment>
          ))}
        </Attachments>
      )}
      <Suggestions className="gap-2">
        {QUICK_TAGS.map(({ label, icon }) => (
          <Suggestion
            key={label}
            suggestion={label}
            onClick={handleSuggestionClick}
            className="rounded-full"
          >
            <Icon icon={icon} className="mr-1.5 size-3.5" />
            {label}
          </Suggestion>
        ))}
      </Suggestions>
    </div>
  )
}

function Page() {
  const sessionStore = useStore(store.session)
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

  const chatStatus = sessionStore.isStreaming ? 'streaming' : undefined

  const handleSubmit = useCallback(
    async (message: { text: string, files: FileUIPart[] }) => {
      const { text, files } = message
      if (!text.trim() && files.length === 0)
        return
      try {
        await store.session.startStreaming(text, files)
      }
      catch (error) {
        const msg = error instanceof Error ? error.message : '发送失败，请稍后重试'
        addToast({
          title: '发送失败',
          description: msg,
          color: 'danger',
        })
      }
    },
    [],
  )

  function handleNewSession() {
    store.session.createSession()
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

          {/* 输入区：ai-elements PromptInput + 附件 + 快速消息标签 */}
          <div className="flex flex-col gap-2">
            <PromptInputProvider>
              <PromptInput
                accept="image/*,.pdf,.txt,.md,application/pdf"
                multiple
                maxFiles={10}
                onSubmit={handleSubmit}
                className="w-full"
              >
                <PromptInputHeader>
                  <PromptInputTools>
                    <AttachButton />
                  </PromptInputTools>
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea placeholder="Ask anything" />
                </PromptInputBody>
                <PromptInputFooter>
                  <div className="flex-1 text-xs text-muted-foreground">
                    {sessionStore.isStreaming ? '正在生成回复，可点击停止。' : '\u00A0'}
                  </div>
                  <PromptInputTools>
                    <PromptInputSubmit
                      status={chatStatus}
                      onStop={() => store.session.stopStreaming()}
                    />
                  </PromptInputTools>
                </PromptInputFooter>
              </PromptInput>
              <MessageAreaExtras />
            </PromptInputProvider>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default Page
