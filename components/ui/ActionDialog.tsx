'use client'

import { AlertTriangle, CheckCircle, Info, XCircle, Loader2 } from 'lucide-react'
import Modal from './Modal'
import { useEffect, useState } from 'react'

interface ActionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  successMessage?: string
  loadingMessage?: string
}

type DialogState = 'confirm' | 'loading' | 'success' | 'error'

export default function ActionDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info',
  successMessage = 'Acción completada exitosamente',
  loadingMessage = 'Procesando...',
}: ActionDialogProps) {
  const [state, setState] = useState<DialogState>('confirm')
  const [errorMessage, setErrorMessage] = useState('')

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setState('confirm')
      setErrorMessage('')
    }
  }, [isOpen])

  const handleConfirm = async () => {
    setState('loading')
    try {
      await onConfirm()
      setState('success')
      // Auto-close after showing success
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      setState('error')
      setErrorMessage(error.message || 'Ocurrió un error')
      // Auto-close after showing error
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  const variantConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      buttonColor: 'bg-red-600 hover:bg-red-700 disabled:bg-red-400',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      buttonColor: 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      buttonColor: 'bg-green-600 hover:bg-green-700 disabled:bg-green-400',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  // Render según el estado
  if (state === 'loading') {
    return (
      <Modal isOpen={isOpen} onClose={() => {}} title={title} size="sm">
        <div className="py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-gray-700 dark:text-gray-300 text-center font-medium">
              {loadingMessage}
            </p>
          </div>
        </div>
      </Modal>
    )
  }

  if (state === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="¡Éxito!" size="sm">
        <div className="py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 dark:bg-green-900/20 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-center font-medium">
              {successMessage}
            </p>
          </div>
        </div>
      </Modal>
    )
  }

  if (state === 'error') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Error" size="sm">
        <div className="py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-center font-medium">
              {errorMessage}
            </p>
          </div>
        </div>
      </Modal>
    )
  }

  // Estado de confirmación (default)
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <p className="text-gray-700 dark:text-gray-300 flex-1 pt-1">
            {message}
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${config.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
