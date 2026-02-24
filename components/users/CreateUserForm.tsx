'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Shield, Building2, AlertCircle, KeyRound } from 'lucide-react'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  isAdmin: boolean
  description: string | null
}

interface CreateUserFormProps {
  departments: Department[]
}

const AVAILABLE_PERMISSIONS = [
  { key: 'workspace:access', label: 'Workspace', description: 'Acceso al espacio de trabajo compartido para registrar' },
]

export default function CreateUserForm({ departments }: CreateUserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    role: 'EDITOR' as 'ADMIN' | 'COORDINATOR' | 'EDITOR' | 'VIEWER',
    permissions: [] as string[],
  })

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/dashboard/users')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setError('Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-slate-950 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            ← Volver a usuarios
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Crear Nuevo Usuario
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Completa la información para crear un nuevo usuario en el sistema
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Nombre */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nombre y apellidos del usuario
                  </p>
                </div>
              </div>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Juan Pérez García"
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Email */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Correo electrónico <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Email institucional o personal
                  </p>
                </div>
              </div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@liceomichoacano.edu.mx"
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Contraseña y Departamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Contraseña */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Contraseña <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mínimo 6 caracteres
                  </p>
                </div>
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Departamento */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Departamento <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Área de trabajo del usuario
                  </p>
                </div>
              </div>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar departamento</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {formData.departmentId && departments.find(d => d.id === formData.departmentId)?.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {departments.find(d => d.id === formData.departmentId)?.description}
                </p>
              )}
            </div>
          </div>

          {/* Rol */}
          <div>
            {/* Rol */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Rol <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nivel de acceso del usuario
                  </p>
                </div>
              </div>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="VIEWER">Lector (solo lectura)</option>
                <option value="EDITOR">Editor (crea y edita sus datos)</option>
                <option value="COORDINATOR">Coordinador (líder de área)</option>
                <option value="ADMIN">Administrador (acceso total)</option>
              </select>
              <div className="mt-3">
                {formData.role === 'ADMIN' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Acceso completo: Vista General, gestión de usuarios y configuración
                  </p>
                )}
                {formData.role === 'COORDINATOR' && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Ve y gestiona datos de su departamento
                  </p>
                )}
                {formData.role === 'EDITOR' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Crea y edita sus propios datos
                  </p>
                )}
                {formData.role === 'VIEWER' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Solo puede ver sus datos, sin crear ni editar
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Permisos Especiales - para roles no ADMIN */}
          {formData.role !== 'ADMIN' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Permisos Especiales
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Otorga accesos adicionales a secciones específicas del sistema
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.key)}
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
              {formData.permissions.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 italic">
                  Sin permisos adicionales. El usuario solo tendrá acceso a sus vistas personales.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Link
              href="/dashboard/users"
              className="px-6 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Creando usuario...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
