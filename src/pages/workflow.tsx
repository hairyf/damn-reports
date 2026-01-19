import { useStore } from 'valtio-define'

function Page() {
  const { n8nEmail, n8nPassword, workflowId } = useStore(store.user)
  const params = new URLSearchParams([
    ['email', n8nEmail || N8N_LOGIN_DATA.emailOrLdapLoginId],
    ['password', n8nPassword || N8N_LOGIN_DATA.password],
    ['hideUI', 'true'], // 通过 URL 参数告诉 n8n 隐藏 UI 元素
  ])
  const n8nUrl = `http://localhost:5678/workflow/${workflowId}?${params.toString()}`

  return (
    <iframe
      src={n8nUrl}
      className="w-full h-full border-0"
      title="n8n 工作流编辑器"
      allow="clipboard-read; clipboard-write"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    />
  )
}

export default Page
