'use client'

import { AlertTriangle } from 'lucide-react'

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onKeepEditing: () => void
  onDiscard: () => void
  title?: string
  message?: string
}

export default function UnsavedChangesDialog({
  isOpen,
  onKeepEditing,
  onDiscard,
  title = 'Descartar cambios',
  message = 'Hay datos sin guardar. Si sales ahora, perderas los cambios realizados.',
}: UnsavedChangesDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onKeepEditing}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
          >
            Salir sin guardar
          </button>
        </div>
      </div>
    </div>
  )
}
