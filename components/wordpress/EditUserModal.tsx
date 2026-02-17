'use client'

import { useState, useEffect } from 'react'
import { X, User, Mail, Shield, KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface WPUser {
  id: number
  first_name: string
  last_name: string
  email: string
  roles: string[]
  name: string
}

interface EditUserModalProps {
  isOpen: boolean
  user: WPUser
  onClose: () => void
  onSaved: (updated: Partial<WPUser>) => void
}

type State = 'form' | 'loading' | 'success' | 'error'

const ROLES = [
  { value: 'subscriber', label: 'Suscriptor' },
  { value: 'student', label: 'Estudiante' },
  { value: 'tutor_instructor', label: 'Instructor' },
  { value: 'editor', label: 'Editor' },
  { value: 'administrator', label: 'Administrador' },
]

export default function EditUserModal({ isOpen, user, onClose, onSaved }: EditUserModalProps) {
  const [state, setState] = useState<State>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
      setEmail(user.email || '')
      setRole(user.roles?.[0] || 'subscriber')
      setPassword('')
      setState('form')
      setErrorMsg('')
      setShowPassword(false)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setState('loading')
    try {
      const body: Record<string, any> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        roles: [role],
      }
      if (password.trim()) body.password = password.trim()

      const res = await fetch(`/api/wordpress/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')

      setState('success')
      onSaved({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: body.name,
        email: email.trim(),
        roles: [role],
      })
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar')
      setState('error')
    }
  }

  const handleClose = () => {
    if (state === 'loading') return
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Editar usuario</h2>
          {state !== 'loading' && (
            <button onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Estado: cargando */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Guardando cambios...</p>
          </div>
        )}

        {/* Estado: éxito */}
        {state === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="relative">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-30" />
            </div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Usuario actualizado correctamente</p>
          </div>
        )}

        {/* Estado: error */}
        {state === 'error' && (
          <div className="p-5">
            <div className="flex flex-col items-center py-6 gap-3">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setState('form')}
                className="flex-1 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                Reintentar
              </button>
              <button onClick={handleClose}
                className="flex-1 py-2 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Formulario */}
        {state === 'form' && (
          <form onSubmit={handleSubmit}>
            <div className="p-5 space-y-4">

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Nombre"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Apellido"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Rol
                </label>
                <div className="relative">
                  <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contraseña nueva (opcional) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-9 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onClick={handleClose}
                className="flex-1 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit"
                className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Guardar cambios
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
