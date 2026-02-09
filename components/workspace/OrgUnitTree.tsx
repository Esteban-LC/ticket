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
  LayoutGrid,
  List,
  ArrowLeft,
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

  orgUnits.forEach(ou => {
    pathMap.set(ou.orgUnitPath, { ...ou, children: [] })
  })

  const roots: TreeNode[] = []

  orgUnits.forEach(ou => {
    const node = pathMap.get(ou.orgUnitPath)!
    const parent = pathMap.get(ou.parentOrgUnitPath)

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach(n => sortNodes(n.children))
  }
  sortNodes(roots)

  return roots
}

function countDescendants(node: TreeNode): number {
  let count = node.children.length
  node.children.forEach(child => {
    count += countDescendants(child)
  })
  return count
}

function findNodeByPath(tree: TreeNode[], path: string): TreeNode | null {
  for (const node of tree) {
    if (node.orgUnitPath === path) return node
    const found = findNodeByPath(node.children, path)
    if (found) return found
  }
  return null
}

function getBreadcrumbs(path: string, tree: TreeNode[]): { label: string; path: string }[] {
  const crumbs: { label: string; path: string }[] = [{ label: 'Raíz', path: '/' }]
  if (path === '/') return crumbs

  const segments = path.split('/').filter(Boolean)
  let currentPath = ''
  for (const segment of segments) {
    currentPath += '/' + segment
    const node = findNodeByPath(tree, currentPath)
    crumbs.push({ label: node?.name || segment, path: currentPath })
  }
  return crumbs
}

// ============ TREE VIEW (Desktop) ============

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

// ============ CARD VIEW (Mobile) ============

function OrgUnitCards({
  tree,
  currentPath,
  onNavigate,
  onSelect,
}: {
  tree: TreeNode[]
  currentPath: string
  onNavigate: (path: string) => void
  onSelect: (path: string) => void
}) {
  const breadcrumbs = getBreadcrumbs(currentPath, tree)

  // Obtener los hijos del path actual
  let children: TreeNode[]
  if (currentPath === '/') {
    children = tree
  } else {
    const node = findNodeByPath(tree, currentPath)
    children = node?.children || []
  }

  // Calcular la ruta del padre para el botón de retroceso
  const getParentPath = (path: string): string => {
    if (path === '/') return '/'
    const segments = path.split('/').filter(Boolean)
    segments.pop()
    return segments.length === 0 ? '/' : '/' + segments.join('/')
  }

  return (
    <div>
      {/* Botón de retroceso + Breadcrumbs */}
      {currentPath !== '/' && (
        <div className="mb-4 px-1 space-y-2">
          <button
            onClick={() => onNavigate(getParentPath(currentPath))}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </button>

          <div className="flex items-center gap-1 flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />}
              <button
                onClick={() => onNavigate(crumb.path)}
                className={`text-sm px-1.5 py-0.5 rounded transition ${
                  i === breadcrumbs.length - 1
                    ? 'font-medium text-gray-900 dark:text-white'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {crumb.label}
              </button>
            </span>
          ))}
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {children.map(node => {
          const descendantCount = countDescendants(node)
          const hasChildren = node.children.length > 0

          return (
            <div
              key={node.orgUnitId}
              className="bg-gray-50 dark:bg-slate-700/50 border dark:border-slate-600/50 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition cursor-pointer group"
              onClick={() => {
                if (hasChildren) {
                  onNavigate(node.orgUnitPath)
                } else {
                  onSelect(node.orgUnitPath)
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg flex-shrink-0">
                  <Folder className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {node.name}
                  </h4>
                  {node.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {node.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {hasChildren && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <FolderTree className="h-3 w-3" />
                        {node.children.length} sub-unidades
                        {descendantCount > node.children.length && (
                          <span>({descendantCount} total)</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(node.orgUnitPath) }}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="Ver usuarios"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  {hasChildren && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(node.orgUnitPath) }}
                      className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition"
                      title="Abrir"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {children.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay sub-unidades en esta ubicación</p>
        </div>
      )}
    </div>
  )
}

// ============ MAIN COMPONENT ============

export default function OrgUnitTree({ orgUnits, onSelectOrgUnit }: OrgUnitTreeProps) {
  const tree = buildTree(orgUnits)
  const [currentPath, setCurrentPath] = useState('/')
  const [viewMode, setViewMode] = useState<'tree' | 'cards'>('cards')

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

        {/* Toggle vista (solo desktop) */}
        <div className="hidden lg:flex items-center gap-1 ml-auto mr-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`p-1.5 rounded transition ${
              viewMode === 'tree'
                ? 'bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title="Vista de árbol"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded transition ${
              viewMode === 'cards'
                ? 'bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title="Vista de tarjetas"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400 lg:ml-0 ml-auto">
          {orgUnits.length} unidades
        </span>
      </div>

      <div className="p-2">
        {/* Desktop: Tree o Cards según viewMode */}
        <div className="hidden lg:block">
          {viewMode === 'tree' ? (
            <>
              {/* Raíz */}
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
            </>
          ) : (
            <OrgUnitCards
              tree={tree}
              currentPath={currentPath}
              onNavigate={setCurrentPath}
              onSelect={onSelectOrgUnit}
            />
          )}
        </div>

        {/* Mobile: Siempre Cards */}
        <div className="lg:hidden">
          <OrgUnitCards
            tree={tree}
            currentPath={currentPath}
            onNavigate={setCurrentPath}
            onSelect={onSelectOrgUnit}
          />
        </div>
      </div>
    </div>
  )
}
