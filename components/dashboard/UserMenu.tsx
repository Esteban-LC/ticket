'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { UserCircle, LogOut, Moon, Sun, ChevronUp } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface UserMenuProps {
    user?: {
        name?: string | null
        email?: string
        role?: string
    }
    onLinkClick?: () => void
}

export default function UserMenu({ user, onLinkClick }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const { theme, toggleTheme } = useTheme()
    const pathname = usePathname()

    // Cerrar el menú al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleLinkClick = () => {
        setIsOpen(false)
        onLinkClick?.()
    }

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'ADMIN':
                return 'Administrador'
            case 'COORDINATOR':
                return 'Coordinador'
            case 'EDITOR':
                return 'Editor'
            case 'VIEWER':
                return 'Visualizador'
            default:
                return 'Usuario'
        }
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Dropdown Menu - Aparece ARRIBA del botón */}
            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                    {/* User Info Header - Compacto */}
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user?.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {getRoleLabel()}
                        </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        {/* Dark Mode Toggle */}
                        <div className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Modo Oscuro</span>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                                        }`}
                                    role="switch"
                                    aria-checked={theme === 'dark'}
                                >
                                    <span
                                        className={`inline-flex h-3.5 w-3.5 items-center justify-center transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
                                            }`}
                                    >
                                        {theme === 'dark' ? (
                                            <Moon className="h-2.5 w-2.5 text-primary-600" />
                                        ) : (
                                            <Sun className="h-2.5 w-2.5 text-gray-400" />
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>

                        {/* Mi Perfil */}
                        <Link
                            href="/dashboard/profile"
                            onClick={handleLinkClick}
                            className={`flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${pathname === '/dashboard/profile' ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                }`}
                        >
                            <UserCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Mi Perfil</span>
                        </Link>

                        {/* Cerrar Sesión */}
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                signOut()
                            }}
                            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors w-full text-left"
                        >
                            <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Avatar Button - Estilo Google */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
            >
                <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary-600 hover:bg-primary-700 transition-colors">
                        <span className="text-sm font-semibold text-white">
                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user?.name || 'Usuario'}
                        </p>
                    </div>
                </div>
                <ChevronUp
                    className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>
        </div>
    )
}
