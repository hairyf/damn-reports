import { Input } from '@heroui/react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'

export function SourceFormClickup() {
  const { control } = useFormContext()

  return (
    <>
      <FormField
        rules={{ required: 'Please enter your API Token' }}
        control={control}
        name="config.token"
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
      <div className="flex gap-4">
        <FormField
          rules={{ required: 'Please enter your Team ID' }}
          control={control}
          name="config.team"
          render={({ field }) => (
            <FormItem className="flex-1">
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
          name="config.user"
          render={({ field }) => (
            <FormItem className="flex-1">
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
    </>
  )
}
