import { Tab, Tabs } from '@heroui/react'
import { Icon } from '@iconify/react'
import { PageHooks } from '@/ui/page-hooks'
import { PageTools } from '@/ui/page-tools'

function Page() {
  return (
    <Tabs classNames={{ tabList: 'overflow-hidden', panel: 'px-0' }} variant="solid">
      <Tab
        key="tools"
        title={(
          <div className="flex items-center gap-2">
            <Icon icon="lucide:wrench" />
            <span>工具</span>
          </div>
        )}
      >
        <PageTools />
      </Tab>
      <Tab
        key="hooks"
        title={(
          <div className="flex items-center gap-2">
            <Icon icon="lucide:webhook" />
            <span>钩子</span>
          </div>
        )}
      >
        <PageHooks />
      </Tab>
    </Tabs>
  )
}

export default Page
