'use client'

import { useState } from 'react'
import { X, UserPlus, Eye, EyeOff, Loader2, CheckCircle2, Copy, Check, FolderTree, Mail, KeyRound, User } from 'lucide-react'
import OrgUnitCombobox from './OrgUnitCombobox'

interface OrgUnit {
  orgUnitId: string
  name: string
  orgUnitPath: string
  parentOrgUnitPath: string
}

interface CreateUserModalProps {
  orgUnits: OrgUnit[]
  defaultOrgUnitPath?: string | null
  onClose: () => void
  onCreated: () => void
}

interface CreatedUserInfo {
  fullName: string
  email: string
  password: string
  orgUnitPath: string
  changePasswordAtNextLogin: boolean
}

export default function CreateUserModal({ orgUnits, defaultOrgUnitPath, onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState({
    givenName: '',
    familyName: '',
    primaryEmail: '',
    password: '',
    orgUnitPath: defaultOrgUnitPath || '/',
    changePasswordAtNextLogin: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdUser, setCreatedUser] = useState<CreatedUserInfo | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/workspace/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear usuario')
      }

      // Guardar info del usuario creado para mostrar resumen
      setCreatedUser({
        fullName: `${form.givenName} ${form.familyName}`,
        email: form.primaryEmail,
        password: form.password,
        orgUnitPath: form.orgUnitPath,
        changePasswordAtNextLogin: form.changePasswordAtNextLogin,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  const handleClose = () => {
    if (createdUser) {
      onCreated()
    }
    onClose()
  }

  // ====== RESUMEN DEL USUARIO CREADO ======
  if (createdUser) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
          {/* Header con check verde */}
          <div className="p-6 border-b dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usuario Creado Exitosamente
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Guarda las credenciales antes de cerrar
                </p>
              </div>
            </div>
          </div>

          {/* Datos del usuario */}
          <div className="p-6 space-y-3">
            {/* Nombre */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Nombre completo</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{createdUser.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(createdUser.fullName, 'name')}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition"
                title="Copiar"
              >
                {copiedField === 'name' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Correo electrónico</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{createdUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(createdUser.email, 'email')}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition"
                title="Copiar"
              >
                {copiedField === 'email' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Contraseña */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <KeyRound className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-600 dark:text-amber-400">Contraseña {createdUser.changePasswordAtNextLogin && '(temporal)'}</p>
                <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{createdUser.password}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(createdUser.password, 'password')}
                className="p-1.5 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition"
                title="Copiar contraseña"
              >
                {copiedField === 'password' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Unidad Organizativa */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <FolderTree className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Unidad Organizativa</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{createdUser.orgUnitPath}</p>
              </div>
            </div>

            {createdUser.changePasswordAtNextLogin && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                El usuario deberá cambiar su contraseña en el primer inicio de sesión
              </p>
            )}

            {/* Botón copiar todo */}
            <button
              type="button"
              onClick={() => handleCopy(
                `Nombre: ${createdUser.fullName}\nCorreo: ${createdUser.email}\nContraseña: ${createdUser.password}\nUnidad Org: ${createdUser.orgUnitPath}`,
                'all'
              )}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              {copiedField === 'all' ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copiado al portapapeles
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar todo
                </>
              )}
            </button>
          </div>

          {/* Cerrar */}
          <div className="p-6 border-t dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ====== FORMULARIO DE CREACIÓN ======
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Crear Usuario de Workspace
            </h2>
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
                Nombre *
              </label>
              <input
                type="text"
                required
                value={form.givenName}
                onChange={(e) => setForm({ ...form, givenName: e.target.value })}
                className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={form.familyName}
                onChange={(e) => setForm({ ...form, familyName: e.target.value })}
                className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              required
              value={form.primaryEmail}
              onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })}
              className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="juan.perez@tudominio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <OrgUnitCombobox
            orgUnits={orgUnits}
            value={form.orgUnitPath}
            onChange={(path) => setForm({ ...form, orgUnitPath: path })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="changePassword"
              checked={form.changePasswordAtNextLogin}
              onChange={(e) => setForm({ ...form, changePasswordAtNextLogin: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="changePassword" className="text-sm text-gray-700 dark:text-gray-300">
              Solicitar cambio de contraseña en el primer inicio de sesión
            </label>
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
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
