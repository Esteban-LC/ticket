'use client'

import { useState } from 'react'
import {
  FolderTree,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Users,
  Building2,
} from 'lucide-react'

interface OrgUnit {
  orgUnitId: string
  name: string
  orgUnitPath: string
  parentOrgUnitPath: string
  description?: string
}

interface OrgUnitTreeProps {
  orgUnits: OrgUnit[]
  onSelectOrgUnit: (path: string | null) => void
}

interface TreeNode extends OrgUnit {
  children: TreeNode[]
}

function buildTree(orgUnits: OrgUnit[]): TreeNode[] {
  const pathMap = new Map<string, TreeNode>()

  // Crear nodos
  orgUnits.forEach(ou => {
    pathMap.set(ou.orgUnitPath, { ...ou, children: [] })
  })

  const roots: TreeNode[] = []

  // Construir árbol
  orgUnits.forEach(ou => {
    const node = pathMap.get(ou.orgUnitPath)!
    const parent = pathMap.get(ou.parentOrgUnitPath)

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Ordenar alfabéticamente
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach(n => sortNodes(n.children))
  }
  sortNodes(roots)

  return roots
}

function TreeItem({
  node,
  level,
  onSelect,
}: {
  node: TreeNode
  level: number
  onSelect: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(level < 1)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/30 rounded-lg cursor-pointer group transition"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <div
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={() => onSelect(node.orgUnitPath)}
        >
          {expanded && hasChildren ? (
            <FolderOpen className="h-5 w-5 text-amber-500 flex-shrink-0" />
          ) : (
            <Folder className="h-5 w-5 text-amber-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {node.name}
          </span>
          {node.description && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:inline">
              — {node.description}
            </span>
          )}
        </div>

        <button
          onClick={() => onSelect(node.orgUnitPath)}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
          title="Ver usuarios de esta unidad"
        >
          <Users className="h-4 w-4" />
        </button>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.orgUnitId}
              node={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgUnitTree({ orgUnits, onSelectOrgUnit }: OrgUnitTreeProps) {
  const tree = buildTree(orgUnits)

  if (orgUnits.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
        <FolderTree className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron unidades organizativas</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Verifica la conexión con Google Workspace
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div className="p-4 border-b dark:border-slate-700 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Estructura Organizativa</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {orgUnits.length} unidades
        </span>
      </div>

      {/* Raíz */}
      <div className="p-2">
        <div
          className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/30 rounded-lg cursor-pointer group transition"
          onClick={() => onSelectOrgUnit('/')}
        >
          <span className="w-5" />
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            / (Raíz de la organización)
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSelectOrgUnit('/') }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition ml-auto"
            title="Ver todos los usuarios"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>

        {tree.map(node => (
          <TreeItem
            key={node.orgUnitId}
            node={node}
            level={1}
            onSelect={onSelectOrgUnit}
          />
        ))}
      </div>
    </div>
  )
}
