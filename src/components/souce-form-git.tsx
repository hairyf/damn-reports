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
        setValue('config.dir', selected)
      }
    }
    catch (error) {
      console.error('Failed to open directory dialog:', error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={control}
        name="config.dir"
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
        name="config.branch"
        rules={{ required: 'Please enter your Git branch' }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Git Branch</FormLabel>
            <FormControl>
              <Input
                {...field}
                labelPlacement="outside"
                placeholder="Enter your Git Branch"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.username"
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
    </div>
  )
}
