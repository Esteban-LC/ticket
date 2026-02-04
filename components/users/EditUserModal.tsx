'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'

interface Department {
  id: string
  name: string
  isAdmin: boolean
}

interface EditUserModalProps {
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
    location: string | null
    department?: {
      id: string
      name: string
    } | null
  }
  onClose: () => void
}

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    name: user.name || '',
    departmentId: user.department?.id || '',
    phone: user.phone || '',
    location: user.location || '',
    newPassword: '',
  })

  const isCurrentUser = session?.user?.id === user.id

  useEffect(() => {
    // Fetch departments
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error('Error fetching departments:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar longitud de contraseña si se proporciona
    if (formData.newPassword && formData.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      // Solo enviar la contraseña si se proporcionó una nueva
      const updateData: any = {
        name: formData.name,
        departmentId: formData.departmentId || null,
        phone: formData.phone,
        location: formData.location,
      }

      if (formData.newPassword) {
        updateData.password = formData.newPassword
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedDepartment = departments.find(d => d.id === formData.departmentId)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Usuario</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">El email no se puede modificar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departamento
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sin departamento</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} {dept.isAdmin && '(Administrador)'}
                  </option>
                ))}
              </select>
              {selectedDepartment && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedDepartment.isAdmin
                    ? '✓ Este departamento tiene permisos de administrador'
                    : 'Este departamento tiene permisos de usuario'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Dejar en blanco para mantener la actual"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mínimo 6 caracteres. Dejar vacío para no cambiar.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || isCurrentUser}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Eliminar usuario
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
