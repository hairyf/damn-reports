import {
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function Page() {
  const navigate = useNavigate()
  // const { id } = useParams()
  // const isEditMode = !!id

  const [selectedType, setSelectedType] = useState<string>('')
  const [_formData, setFormData] = useState<Record<string, string>>({})

  const selectedDataSourceType = dataSourceTypes.find(type => type.id === selectedType)
  const isThirdParty = selectedDataSourceType?.category === 'third-party'

  function handleCancel() {
    navigate('/source')
  }

  function handleSave() {
    // TODO: 实现保存逻辑
    navigate('/source')
  }

  function handleAuthorize() {
    // TODO: 实现授权逻辑
    // 授权逻辑将在这里实现
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">添加数据源</h2>
      </div>

      <Card>
        <CardBody className="gap-6">
          <div>
            <Select
              label="数据源类型"
              placeholder="请选择数据源类型"
              selectedKeys={selectedType ? [selectedType] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string
                setSelectedType(selected || '')
                setFormData({})
              }}
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
                <Button
                  color="primary"
                  onPress={handleSave}
                  startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
                >
                  保存
                </Button>
              </div>
            </>
          )}

          {!selectedType && (
            <div className="min-h-[400px] flex items-center justify-center text-default-500">
              请先选择数据源类型
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default Page
