import { Card } from '@heroui/react'
import { useStore } from 'valtio-define'

function Page() {
  const { email, password, workflow } = useStore(store.n8n)
  const params = new URLSearchParams([
    ['email', email || N8N_LOGIN_DATA.emailOrLdapLoginId],
    ['password', password || N8N_LOGIN_DATA.password],
    ['hideUI', 'true'], // 通过 URL 参数告诉 n8n 隐藏 UI 元素
  ])
  const n8nUrl = `http://localhost:5678/workflow/${workflow}?${params.toString()}`

  // eslint-disable-next-line no-console
  console.log('N8N URL:', n8nUrl)

  return (
    <Card className="flex-1 relative opacity-80" shadow="none">
      <iframe
        src={n8nUrl}
        className="w-full h-full border-0"
        title="n8n 工作流编辑器"
      />
    </Card>
  )
}

export default Page
