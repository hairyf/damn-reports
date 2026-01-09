import { Input } from '@heroui/react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'

export function SourceFormClickup() {
  const { control } = useFormContext()

  return (
    <div className="flex flex-col gap-4">
      <FormField
        rules={{ required: 'Please enter your API Token' }}
        control={control}
        name="config.apiToken"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Token</FormLabel>
            <FormControl>
              <Input
                {...field}
                labelPlacement="outside"
                placeholder="Enter your API Token"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        rules={{ required: 'Please enter your Team ID' }}
        control={control}
        name="config.teamId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Team ID</FormLabel>
            <FormControl>
              <Input
                {...field}
                labelPlacement="outside"
                placeholder="Enter your Team ID"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        rules={{ required: 'Please enter your User ID' }}
        control={control}
        name="config.userId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>User ID</FormLabel>
            <FormControl>
              <Input
                {...field}
                labelPlacement="outside"
                placeholder="Enter your User ID"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
