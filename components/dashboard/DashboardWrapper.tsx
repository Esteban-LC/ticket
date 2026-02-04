'use client'

import MobileHeader from './MobileHeader'
import Sidebar from './Sidebar'

interface DashboardWrapperProps {
    user: {
        name?: string | null
        email?: string
        role?: string
    }
    openTicketsCount: number
    children: React.ReactNode
    title?: string
}

export default function DashboardWrapper({ user, openTicketsCount, children, title }: DashboardWrapperProps) {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar user={user} openTicketsCount={openTicketsCount} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader title={title} />

                <main className="flex-1 overflow-y-auto pt-0 lg:pt-0">
                    {children}
                </main>
            </div>
        </div>
    )
}
