import type { FileUIPart } from 'ai'
import { addToast, Button, Card, CardBody } from '@heroui/react'
import { Icon } from '@iconify/react'
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  PromptInput,
  PromptInputBody,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  Suggestion,
  Suggestions,
  usePromptInputAttachments,
  usePromptInputController,
} from 'ai-elements'
import { useCallback } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

const QUICK_TAGS = [
  { label: '分析数据', icon: 'lucide:bar-chart-2' },
  { label: '随便聊聊', icon: 'lucide:box' },
] as const

function AttachButton() {
  const { openFileDialog } = usePromptInputAttachments()
  return (
    <Button
      color="primary"
      variant="light"
      onPress={openFileDialog}
      title="附件"
      isIconOnly
      size="sm"
    >
      <Icon icon="lucide:paperclip" className="size-4" />
    </Button>
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
            className="rounded-full shadow-none"
          >
            <Icon icon={icon} className="mr-1.5 size-3.5" />
            {label}
          </Suggestion>
        ))}
      </Suggestions>
    </div>
  )
}

function ChatInputInner() {
  const { isStreaming } = useStore(store.session)
  const controller = usePromptInputController()
  const attachments = usePromptInputAttachments()

  const handleSubmit = useCallback(
    (message: { text: string, files: FileUIPart[] }) => {
      const { text, files } = message
      if (!text.trim() && files.length === 0)
        return
      // 发送后立即清空输入框和附件，不等待流式结束
      controller.textInput.clear()
      attachments.clear()
      const p = store.session.startStreaming(text, files)
      if (p && typeof p.then === 'function') {
        p.catch((error: unknown) => {
          const msg = error instanceof Error ? error.message : '发送失败，请稍后重试'
          addToast({
            title: '发送失败',
            description: msg,
            color: 'danger',
          })
        })
      }
    },
    [controller, attachments],
  )

  return (
    <>
      <PromptInput
        accept="image/*,.pdf,.txt,.md,application/pdf"
        multiple
        maxFiles={10}
        onSubmit={handleSubmit}
        className="w-full"
      >
        <PromptInputBody>
          <PromptInputTextarea className="border-none" placeholder="Ask anything" />
        </PromptInputBody>
      </PromptInput>
      <div className="flex gap-2 justify-between">
        <MessageAreaExtras />
        <div className="flex gap-2">
          <AttachButton />
          <PromptInputSubmit
            className="cursor-pointer"
            status={isStreaming ? 'streaming' : undefined}
            onStop={() => store.session.stopStreaming()}
          />
        </div>
      </div>
    </>
  )
}

export function ChatInput() {
  return (
    <Card className="flex flex-col" shadow="none">
      <CardBody className="flex flex-col h-full">
        <PromptInputProvider>
          <ChatInputInner />
        </PromptInputProvider>
      </CardBody>
    </Card>
  )
}
