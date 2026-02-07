'use client'

import { useState } from 'react'
import { X, Save, Eye, EyeOff, Loader2, UserCog } from 'lucide-react'

interface WorkspaceUser {
  id: string
  primaryEmail: string
  name: { givenName: string; familyName: string; fullName: string }
  orgUnitPath: string
  suspended: boolean
  isAdmin: boolean
  creationTime: string
  lastLoginTime: string
  thumbnailPhotoUrl?: string
}

interface OrgUnit {
  orgUnitId: string
  name: string
  orgUnitPath: string
  parentOrgUnitPath: string
}

interface EditUserModalProps {
  user: WorkspaceUser
  orgUnits: OrgUnit[]
  onClose: () => void
  onUpdated: () => void
}

export default function EditUserModal({ user, orgUnits, onClose, onUpdated }: EditUserModalProps) {
  const [form, setForm] = useState({
    givenName: user.name.givenName || '',
    familyName: user.name.familyName || '',
    orgUnitPath: user.orgUnitPath || '/',
    password: '',
    changePasswordAtNextLogin: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updateData: any = {
        givenName: form.givenName,
        familyName: form.familyName,
        orgUnitPath: form.orgUnitPath,
      }

      if (form.password) {
        updateData.password = form.password
        updateData.changePasswordAtNextLogin = form.changePasswordAtNextLogin
      }

      const res = await fetch(`/api/workspace/users/${encodeURIComponent(user.primaryEmail)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar usuario')
      }

      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
              <UserCog className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar Usuario
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.primaryEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                value={form.givenName}
                onChange={(e) => setForm({ ...form, givenName: e.target.value })}
                className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido
              </label>
              <input
                type="text"
                required
                value={form.familyName}
                onChange={(e) => setForm({ ...form, familyName: e.target.value })}
                className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unidad Organizativa
            </label>
            <select
              value={form.orgUnitPath}
              onChange={(e) => setForm({ ...form, orgUnitPath: e.target.value })}
              className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="/">/ (Raíz)</option>
              {orgUnits.map((ou) => (
                <option key={ou.orgUnitId} value={ou.orgUnitPath}>
                  {ou.orgUnitPath}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t dark:border-slate-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Cambiar contraseña (opcional)
            </p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dejar vacío para no cambiar"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {form.password && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="changePasswordEdit"
                  checked={form.changePasswordAtNextLogin}
                  onChange={(e) => setForm({ ...form, changePasswordAtNextLogin: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="changePasswordEdit" className="text-sm text-gray-700 dark:text-gray-300">
                  Solicitar cambio de contraseña en próximo inicio
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
