export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <div className="h-7 w-36 rounded bg-muted" />
        <div className="h-4 w-80 max-w-full rounded bg-muted" />
      </div>
      <div className="h-11 border-b bg-muted/30" />
      <div className="grid grid-cols-2 gap-px border bg-border lg:grid-cols-4">
        {[0, 1, 2, 3].map(item => <div key={item} className="h-28 bg-background" />)}
      </div>
      <div className="h-72 rounded bg-muted/40" />
    </div>
  );
}
