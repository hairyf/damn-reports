import type { Source } from '@/database/types'
import { If, useWatch, useWhenever } from '@hairy/react-lib'
import { isEqual } from '@hairy/utils'
import { addToast, Button, Card, CardBody, CardHeader, Divider, Input, Textarea } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useForm } from 'react-hook-form'
import { useKey } from 'react-use'
import { useStore } from 'valtio-define'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'
import { SourceFormGit } from '@/components/souce-form-git'

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get('id')
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [originalData, setOriginalData] = useState<Partial<Source> | null>(null)
  const form = useForm({
    defaultValues: {
      id: 0,
      name: '',
      description: '',
      type: '',
      config: {},
    },
  })
  const n8n = useStore(store.n8n)

  const source = form.watch('type')
  const config = form.watch('config')
  const formValues = form.watch()

  useWatch(source, (source, oldSource) => {
    if (!oldSource)
      return
    setConfigs(prev => ({ ...prev, [oldSource]: config }))
    form.setValue('config', configs[source] || {})
  })

  async function reset() {
    const source = await db.source.findUnique(sourceId)

    if (!source)
      return
    const parsedSource = {
      name: source.name,
      description: source.description,
      type: source.type,
      config: JSON.parse(source.config),
    }
    form.reset(parsedSource)
    setConfigs(prev => ({ ...prev, [parsedSource.type]: parsedSource.config }))
    setOriginalData(parsedSource)
  }

  useWhenever(sourceId, reset, { immediate: true })

  // 对比数据是否有变化
  const hasChanges = sourceId ? !isEqual(formValues, originalData) : true

  const onSubmit = form.handleSubmit(async (data) => {
    if (sourceId) {
      await db.source.update(sourceId, {
        name: data.name,
        description: data.description,
        type: data.type,
        config: data.config,
      })
      reset()
      addToast({
        title: 'Success',
        description: 'Source updated successfully',
        color: 'success',
        timeout: 500,
      })
    }
    else {
      await db.source.create({
        updatedAt: new Date().toISOString(),
        workspaceId: n8n.workspace!,
        enabled: true,
        name: data.name,
        description: data.description,
        type: data.type,
        config: data.config,
      })
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
                  name="type"
                  rules={{ required: 'Please select a source' }}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Source</FormLabel>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        labelPlacement="outside"
                        placeholder="Enter source description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardBody>
          </Card>
          <If cond={source}>
            <Card shadow="none">
              <CardHeader className="flex gap-1">
                <SourceIcon type={source} size={18} />
                <p className="text-md flex gap-1">
                  <span>
                    {sourceOptions.find(option => option.value === source)?.label}
                  </span>
                  <span>配置</span>
                </p>
              </CardHeader>
              <Divider className="opacity-30 shadow" />

              <CardBody className="flex flex-col gap-4">
                <If cond={source === 'git'}>
                  <SourceFormGit />
                </If>
                <If cond={source === 'clickup'}>
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
