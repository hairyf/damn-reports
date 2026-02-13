import type { FileUIPart } from 'ai'
import { Button, Card, CardBody } from '@heroui/react'
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
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from 'valtio-define'
import { store } from '@/store'

const QUICK_TAGS = [
  { label: '生成今日日报', icon: 'lucide:file-edit', suggestion: '生成今日日报' },
  { label: '查看今日日报', icon: 'lucide:clipboard-list', suggestion: '查看今日日报' },
  { label: '配置数据源', icon: 'lucide:database', suggestion: '帮我配置添加 xxx 为数据来源' },
  { label: '添加工具', icon: 'lucide:wrench', suggestion: '帮我配置用于获取远程 git 每天提交记录的工具' },
] as const

const SHOW_ATTACHMENTS = false // 暂时隐藏附件功能

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
      {SHOW_ATTACHMENTS && attachments.files.length > 0 && (
        <Attachments variant="grid" className="mt-1">
          {attachments.files.map((file: FileUIPart & { id: string }) => (
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
      <Suggestions className="ml-2 gap-2">
        {QUICK_TAGS.map(({ label, icon, suggestion }) => (
          <Suggestion
            key={label}
            suggestion={suggestion}
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

const ADD_TOOL_SUGGESTION = QUICK_TAGS.find(t => t.label === '添加工具')!.suggestion

function ChatInputInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isStreaming } = useStore(store.chat)
  const controller = usePromptInputController()
  const attachments = usePromptInputAttachments()

  useEffect(() => {
    if (searchParams.get('intent') === 'add-tool') {
      controller.textInput.setInput(ADD_TOOL_SUGGESTION)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, controller])

  const handleSubmit = useCallback(
    (message: { text: string, files: FileUIPart[] }) => {
      const { text, files } = message
      if (!text.trim() && files.length === 0)
        return
      // 发送后立即清空输入框和附件，不等待流式结束
      controller.textInput.clear()
      attachments.clear()
      store.chat.startStreaming(text, files)
    },
    [controller, attachments],
  )

  return (
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
      <div className="flex gap-2 justify-between">
        <MessageAreaExtras />
        <div className="flex gap-2">
          {SHOW_ATTACHMENTS && <AttachButton />}
          <PromptInputSubmit
            className="cursor-pointer"
            status={isStreaming ? 'streaming' : undefined}
            onStop={() => store.chat.stopStreaming()}
          />
        </div>
      </div>
    </PromptInput>
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
