import { useWhenever } from '@hairy/react-lib'
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
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useKey } from 'react-use'
import { Dialog } from '@/components/dialog'
import { sql_deleteReport } from '@/services/sql-report-delete'
import { sql_queryReportById } from '@/services/sql-report-query_id'
import { sql_updateReport } from '@/services/sql-report-update'

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reportId = searchParams.get('id') || ''
  const queryClient = useQueryClient()
  const openDialog = useOverlay(Dialog)
  const [text, setText] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '输入报告内容...',
      }),
    ],
    onUpdate: ({ editor }) => setText(editor.getText()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3 text-sm',
      },
    },
  })

  const { data: report, refetch: refetchReport } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => sql_queryReportById(reportId),
    enabled: !!reportId,
  })

  useWhenever(report, (report) => {
    editor.commands.setContent(report.content || '')
    setText(report.content || '')
  })

  const isUnsaved = useMemo(() => {
    if (!report)
      return false
    return text !== (report.content || '')
  }, [text, report])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isUnsaved || !reportId)
        return
      await sql_updateReport({
        id: reportId,
        content: text,
      })
      refetchReport()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!reportId) {
        throw new Error('报告ID不存在')
      }
      return await sql_deleteReport(reportId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate('/report')
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
    navigate('/report')
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
            {report?.updatedAt !== report?.createdAt && (
              <div className="flex mt-1 gap-1 text-xs text-default-500">
                <Icon icon="lucide:edit" className="w-4 h-4" />
                <span>
                  {dayjs(report?.updatedAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
            )}
          </div>
          {/* <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">{report?.name}</h4>
            <div className="flex items-center gap-4 text-sm text-default-500">
              <div className="flex items-center gap-1">
                <Icon icon="lucide:calendar" className="w-4 h-4" />
                <span>
                  创建时间:
                  {dayjs(report?.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>

            </div>
          </div> */}

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
                  isLoading={deleteMutation.isPending}
                  startContent={<Icon icon="lucide:trash" className="w-4 h-4" />}
                >
                  删除
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="light"
                  onPress={onCancel}
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={() => saveMutation.mutate()}
                  isDisabled={!isUnsaved || saveMutation.isPending}
                  isLoading={saveMutation.isPending}
                  startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default Page
