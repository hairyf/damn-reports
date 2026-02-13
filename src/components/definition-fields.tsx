import { Input } from '@heroui/react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'

export interface FieldSchema {
  type?: string
  description?: string
  optional?: boolean
  default?: string | number | boolean
}

export interface DefinitionFieldsProps {
  /** tool definition: Record<fieldName, { type, description }> */
  definition?: Record<string, FieldSchema>
  /** 表单字段前缀，默认 "params" */
  prefix?: string
}

export function DefinitionFields({ definition, prefix = 'params' }: DefinitionFieldsProps) {
  const { control } = useFormContext()

  if (!definition || Object.keys(definition).length === 0) {
    return <p className="text-sm text-default-400">该工具未定义参数。</p>
  }

  return (
    <>
      {Object.entries(definition).map(([key, schema]) => (
        <FormField
          key={key}
          control={control}
          name={`${prefix}.${key}`}
          rules={{ required: schema.optional ? undefined : `${key} is required` }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {key}
                {schema.optional && (
                  <span className="text-default-400 font-normal ml-1">（可选）</span>
                )}
              </FormLabel>
              {schema.description && (
                <FormDescription>{schema.description}</FormDescription>
              )}
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  labelPlacement="outside"
                  placeholder={
                    schema.default != null
                      ? `${schema.description || key}（默认: ${schema.default}）`
                      : (schema.description || `Enter ${key}`)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </>
  )
}
