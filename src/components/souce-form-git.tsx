import { Button, Input } from '@heroui/react'
import { open } from '@tauri-apps/plugin-dialog'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'

export function SourceFormGit() {
  const { control, setValue } = useFormContext()

  const handleOpenDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      })
      if (selected && typeof selected === 'string') {
        setValue('config.repository', selected)
      }
    }
    catch (error) {
      console.error('Failed to open directory dialog:', error)
    }
  }

  return (
    <>

      <FormField
        control={control}
        name="config.repository"
        rules={{ required: 'Please select Git directory' }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Git Directory</FormLabel>
            <FormControl>
              <div className="flex gap-2">
                <Input
                  {...field}
                  labelPlacement="outside"
                  placeholder="Select directory"
                  isReadOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  onPress={handleOpenDirectory}
                  color="primary"
                  variant="bordered"
                >
                  选择目录
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.author"
        rules={{ required: 'Please enter your Git username' }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Git Username</FormLabel>
            <FormControl>
              <Input
                {...field}
                labelPlacement="outside"
                placeholder="Enter your Git Username"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
