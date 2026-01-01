function Page() {
  const n8nUrl = 'http://localhost:5678'

  return (
    <iframe
      src={n8nUrl}
      className="w-full h-full min-h-[600px] border-0"
      title="n8n 工作流编辑器"
      allow="clipboard-read; clipboard-write"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    />
  )
}

export default Page
