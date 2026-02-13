export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  )
}
