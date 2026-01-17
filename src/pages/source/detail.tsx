import { If, useWatch, useWhenever } from '@hairy/react-lib'
import { addToast, Button, Input, Textarea } from '@heroui/react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'
import { SourceFormGit } from '@/components/souce-form-git'

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get('id') || ''
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const form = useForm({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      type: '',
      config: {},
    },
  })

  const source = form.watch('type')
  const config = form.watch('config')

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
    form.setValue('name', source.name)
    form.setValue('description', source.description)

    form.setValue('config', source.config)
    form.setValue('type', source.type)
    setConfigs(prev => ({ ...prev, [source.type]: source.config }))
  }
  useWhenever(sourceId, reset, { immediate: true })

  const onSubmit = async (data: any) => {
    if (sourceId) {
      await db.source.update(sourceId, { ...data })
      addToast({
        title: 'Success',
        description: 'Source updated successfully',
        color: 'success',
      })
    }
    else {
      await db.source.create({ ...data, enabled: true })
      addToast({
        title: 'Success',
        description: 'Source created successfully',
        color: 'success',
      })
    }
    // navigate('/source')
    reset()
    queryClient.invalidateQueries({ queryKey: ['sources'] })
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Please enter source name' }}
          render={({ field }) => (
            <FormItem>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description(optional)</FormLabel>
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

        <FormField
          control={form.control}
          name="type"
          rules={{ required: 'Please select a source' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <SourceSelect onChange={field.onChange} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <If cond={source === 'git'}>
          <SourceFormGit />
        </If>
        <If cond={source === 'clickup'}>
          <SourceFormClickup />
        </If>

        <div className="flex gap-4 mt-4">
          <Button type="button" color="default" onPress={() => navigate('/source')}>
            Cancel
          </Button>
          <Button type="submit" color="primary" className="flex-1">
            {sourceId ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default Page
