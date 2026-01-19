import { If, useWhenever } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  Chip,
} from '@heroui/react'
import { input } from '@heroui/theme'
import { Icon } from '@iconify/react'
import { useOverlay } from '@overlastic/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useKey } from 'react-use'
import { Markdown } from 'tiptap-markdown'
import { Dialog } from '@/components/dialog'

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
    <Card className="flex-1">
      <CardBody className="gap-4">
        <div className="flex justify-between">
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
            <div className="flex gap-2">
              <Chip size="sm">
                <div className="flex items-center gap-1">
                  <Icon icon="lucide:calendar" />
                  <span className="mt-0.5">
                    {dayjs(report?.createdAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
              </Chip>
            </div>
          </div>
          <div className="flex mt-1 gap-1 text-xs text-default-500">
            <Icon icon="lucide:edit" className="w-4 h-4" />
            <span>
              {dayjs(report?.updatedAt).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-4">
          <div className={input({ isMultiline: true }).inputWrapper({ class: 'flex-1 items-start px-0' })}>
            <EditorContent editor={editor} className="size-full [&_>_div]:min-h-full" />
          </div>
          <div className="flex justify-between gap-2">
            <div>
              <Button
                color="danger"
                variant="light"
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
                >
                  取消
                </Button>
              </If>
              <Button
                color="primary"
                onPress={() => saveMutation.mutate()}
                isDisabled={!isUnsaved || saveMutation.isPending}
                startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
