'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

interface MobileHeaderProps {
    onMenuClick?: () => void
    title?: string
}

export default function MobileHeader({ onMenuClick, title }: MobileHeaderProps) {
    const { toggle } = useSidebar()

    const handleClick = () => {
        if (onMenuClick) {
            onMenuClick()
        } else {
            toggle()
        }
    }

    return (
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-4 py-3">
            <div className="flex items-center gap-3">
                <button
                    onClick={handleClick}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
                {title && (
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
                )}
            </div>
        </div>
    )
}
