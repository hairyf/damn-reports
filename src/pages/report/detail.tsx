import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react'
import { input } from '@heroui/theme'
import { Icon } from '@iconify/react'
import { sendNotification } from '@tauri-apps/plugin-notification'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHover, useKey } from 'react-use'
import { createReport, deleteReport, getReportById, updateReport } from '@/utils/mock-db'

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reportId = searchParams.get('id')
  const isEditMode = !!reportId

  const [date, setDate] = useState('')
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  const [isUnsaved, setIsUnsaved] = useState(false)
  const [loading, setLoading] = useState(isEditMode)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '输入报告内容...',
      }),
    ],
    content: '',
    onUpdate() {
      setIsUnsaved(true)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3 text-sm',
      },
    },
  })

  async function loadReport(id: number) {
    try {
      setLoading(true)
      const report = await getReportById(id)
      if (report) {
        setDate(report.date)
        setType(report.type)
        editor?.commands.setContent(report.content)
        setIsUnsaved(false)
      }
      else {
        await sendNotification({ title: '错误', body: '报告不存在' })
        navigate('/reports')
      }
    }
    catch (error) {
      console.error('Failed to load report:', error)
      await sendNotification({ title: '错误', body: '加载报告失败' })
      navigate('/reports')
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEditMode && reportId) {
      loadReport(Number.parseInt(reportId))
    }
    else {
      const today = new Date().toISOString().split('T')[0]
      setDate(today)
      setLoading(false)
    }
  }, [reportId, isEditMode])

  async function handleSave() {
    if (!date || !editor) {
      await sendNotification({ title: '错误', body: '请填写日期和内容' })
      return
    }

    try {
      const content = editor.getHTML()
      if (isEditMode && reportId) {
        await updateReport(Number.parseInt(reportId), { content })
        await sendNotification({ title: '成功', body: '报告已更新' })
      }
      else {
        await createReport({ date, content, type })
        await sendNotification({ title: '成功', body: '报告已保存' })
      }
      setIsUnsaved(false)
      setTimeout(() => {
        navigate('/reports')
      }, 500)
    }
    catch (error) {
      console.error('Failed to save report:', error)
      await sendNotification({ title: '错误', body: '保存报告失败' })
    }
  }

  async function handleDelete() {
    if (!reportId)
      return

    try {
      await deleteReport(Number.parseInt(reportId))
      await sendNotification({ title: '成功', body: '报告已删除' })
      onClose()
      setTimeout(() => {
        navigate('/reports')
      }, 500)
    }
    catch (error) {
      console.error('Failed to delete report:', error)
      await sendNotification({ title: '错误', body: '删除报告失败' })
    }
  }

  function handleCancel() {
    if (isUnsaved) {
      setShowCancelConfirm(true)
    }
    else {
      navigate('/reports')
    }
  }

  function handleConfirmCancel() {
    setShowCancelConfirm(false)
    navigate('/reports')
  }

  function getTypeLabel(typeValue: string) {
    const typeMap: Record<string, string> = {
      daily: '日',
      weekly: '周',
      monthly: '月',
      yearly: '年',
    }
    return typeMap[typeValue] || typeValue
  }

  useKey(
    (event) => {
      return (event.ctrlKey || event.metaKey) && event.key === 's'
    },
    (event) => {
      if (isUnsaved) {
        event.preventDefault()
        handleSave()
      }
    },
    { event: 'keydown' },
  )

  const [hoverable] = useHover((hover) => {
    return (
      <div
        className={input({ isMultiline: true }).inputWrapper({ class: 'flex-1 items-start px-0 hover:' })}
        {...{ 'data-hover': hover }}
      >
        <EditorContent editor={editor} className="size-full [&_>_div]:min-h-full" />
      </div>
    )
  })

  if (loading) {
    return (
      <layouts.default title={isEditMode ? '编辑报告' : '新建报告'}>
        <Card>
          <CardBody>
            <div className="flex items-center justify-center py-12">
              <p className="text-default-500">加载中...</p>
            </div>
          </CardBody>
        </Card>
      </layouts.default>
    )
  }

  return (
    <>
      <Card>
        <CardBody className="gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{isEditMode ? '编辑报告' : '新建报告'}</h3>
            {isUnsaved && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs text-default-500">未保存</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {isEditMode
              ? (
                <>
                  <Input
                    label="日期"
                    value={date}
                    className="flex-1"
                    isReadOnly
                  />
                  <Input
                    label="类型"
                    value={getTypeLabel(type)}
                    className="w-full sm:w-40"
                    isReadOnly
                  />
                </>
              )
              : (
                <>
                  <Input
                    type="date"
                    label="日期"
                    value={date}
                    onValueChange={setDate}
                    className="flex-1"
                    isRequired
                  />
                  <Select
                    label="类型"
                    selectedKeys={[type]}
                    onSelectionChange={function (keys) {
                      const selected = Array.from(keys)[0] as string
                      setType(selected as typeof type)
                    }}
                    className="w-full sm:w-40"
                  >
                    <SelectItem key="daily">日</SelectItem>
                    <SelectItem key="weekly">周</SelectItem>
                    <SelectItem key="monthly">月</SelectItem>
                    <SelectItem key="yearly">年</SelectItem>
                  </Select>
                </>
              )}
          </div>

          <div className="flex flex-col flex-1 gap-4 min-h-[500px]">
            {hoverable}
            <div className="flex justify-between gap-2">
              <div>
                {isEditMode && (
                  <Button
                    color="danger"
                    variant="light"
                    onPress={onOpen}
                    startContent={<Icon icon="lucide:trash" className="w-4 h-4" />}
                  >
                    删除
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="light"
                  onPress={handleCancel}
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isDisabled={!isUnsaved}
                  startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {function (onClose) {
            return (
              <>
                <ModalHeader className="flex flex-col gap-1">确认删除</ModalHeader>
                <ModalBody>
                  <p>确定要删除这条报告吗？此操作无法撤销。</p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    取消
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleDelete}
                  >
                    删除
                  </Button>
                </ModalFooter>
              </>
            )
          }}
        </ModalContent>
      </Modal>

      <Modal isOpen={showCancelConfirm} onClose={function () { setShowCancelConfirm(false) }}>
        <ModalContent>
          {function (onClose) {
            return (
              <>
                <ModalHeader className="flex flex-col gap-1">确认离开</ModalHeader>
                <ModalBody>
                  <p>有未保存的更改，确定要离开吗？</p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    取消
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleConfirmCancel}
                  >
                    确定离开
                  </Button>
                </ModalFooter>
              </>
            )
          }}
        </ModalContent>
      </Modal>
    </>
  )
}

export default Page
