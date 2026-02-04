'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Filter } from 'lucide-react'

interface Department {
  id: string
  name: string
}

interface UserFiltersProps {
  currentDepartment?: string
  departments: Department[]
}

export default function UserFilters({ currentDepartment, departments }: UserFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()



  const updateFilter = (value: string) => {
    if (value) {
      router.push(`${pathname}?department=${value}`)
    } else {
      router.push(pathname)
    }
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-4 mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filtros:</span>
        </div>

        <select
          value={currentDepartment || ''}
          onChange={(e) => updateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos los departamentos</option>
          {departments?.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {currentDepartment && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
