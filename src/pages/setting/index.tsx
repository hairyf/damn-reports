import { SettingAboutCard } from '@/ui/setting-about-card'
import { SettingAutoCard } from '@/ui/setting-auto-card'
import { SettingN8nCard } from '@/ui/setting-n8n-card'
import { SettingOtherCard } from '@/ui/setting-other-card'
import { SettingUserInterfaceCard } from '@/ui/setting-user-interface-card'

function Page() {
  return (
    <div className="columns-1 lg:columns-2 gap-4">
      <div className="break-inside-avoid mb-4">
        <SettingUserInterfaceCard />
      </div>
      <div className="break-inside-avoid mb-4">
        <SettingAutoCard />
      </div>
      <div className="break-inside-avoid mb-4">
        <SettingN8nCard />
      </div>
      <div className="break-inside-avoid mb-4">
        <SettingOtherCard />
      </div>
      <div className="break-inside-avoid mb-4">
        <SettingAboutCard />
      </div>
    </div>
  )
}

export default Page
