export default function AuthenticationLoading() {
  return (
    <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-border/60 shadow-sm">
      <div className="grid min-h-[600px] grid-cols-1 md:grid-cols-2">
        <div className="hidden animate-pulse bg-muted md:block" />
        <div className="space-y-4 bg-background p-10">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}
