import type { SourceJson } from '@/api/sources'
import { createSource, getSourceById, updateSource } from '@/api/sources'
import { getToolOptions } from '@/api/tools'
import { If, useWatch, useWhenever } from '@hairy/react-lib'
import { isEqual } from '@hairy/utils'
import { addToast, Button, Card, CardBody, CardHeader, Divider, Input } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useForm } from 'react-hook-form'
import { useKey } from 'react-use'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'
import { SourceFormClickup } from '@/components/souce-form-clickup'
import { SourceFormGit } from '@/components/souce-form-git'
import { useQuery } from '@tanstack/react-query'

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get('id')
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [originalData, setOriginalData] = useState<Partial<SourceJson> | null>(null)
  const { data: toolOptions = [] } = useQuery({ queryKey: ['tool-options'], queryFn: getToolOptions })
  const form = useForm({
    defaultValues: {
      name: '',
      tool: '',
      config: {} as Record<string, any>,
    },
  })

  const tool = form.watch('tool')
  const config = form.watch('config')
  const formValues = form.watch()

  useWatch(tool, (t, oldTool) => {
    if (!oldTool)
      return
    setConfigs(prev => ({ ...prev, [oldTool]: config }))
    form.setValue('config', configs[t] || {})
  })

  async function reset() {
    if (!sourceId)
      return
    const source = await getSourceById(sourceId)
    if (!source)
      return
    const parsed = { name: source.name, tool: source.tool, config: source.config }
    form.reset(parsed)
    setConfigs(prev => ({ ...prev, [parsed.tool]: parsed.config }))
    setOriginalData(parsed)
  }

  useWhenever(sourceId, reset, { immediate: true })

  // 对比数据是否有变化
  const hasChanges = sourceId ? !isEqual(formValues, originalData) : true

  const onSubmit = form.handleSubmit(async (data) => {
    if (sourceId) {
      await updateSource(sourceId, { name: data.name, tool: data.tool, config: data.config })
      reset()
      addToast({
        title: 'Success',
        description: 'Source updated successfully',
        color: 'success',
        timeout: 500,
      })
    }
    else {
      await createSource({ name: data.name, tool: data.tool, config: data.config })
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
                isDisabled={sourceId ? !hasChanges : !hasChanges}
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
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Please enter source name' }}
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
                  rules={{ required: 'Please select a tool' }}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Tool</FormLabel>
                      <FormControl>
                        <SourceSelect onChange={field.onChange} value={field.value} />
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
                <SourceIcon type={tool} size={18} />
                <p className="text-md flex gap-1">
                  <span>
                    {toolOptions.find(o => o.id === tool)?.name ?? tool}
                  </span>
                  <span>配置</span>
                </p>
              </CardHeader>
              <Divider className="opacity-30 shadow" />

              <CardBody className="flex flex-col gap-4">
                <If cond={tool === 'git_directory' || tool === 'git'}>
                  <SourceFormGit />
                </If>
                <If cond={tool === 'clickup'}>
                  <SourceFormClickup />
                </If>
              </CardBody>
            </Card>
          </If>
        </div>
      </form>
    </Form>
  )
}

export default Page
