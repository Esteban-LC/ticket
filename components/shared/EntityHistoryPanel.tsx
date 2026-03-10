'use client'

import { History, Info } from 'lucide-react'

export interface EntityHistoryRow {
  id: string
  createdAt: string
  actorLabel: string
  actionLabel: string
  targetLabel: string
  targetSubLabel?: string | null
  details?: string | null
}

interface Props {
  title: string
  countLabel?: string
  description?: string
  rows: EntityHistoryRow[]
  emptyMessage: string
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EntityHistoryPanel({ title, countLabel, description, rows, emptyMessage }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          {countLabel && <span className="text-xs text-gray-500 dark:text-gray-400">{countLabel}</span>}
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Accion</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Elemento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {row.actorLabel}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {row.actionLabel}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-white">{row.targetLabel}</div>
                    {row.targetSubLabel && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{row.targetSubLabel}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {row.details ? (
                      <div className="flex items-start gap-1.5">
                        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        <span>{row.details}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
