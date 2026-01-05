import { Button, Card, CardBody } from '@heroui/react'
import { input } from '@heroui/theme'
import { Icon } from '@iconify/react'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useHover, useKey } from 'react-use'

export function ReportEditor() {
  const [hasTodayReport, setHasTodayReport] = useState(false)
  const [isUnsaved, setIsUnsaved] = useState(false)
  const [isAutoSaved, setIsAutoSaved] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '输入Markdown格式的报告内容...',
      }),
    ],
    content: '',
    onUpdate: () => {
      setIsUnsaved(true)
      setIsAutoSaved(false)
    },
  })

  const handleGenerateReport = () => {
    setHasTodayReport(true)
    editor?.commands.setContent('<h1>今日报告</h1><h2>概述</h2><p>这里是报告内容...</p>')
    setIsUnsaved(false)
    setIsAutoSaved(false)
  }

  const handleSaveReport = () => {
    setIsUnsaved(false)
    setIsAutoSaved(true)
    // 这里应该调用API保存报告
    // 可以通过 editor?.getHTML() 获取 HTML 内容
    // 或通过 editor?.getJSON() 获取 JSON 格式
    setTimeout(() => {
      setIsAutoSaved(false)
    }, 2000)
  }

  // 监听 Ctrl+S (或 Mac 上的 Cmd+S) 快捷键保存
  useKey(
    event => (event.ctrlKey || event.metaKey) && event.key === 's',
    (event) => {
      // 只有在有报告内容且处于已生成状态时才保存
      if (hasTodayReport && isUnsaved) {
        event.preventDefault()
        handleSaveReport()
      }
    },
    { event: 'keydown' },
  )

  const [hoverable] = useHover(() => {
    return (
      <div
        className={input({ isMultiline: true }).inputWrapper({ class: 'flex-1 items-start px-0' })}
      >
        <EditorContent editor={editor} className="size-full [&_>_div]:min-h-full" />
      </div>
    )
  })

  return (
    <Card className="flex-1">
      <CardBody className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">当天报告</h3>
          {isUnsaved && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-xs text-default-500">未保存</span>
            </div>
          )}
          {isAutoSaved && !isUnsaved && (
            <span className="text-xs text-success">已自动保存</span>
          )}
        </div>

        {!hasTodayReport
          ? (
            // 未生成状态
              <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Icon icon="lucide:file-text" className="w-18 h-18 text-default-400" />
                  <p className="text-default-500 text-center">
                    暂无数据，点击按钮进行生成
                  </p>
                </div>
                <Button
                  color="primary"
                  onPress={handleGenerateReport}
                  radius="full"
                  className="w-30"
                  startContent={<Icon icon="lucide:sparkles" className="w-4 h-4" />}
                >
                  生成
                </Button>
              </div>
            )
          : (
            // 已生成状态 - TipTap编辑器
              <div className="flex flex-col flex-1 gap-4">
                <div className="text-sm text-default-500">
                  {new Date().toISOString().split('T')[0]}
                </div>
                {hoverable}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="light"
                    onPress={() => {
                      setHasTodayReport(false)
                      editor?.commands.clearContent()
                      setIsUnsaved(false)
                      setIsAutoSaved(false)
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSaveReport}
                    isDisabled={!isUnsaved}
                    startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
                  >
                    保存
                  </Button>
                </div>
              </div>
            )}
      </CardBody>
    </Card>
  )
}
