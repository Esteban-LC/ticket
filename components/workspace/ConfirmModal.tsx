'use client'

import { useState, type ReactNode } from 'react'
import { AlertTriangle, Trash2, PauseCircle, PlayCircle, Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel: string
  variant: 'danger' | 'warning' | 'success'
  onConfirm: () => Promise<void>
  onCancel: () => void
  extraContent?: ReactNode
  confirmDisabled?: boolean
}

const variantStyles = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: PauseCircle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  success: {
    icon: PlayCircle,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    button: 'bg-green-600 hover:bg-green-700 text-white',
  },
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  variant,
  onConfirm,
  onCancel,
  extraContent,
  confirmDisabled = false,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const styles = variantStyles[variant]
  const Icon = styles.icon

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`${styles.iconBg} p-3 rounded-full flex-shrink-0`}>
              <Icon className={`h-6 w-6 ${styles.iconColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>
            </div>
          </div>
          {extraContent && <div className="mt-4">{extraContent}</div>}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 transition font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || confirmDisabled}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 transition font-medium ${styles.button}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
