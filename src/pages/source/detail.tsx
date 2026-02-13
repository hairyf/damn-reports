import type { Source } from '@/store/modules/source'
import { If, useWhenever } from '@hairy/react-lib'
import { isEqual } from '@hairy/utils'
import { addToast, Button, Card, CardBody, CardHeader, Divider, Input, Textarea } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useForm } from 'react-hook-form'
import { useKey } from 'react-use'
import { store } from '@/store'

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get('id')
  const [originalData, setOriginalData] = useState<Partial<Source> | null>(null)
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      tool: '',
      params: {} as Record<string, any>,
    },
  })

  const tool = form.watch('tool')
  const formValues = form.watch()

  async function reset() {
    if (!sourceId)
      return
    const source = store.source.find(sourceId)
    if (!source)
      return
    const parsed = { name: source.name, description: source.description ?? '', tool: source.tool, params: source.params }
    form.reset(parsed)
    setOriginalData(parsed)
  }

  useWhenever(sourceId, reset, { immediate: true })

  // 对比数据是否有变化
  const hasChanges = sourceId ? !isEqual(formValues, originalData) : true

  const onSubmit = form.handleSubmit(async (data) => {
    if (sourceId) {
      await store.source.update(sourceId, { name: data.name, description: data.description, tool: data.tool, params: data.params })
      reset()
      addToast({
        title: 'Success',
        description: 'Source updated successfully',
        color: 'success',
        timeout: 500,
      })
    }
    else {
      await store.source.create({ name: data.name, description: data.description, tool: data.tool, params: data.params })
      addToast({
        title: 'Success',
        description: 'Source created successfully',
        color: 'success',
      })
      navigate('/source')
    }
    queryClient.invalidateQueries({ queryKey: ['sources'] })
  })

  // 支持 Ctrl + S 快捷键保存
  useKey(
    event => (event.ctrlKey || event.metaKey) && event.key === 's',
    (event) => {
      event.preventDefault()
      hasChanges && onSubmit()
    },
    { event: 'keydown' },
  )

  // 获取当前 tool 的 definition
  const toolDef = store.tool.raw[tool]
  const definition = toolDef?.definition as Record<string, { type?: string, description?: string, optional?: boolean, default?: string | number | boolean }> | undefined

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="max-w-2xl w-full mx-auto">
        <div className="ml-2.5 mb-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">
                添加数据源
              </h3>
              <span className="text-sm text-default-500">
                配置数据源以同步数据。
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                color="default"
                variant="light"
                radius="full"
                onPress={() => navigate('/source')}
              >
                返回
              </Button>
              <Button
                type="submit"
                color="primary"
                radius="full"
                className="flex-1"
                isDisabled={!hasChanges}
                startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
              >
                {sourceId ? '更新' : '创建'}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Card shadow="none">
            <CardHeader className="flex gap-1">
              <Icon icon="lucide:info" className="text-lg mt-0.3" />
              <p className="text-md">基本信息</p>
            </CardHeader>
            <Divider className="opacity-30 shadow" />
            <CardBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: '请输入名称' }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            labelPlacement="outside"
                            placeholder="Enter source name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tool"
                    rules={{ required: '请选择数据源工具' }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>数据源工具</FormLabel>
                        <FormControl>
                          <SourceSelect onChange={field.onChange} value={field.value} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>描述</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          labelPlacement="outside"
                          placeholder="数据源简要说明（可选）"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardBody>
          </Card>
          <If cond={tool}>
            <Card shadow="none">
              <CardHeader className="flex gap-1">
                <Icon icon="lucide:settings" className="text-lg mt-0.3" />
                <p className="text-md flex gap-1">
                  <span>参数配置</span>
                </p>
              </CardHeader>
              <Divider className="opacity-30 shadow" />
              <CardBody className="flex flex-col gap-4">
                <DefinitionFields definition={definition} />
              </CardBody>
            </Card>
          </If>
        </div>
      </form>
    </Form>
  )
}

export default Page
