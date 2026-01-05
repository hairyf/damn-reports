import {
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ClickupIcon, GitIcon, GmailIcon } from '@/components/icons'

interface DataSourceType {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number }>
  category: 'local' | 'third-party'
}

const dataSourceTypes: DataSourceType[] = [
  {
    id: 'git-dir',
    name: 'Git Dir',
    icon: GitIcon,
    category: 'local',
  },
  {
    id: 'process',
    name: 'Process',
    icon: GitIcon,
    category: 'local',
  },
  {
    id: 'email',
    name: 'Email',
    icon: GmailIcon,
    category: 'third-party',
  },
  {
    id: 'clickup',
    name: 'Clickup',
    icon: ClickupIcon,
    category: 'third-party',
  },
]

// 模拟数据源数据（实际应该从 API 获取）
interface DataSource {
  id: string
  name: string
  type: 'local' | 'third-party'
  typeId: string
  enabled: boolean
}

const mockDataSources: DataSource[] = [
  {
    id: '1',
    name: 'Git Dir',
    type: 'local',
    typeId: 'git-dir',
    enabled: true,
  },
  {
    id: '2',
    name: 'Process',
    type: 'local',
    typeId: 'process',
    enabled: false,
  },
  {
    id: '3',
    name: 'Email',
    type: 'third-party',
    typeId: 'email',
    enabled: true,
  },
  {
    id: '4',
    name: 'Clickup',
    type: 'third-party',
    typeId: 'clickup',
    enabled: false,
  },
]

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const [selectedType, setSelectedType] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<DataSource | null>(null)

  useEffect(() => {
    async function loadDataSource() {
      if (id) {
        setLoading(true)
        // 模拟加载数据（实际应该从 API 获取）
        const source = mockDataSources.find(s => s.id === id)
        if (source) {
          setDataSource(source)
          setSelectedType(source.typeId)
        }
        setLoading(false)
      }
      else {
        setLoading(false)
      }
    }
    loadDataSource()
  }, [id])

  const selectedDataSourceType = dataSourceTypes.find(type => type.id === selectedType)
  const isThirdParty = selectedDataSourceType?.category === 'third-party'

  function handleCancel() {
    navigate('/source')
  }

  function handleAuthorize() {
    // TODO: 实现授权逻辑
    // 授权逻辑将在这里实现
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">编辑数据源</h2>
        </div>
        <Card>
          <CardBody>
            <div className="flex items-center justify-center py-12 text-default-500">
              加载中...
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (!dataSource) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">编辑数据源</h2>
        </div>
        <Card>
          <CardBody>
            <div className="flex items-center justify-center py-12 text-default-500">
              数据源不存在
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="light"
                onPress={handleCancel}
              >
                返回
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">编辑数据源</h2>
      </div>

      <Card>
        <CardBody className="gap-6">
          <div>
            <Select
              label="数据源类型"
              selectedKeys={selectedType ? [selectedType] : []}
              isDisabled
              className="max-w-xs"
            >
              {dataSourceTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <SelectItem
                    key={type.id}
                    startContent={<IconComponent size={20} />}
                  >
                    {type.name}
                  </SelectItem>
                )
              })}
            </Select>
          </div>

          {selectedType && (
            <>
              <div className="grid grid-cols-2 gap-4 min-h-[200px] p-4 border border-divider rounded-lg bg-default-50">
                <div className="text-sm text-default-500 flex items-center justify-center">
                  数据源相关的表单字段将显示在这里
                </div>
              </div>

              {isThirdParty && (
                <div>
                  <Button
                    color="primary"
                    variant="bordered"
                    onPress={handleAuthorize}
                    startContent={<Icon icon="lucide:key" className="w-4 h-4" />}
                  >
                    第三方授权
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-divider">
                <Button
                  variant="light"
                  onPress={handleCancel}
                >
                  取消
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default Page
