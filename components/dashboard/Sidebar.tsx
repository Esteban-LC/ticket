'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  MessageSquare,
  Users,
  Settings,
  Headphones,
  Tag,
  Calendar,
  X,
  FileText,
  Layout,
  Building2,
  Eye,
  UserPlus,
  ShoppingCart,
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import UserMenu from './UserMenu'
import {
  canAccessWorkspace,
  canAccessWordPressEnrollments,
  canAccessWordPressOrders,
  canAccessWordPressStudents,
  canManageTuitionStatus,
} from '@/lib/permissions'

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string
    role?: string
    permissions?: string[]
  }
  openTicketsCount?: number
}

type NavItem = {
  name: string
  href: string
  icon: any
  roles: string[]
  section: 'personal' | 'admin' | 'finance' | 'wordpress'
  isVisible: (role: string, permissions: string[]) => boolean
}

export default function Sidebar({ user, openTicketsCount }: SidebarProps) {
  const pathname = usePathname()
  const userRole = user?.role || 'EDITOR'
  const userPermissions = user?.permissions || []
  const { isOpen, close } = useSidebar()

  const allNavigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'], section: 'personal', isVisible: () => true },
    { name: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'], section: 'personal', isVisible: () => true },
    { name: 'Reportes', href: '/dashboard/reportes', icon: FileText, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'], section: 'personal', isVisible: () => true },
    { name: 'Cronograma', href: '/dashboard/schedule', icon: Calendar, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'], section: 'personal', isVisible: () => true },
    { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'], section: 'personal', isVisible: () => true },
    { name: 'Resultados', href: '/dashboard/resultados', icon: Layout, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'], section: 'personal', isVisible: () => true },
    { name: 'Vista General', href: '/dashboard/vista-general', icon: Eye, roles: ['ADMIN'], section: 'admin', isVisible: (role) => role === 'ADMIN' },
    { name: 'Categorias', href: '/dashboard/categories', icon: Tag, roles: ['ADMIN'], section: 'admin', isVisible: (role) => role === 'ADMIN' },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users, roles: ['ADMIN'], section: 'admin', isVisible: (role) => role === 'ADMIN' },
    {
      name: 'Workspace',
      href: '/dashboard/workspace',
      icon: Building2,
      roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'],
      section: 'admin',
      isVisible: (role, permissions) => canAccessWorkspace({ role, permissions }),
    },
    { name: 'Configuracion', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'], section: 'admin', isVisible: (role) => role === 'ADMIN' },
    {
      name: 'Cobranza',
      href: '/dashboard/cobranza',
      icon: FileText,
      roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'],
      section: 'finance',
      isVisible: (role, permissions) => canManageTuitionStatus({ role, permissions }),
    },
    {
      name: 'Usuarios WP',
      href: '/dashboard/wordpress/students',
      icon: Users,
      roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'],
      section: 'wordpress',
      isVisible: (role, permissions) => canAccessWordPressStudents({ role, permissions }),
    },
    {
      name: 'Enrolamiento',
      href: '/dashboard/wordpress/enroll',
      icon: UserPlus,
      roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'],
      section: 'wordpress',
      isVisible: (role, permissions) => canAccessWordPressEnrollments({ role, permissions }),
    },
    {
      name: 'Pedidos WP',
      href: '/dashboard/wordpress/orders',
      icon: ShoppingCart,
      roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'],
      section: 'wordpress',
      isVisible: (role, permissions) => canAccessWordPressOrders({ role, permissions }),
    },
  ]

  const navigation = allNavigation.filter((item) => {
    const hasRole = item.roles.includes(userRole)
    return hasRole && item.isVisible(userRole, userPermissions)
  })

  const personalNav = navigation.filter((item) => item.section === 'personal')
  const adminNav = navigation.filter((item) => item.section === 'admin')
  const financeNav = navigation.filter((item) => item.section === 'finance')
  const wordpressNav = navigation.filter((item) => item.section === 'wordpress')

  const renderSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null

    return (
      <>
        <div className="pt-4 pb-2 px-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {title}
          </p>
        </div>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const isTickets = item.href === '/dashboard/tickets'

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={close}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </div>
              {isTickets && openTicketsCount !== undefined && openTicketsCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 dark:bg-red-500 rounded-full">
                  {openTicketsCount}
                </span>
              )}
            </Link>
          )
        })}
      </>
    )
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-700
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Headphones className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">TI LM</span>
            </div>
            <button
              onClick={close}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              aria-label="Cerrar menu"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {personalNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isTickets = item.href === '/dashboard/tickets'

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={close}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
                {isTickets && openTicketsCount !== undefined && openTicketsCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 dark:bg-red-500 rounded-full">
                    {openTicketsCount}
                  </span>
                )}
              </Link>
            )
          })}

          {renderSection('Administracion', adminNav)}
          {renderSection('Cobranza', financeNav)}
          {renderSection('WordPress LMS', wordpressNav)}
        </nav>

        <div className="p-4 border-t dark:border-slate-700">
          <UserMenu user={user} onLinkClick={close} />
        </div>
      </div>
    </>
  )
}
