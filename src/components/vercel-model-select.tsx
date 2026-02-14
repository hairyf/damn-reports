import { Autocomplete, AutocompleteItem } from '@heroui/react'
import { useCallback, useEffect, useState } from 'react'
import { fetchVercelModels } from '@/store/modules/llm'

export interface VercelModelSelectProps {
  value: string
  onChange: (modelId: string) => void
  placeholder?: string
  ariaLabel?: string
  isDisabled?: boolean
}

/** 从 Vercel AI Gateway API 获取全部 200+ 模型，支持搜索选择 */
export function VercelModelSelect(props: VercelModelSelectProps) {
  const { value, onChange, placeholder, ariaLabel, isDisabled } = props
  const [items, setItems] = useState<Array<{ value: string, label: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const models = await fetchVercelModels()
      setItems(models)
    }
    catch (e) {
      setError(e instanceof Error ? e.message : '获取模型列表失败')
      setItems([])
    }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onSelectionChange = useCallback(
    (key: React.Key | null) => {
      if (key != null && typeof key === 'string')
        onChange(key)
    },
    [onChange],
  )

  if (error) {
    return (
      <div className="text-sm text-danger">
        {error}
        <button
          type="button"
          className="ml-2 underline"
          onClick={load}
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <Autocomplete
      aria-label={ariaLabel ?? undefined}
      placeholder={loading ? '加载模型中...' : placeholder}
      selectedKey={value || null}
      onSelectionChange={onSelectionChange}
      isLoading={loading}
      isDisabled={isDisabled}
      allowsCustomValue={false}
      items={items}
      showScrollIndicators={false}
      scrollShadowProps={{ hideScrollBar: true }}
      classNames={{ popoverContent: '[&>div]:!overflow-hidden' }}
    >
      {item => (
        <AutocompleteItem key={item.value} textValue={item.label}>
          {item.label}
        </AutocompleteItem>
      )}
    </Autocomplete>
  )
}
