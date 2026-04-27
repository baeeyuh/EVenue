export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="h-12 w-1/2 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-xl bg-muted" />
          <div className="h-12 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
        </div>
      </section>
    </main>
  )
}
