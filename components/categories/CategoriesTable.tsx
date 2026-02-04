'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import EditCategoryModal from './EditCategoryModal'

interface Category {
  id: string
  name: string
  email: string | null
  createdAt: string
  updatedAt: string
}

export default function CategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error al eliminar categoría:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Cargando categorías...</p>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No hay categorías registradas</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-100 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha de Creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-100 dark:hover:bg-slate-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {category.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {category.email ? (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4 mr-2" />
                      {category.email}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Sin correo</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(category.createdAt), {
                    addSuffix: true,
                    locale: es
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdate={fetchCategories}
        />
      )}
    </>
  )
}
