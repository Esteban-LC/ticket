'use client'

import { useState, useRef, useEffect } from 'react'
import { FolderTree, ChevronDown, Search, X, Check } from 'lucide-react'

interface OrgUnit {
  orgUnitId: string
  name: string
  orgUnitPath: string
  parentOrgUnitPath: string
}

interface OrgUnitComboboxProps {
  orgUnits: OrgUnit[]
  value: string
  onChange: (path: string) => void
  label?: string
}

export default function OrgUnitCombobox({ orgUnits, value, onChange, label = 'Unidad Organizativa' }: OrgUnitComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Todas las opciones: raíz + org units ordenadas alfabéticamente
  const allOptions = [
    { path: '/', displayName: '/ (Raíz)', name: 'Raíz' },
    ...orgUnits
      .map(ou => ({
        path: ou.orgUnitPath,
        displayName: ou.orgUnitPath,
        name: ou.name,
      }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  ]

  // Filtrar por búsqueda
  const filtered = search
    ? allOptions.filter(opt =>
        opt.path.toLowerCase().includes(search.toLowerCase()) ||
        opt.name.toLowerCase().includes(search.toLowerCase())
      )
    : allOptions

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus en el input al abrir
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const selectedLabel = allOptions.find(o => o.path === value)?.displayName || value

  const handleSelect = (path: string) => {
    onChange(path)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      {/* Botón trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-left"
      >
        <FolderTree className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="flex-1 truncate text-sm">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
          {/* Buscador */}
          <div className="p-2 border-b dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar unidad organizativa..."
                className="w-full pl-8 pr-8 py-1.5 text-sm border dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No se encontraron resultados
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.path === value
                // Calcular indentación basada en la profundidad del path
                const depth = opt.path === '/' ? 0 : (opt.path.match(/\//g)?.length || 0)

                return (
                  <button
                    key={opt.path}
                    type="button"
                    onClick={() => handleSelect(opt.path)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    style={{ paddingLeft: `${depth * 12 + 12}px` }}
                  >
                    <FolderTree className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="flex-1 truncate">
                      {search ? (
                        // Resaltar coincidencia
                        highlightMatch(opt.displayName, search)
                      ) : (
                        opt.displayName
                      )}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Contador */}
          <div className="px-3 py-1.5 border-t dark:border-slate-700 text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} de {allOptions.length} unidades
          </div>
        </div>
      )}
    </div>
  )
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-200 dark:bg-yellow-800 rounded-sm">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}
