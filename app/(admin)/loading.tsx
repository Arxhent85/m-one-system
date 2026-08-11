export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-surface-800 rounded-lg" />
          <div className="h-4 w-72 bg-surface-800/60 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-surface-800 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="w-9 h-9 bg-surface-800 rounded-lg" />
            <div className="h-8 w-28 bg-surface-800 rounded" />
            <div className="h-3 w-20 bg-surface-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="glass-card p-5 space-y-4">
        <div className="h-10 w-full bg-surface-800/50 rounded-lg" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-surface-800/30 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
