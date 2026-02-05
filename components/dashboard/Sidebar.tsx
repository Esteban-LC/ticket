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
  Layout
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import UserMenu from './UserMenu'


interface SidebarProps {
  user?: {
    name?: string | null
    email?: string
    role?: string
  }
  openTicketsCount?: number
}

export default function Sidebar({ user, openTicketsCount }: SidebarProps) {
  const pathname = usePathname()
  const userRole = user?.role || 'CUSTOMER'
  const { isOpen, close } = useSidebar()

  // Definir navegación según el rol
  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['CUSTOMER', 'AGENT', 'ADMIN'] },
    { name: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare, roles: ['CUSTOMER', 'AGENT', 'ADMIN'] },
    { name: 'Reportes', href: '/dashboard/reportes', icon: FileText, roles: ['CUSTOMER', 'AGENT', 'ADMIN'] },
    { name: 'Cronograma', href: '/dashboard/schedule', icon: Calendar, roles: ['CUSTOMER', 'AGENT', 'ADMIN'] },
    { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar, roles: ['CUSTOMER', 'AGENT', 'ADMIN'] },
    { name: 'Resultados', href: '/dashboard/resultados', icon: Layout, roles: ['ADMIN'] },
    { name: 'Categorías', href: '/dashboard/categories', icon: Tag, roles: ['AGENT', 'ADMIN'] },
    { name: 'Usuarios', href: '/dashboard/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
  ]

  // Filtrar navegación por rol
  const navigation = allNavigation.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-700 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header con botón de cerrar en móvil */}
        <div className="p-6 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Headphones className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">TI LM</span>
            </div>
            <button
              onClick={close}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isTickets = item.href === '/dashboard/tickets'

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={close} // Cerrar sidebar al hacer clic en un enlace
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${isActive
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
        </nav>

        {/* User Menu at Bottom */}
        <div className="p-4 border-t dark:border-slate-700">
          <UserMenu user={user} onLinkClick={close} />
        </div>
      </div>
    </>
  )
}
