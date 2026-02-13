'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
    Home,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    UserCircle,
    Tag,
    Calendar,
    Moon,
    Sun,
    X
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
    user?: {
        name?: string | null
        email?: string
        role?: string
    }
    openTicketsCount?: number
}

export default function MobileMenu({ isOpen, onClose, user, openTicketsCount }: MobileMenuProps) {
    const pathname = usePathname()
    const userRole = user?.role || 'EDITOR'
    const { theme, toggleTheme } = useTheme()

    const allNavigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'] },
        { name: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'] },
        { name: 'Cronograma', href: '/dashboard/schedule', icon: Calendar, roles: ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER'] },
        { name: 'Categorías', href: '/dashboard/categories', icon: Tag, roles: ['ADMIN', 'COORDINATOR'] },
        { name: 'Usuarios', href: '/dashboard/users', icon: Users, roles: ['ADMIN'] },
        { name: 'Configuración', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
    ]

    const navigation = allNavigation.filter(item => item.roles.includes(userRole))

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Menu */}
            <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 shadow-xl z-50 lg:hidden transform transition-transform duration-300">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            <span className="font-bold text-gray-900 dark:text-white">Tickets</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                        >
                            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b dark:border-slate-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            const isTickets = item.href === '/dashboard/tickets'

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
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

                    {/* Footer Actions */}
                    <div className="p-4 border-t dark:border-slate-700 space-y-2">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition w-full"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            <span className="font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        </button>

                        <Link
                            href="/dashboard/profile"
                            onClick={onClose}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition w-full ${pathname === '/dashboard/profile'
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <UserCircle className="h-5 w-5" />
                            <span className="font-medium">Mi Perfil</span>
                        </Link>

                        <button
                            onClick={() => signOut({ callbackUrl: window.location.origin })}
                            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition w-full"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
