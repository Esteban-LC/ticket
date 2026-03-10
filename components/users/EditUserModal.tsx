'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { X, Shield, KeyRound } from 'lucide-react'
import { isPermissionEffectivelyChecked, USER_PERMISSION_GROUPS } from '@/lib/permissions'

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
    role: string
    permissions?: string[]
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
    role: user.role || 'EDITOR',
    permissions: user.permissions || ([] as string[]),
    newPassword: '',
  })

  const isCurrentUser = session?.user?.id === user.id

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((err) => console.error('Error fetching departments:', err))
  }, [])

  const togglePermission = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((permission) => permission !== key)
        : [...prev.permissions, key],
    }))
  }

  const isEffectivelyChecked = (permissionKey: string) =>
    isPermissionEffectivelyChecked(
      { role: formData.role, permissions: formData.permissions },
      permissionKey
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword && formData.newPassword.length < 6) {
      alert('La contrasena debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        departmentId: formData.departmentId || null,
        role: formData.role,
        permissions: formData.permissions,
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
    if (!confirm('Estas seguro de que quieres eliminar este usuario?')) return

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El email no se puede modificar
              </p>
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
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isCurrentUser}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="VIEWER">Lector (solo lectura)</option>
                <option value="EDITOR">Editor (crea y edita sus datos)</option>
                <option value="COORDINATOR">Coordinador (lider de area)</option>
                <option value="ADMIN">Administrador (acceso total)</option>
              </select>
              {isCurrentUser && (
                <p className="text-xs text-amber-500 mt-1">No puedes cambiar tu propio rol</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <KeyRound className="h-4 w-4" />
                Permisos Especiales
              </label>
              {formData.role === 'ADMIN' && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
                  Los administradores heredan acceso total por rol. Aqui se muestran marcados los permisos efectivos; "Ver reportes por departamento" solo se marca si tambien fue asignado explicitamente.
                </p>
              )}
              <div className="space-y-4">
                {USER_PERMISSION_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      {group.title}
                    </p>
                    <div className="space-y-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isEffectivelyChecked(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {perm.label}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva Contrasena
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Dejar en blanco para mantener la actual"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimo 6 caracteres. Dejar vacio para no cambiar.
              </p>
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
