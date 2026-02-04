'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Shield, Phone, Building2, AlertCircle, Building } from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  domain: string | null
}

interface Department {
  id: string
  name: string
  isAdmin: boolean
  description: string | null
}

interface CreateUserFormProps {
  organizations: Organization[]
  departments: Department[]
}

export default function CreateUserForm({ organizations, departments }: CreateUserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    departmentId: '',
    organizationId: '',
    isManualAdmin: false,
  })

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
                placeholder="usuario@empresa.com"
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Seguridad y Acceso */}
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
                    {dept.name} {dept.isAdmin ? '(Administrador)' : ''}
                  </option>
                ))}
              </select>
              {formData.departmentId && departments.find(d => d.id === formData.departmentId)?.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {departments.find(d => d.id === formData.departmentId)?.description}
                </p>
              )}

              {/* Checkbox para administrador manual */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isManualAdmin}
                    onChange={(e) => setFormData({ ...formData, isManualAdmin: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Otorgar permisos de administrador
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Permite acceso administrativo independientemente del departamento
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Organización */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Building className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Organización
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Asignar a una unidad organizativa
                </p>
              </div>
            </div>
            <select
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sin organización</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} {org.domain ? `(@${org.domain})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Información de Contacto */}
          <div>
            {/* Teléfono */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Phone className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Teléfono
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Número de contacto
                  </p>
                </div>
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+52 123 456 7890"
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

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
