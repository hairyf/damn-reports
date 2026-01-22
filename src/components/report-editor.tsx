import { If, useWhenever } from '@hairy/react-lib'
import {
  addToast,
  Button,
  Card,
  CardBody,
} from '@heroui/react'
import { input } from '@heroui/theme'
import { Icon } from '@iconify/react'
import { useOverlay } from '@overlastic/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useMemo, useState } from 'react'
import { useKey } from 'react-use'
import { Markdown } from 'tiptap-markdown'
import { Dialog } from '@/components/dialog'

dayjs.extend(relativeTime)

export interface ReportEditorProps {
  reportId: number | string
  onCancel?: () => void
  onDeleted?: () => void
  showCancel?: boolean
}

export function ReportEditor({ reportId, ...props }: ReportEditorProps) {
  const queryClient = useQueryClient()
  const openDialog = useOverlay(Dialog)
  const [text, setText] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: '输入报告内容...',
      }),
    ],
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    onUpdate: ({ editor }) => setText(editor.storage.markdown.getMarkdown()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3 text-sm',
      },
    },
  })
  const { data: report } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const report = await db.report.findUnique(reportId)
      return report ?? null
    },
    enabled: !!reportId,
  })

  useWhenever(report, (report) => {
    editor.commands.setContent(report.content || '')
    setText(report.content || '')
  }, { immediate: true })

  const isUnsaved = useMemo(() => {
    if (!report)
      return false
    return text !== (report.content || '')
  }, [text, report])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isUnsaved || !reportId)
        return
      await db.report.update(reportId, {
        content: text,
        updatedAt: dayjs().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report', reportId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!reportId) {
        throw new Error('报告ID不存在')
      }
      await openDialog({
        title: '确认删除',
        message: '确定要删除这条报告吗？此操作无法撤销。',
        confirmText: '删除',
        cancelText: '取消',
      })
      return await db.report.delete(reportId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      props.onDeleted?.()
    },
  })

  async function onCancel() {
    if (isUnsaved) {
      const confirmed = await openDialog({
        title: '确认离开',
        message: '有未保存的更改，确定要离开吗？',
        confirmText: '确定离开',
        cancelText: '取消',
      })
      if (!confirmed) {
        return
      }
    }
    props.onCancel?.()
  }

  async function onCopy() {
    const contentToCopy = text || report?.content || ''
    await navigator.clipboard.writeText(contentToCopy)
    addToast({
      title: '复制成功',
      description: 'Markdown 内容已复制到剪贴板',
      color: 'success',
      timeout: 500,
    })
  }

  useKey(
    (event) => {
      return (event.ctrlKey || event.metaKey) && event.key === 's'
    },
    (event) => {
      if (isUnsaved) {
        event.preventDefault()
        saveMutation.mutate()
      }
    },
    { event: 'keydown' },
  )

  return (
    <>
      <div className="flex justify-between items-center px-4 mb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {report?.name}
            </h3>
            {isUnsaved && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs text-default-500">未保存</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">

            <div className="flex items-center gap-1 text-xs text-default-500">
              <Icon icon="lucide:calendar" />
              <div className="flex items-center gap-1">
                <span className="mt-0.5">
                  {dayjs(report?.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-default-500">
              <Icon icon="lucide:edit" />
              <span>
                {report?.updatedAt ? dayjs(report.updatedAt).fromNow() : ''}
              </span>
            </div>
          </div>
        </div>
        <Button
          onPress={onCopy}
          variant="flat"
          radius="full"
          isDisabled={!text}
          startContent={<Icon icon="lucide:copy" className="w-4 h-4" />}
        >
          复制
        </Button>
      </div>
      <Card className="flex-1" shadow="none">
        <CardBody className="gap-4 absolute inset-0">
          <div className={input({ isMultiline: true }).inputWrapper({ class: 'flex-1 items-start px-0 overflow-y-auto' })}>
            <EditorContent editor={editor} className="size-full [&_>_div]:min-h-full" />
          </div>
          <div className="flex justify-between gap-2">
            <div>
              <Button
                color="danger"
                variant="light"
                radius="full"
                onPress={() => deleteMutation.mutate()}
                isDisabled={deleteMutation.isPending}
                startContent={<Icon icon="lucide:trash" className="w-4 h-4" />}
              >
                删除
              </Button>
            </div>
            <div className="flex gap-2">
              <If cond={props.showCancel}>
                <Button
                  variant="light"
                  onPress={onCancel}
                  radius="full"
                >
                  返回
                </Button>
              </If>

              <Button
                color="primary"
                onPress={() => saveMutation.mutate()}
                isDisabled={!isUnsaved || saveMutation.isPending}
                radius="full"
                startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
              >
                保存
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
