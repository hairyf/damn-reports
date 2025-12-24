function Page() {
  return (
    <layouts.default>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Pricing</h1>
        </div>
      </section>
    </layouts.default>
  )
}

export default Page
