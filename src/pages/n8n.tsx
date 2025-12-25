function Page() {
  const n8nUrl = 'http://localhost:5678'

  return (
    <layouts.default>
      <section className="flex flex-col gap-4 py-8 md:py-10 h-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">n8n 工作流编辑器</h1>
        </div>

        <div className="flex-1 w-full rounded-lg overflow-hidden">
          <iframe
            src={n8nUrl}
            className="w-full h-full min-h-[600px] border-0"
            title="n8n 工作流编辑器"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>
      </section>
    </layouts.default>
  )
}

export default Page
