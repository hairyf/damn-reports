import type { DataSource } from '@/components/source-item'
import {
  Button,
  Tab,
  Tabs,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const mockLocalDataSources: DataSource[] = [
  {
    id: '1',
    name: 'Git Dir',
    type: 'local',
    typeId: 'git',
    enabled: true,
  },
  {
    id: '2',
    name: 'Process',
    type: 'local',
    typeId: 'process',
    enabled: false,
  },
]

const mockThirdPartyDataSources: DataSource[] = [
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
  const [selectedTab, setSelectedTab] = useState<'local' | 'third-party'>('local')

  function handleAdd() {
    navigate('/source/create')
  }

  const currentSources = selectedTab === 'local' ? mockLocalDataSources : mockThirdPartyDataSources

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">数据源</h2>
        <Button
          color="primary"
          onPress={handleAdd}
          startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
        >
          添加数据源+
        </Button>
      </div>
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={key => setSelectedTab(key as 'local' | 'third-party')}
        aria-label="数据源类型"
        variant="underlined"
      >
        <Tab key="local" title="本地数据" />
        <Tab key="third-party" title="第三方" />
      </Tabs>
      <div className="space-y-4">
        {currentSources.length === 0
          ? (
              <div className="text-center py-8 text-default-500">
                暂无数据源
              </div>
            )
          : (
              currentSources.map((source) => {
                return (
                  <SourceItem
                    key={source.id}
                    item={source}
                  />
                )
              })
            )}
      </div>
    </div>
  )
}

export default Page
