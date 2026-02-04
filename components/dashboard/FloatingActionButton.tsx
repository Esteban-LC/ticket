'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function FloatingActionButton() {
    return (
        <Link
            href="/dashboard/tickets/new"
            className="fixed bottom-6 right-6 lg:hidden z-40 h-14 w-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95"
            aria-label="Crear nuevo ticket"
        >
            <Plus className="h-6 w-6" />
        </Link>
    )
}
