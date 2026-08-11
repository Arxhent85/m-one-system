export default function DriverLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-surface-800 rounded" />
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 h-24 bg-surface-800/40" />
        <div className="glass-card p-4 h-24 bg-surface-800/40" />
      </div>
      <div className="glass-card p-4 h-48 bg-surface-800/40" />
    </div>
  )
}
