import { SettingAboutCard } from '@/ui/setting-about-card'
import { SettingOtherConfig } from '@/ui/setting-other-config'
import { SettingUserInterfaceCard } from '@/ui/setting-user-interface-card'

function Page() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SettingUserInterfaceCard />
      <SettingOtherConfig />
      <SettingAboutCard />
    </div>
  )
}

export default Page
