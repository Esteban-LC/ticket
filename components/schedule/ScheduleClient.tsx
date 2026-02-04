'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, List } from 'lucide-react'
import Calendar from '@/components/schedule/Calendar'
import Timeline from '@/components/schedule/Timeline'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import FloatingActionButton from '@/components/dashboard/FloatingActionButton'

interface ScheduleClientProps {
    user: {
        id: string
        name: string | null
        email: string
        role: string
    }
    openTicketsCount: number
}

export default function ScheduleClient({ user, openTicketsCount }: ScheduleClientProps) {
    const [view, setView] = useState<'calendar' | 'timeline'>('calendar')

    return (
        <>
            <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
                <Sidebar user={user} openTicketsCount={openTicketsCount} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <MobileHeader title="Cronograma" />

                    <main className="flex-1 overflow-y-auto">
                        <div className="p-4 lg:p-8">
                            {/* Header */}
                            <div className="mb-6 lg:mb-8 hidden lg:block">
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">Cronograma</h1>
                                <p className="text-gray-600 dark:text-gray-400">Gestiona tus eventos, tareas y reuniones</p>
                            </div>

                            {/* View Toggle */}
                            <div className="mb-4 lg:mb-6 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-slate-700 w-full lg:w-fit">
                                <button
                                    onClick={() => setView('calendar')}
                                    className={`
                                        flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-2 rounded-md font-medium transition-all text-sm lg:text-base
                                        ${view === 'calendar'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                        }
                                    `}
                                >
                                    <CalendarIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                                    <span>Calendario</span>
                                </button>
                                <button
                                    onClick={() => setView('timeline')}
                                    className={`
                                        flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-2 rounded-md font-medium transition-all text-sm lg:text-base
                                        ${view === 'timeline'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                        }
                                    `}
                                >
                                    <List className="h-4 w-4 lg:h-5 lg:w-5" />
                                    <span>Línea de Tiempo</span>
                                </button>
                            </div>

                            {/* Content */}
                            {view === 'calendar' ? <Calendar /> : <Timeline />}
                        </div>
                    </main>
                </div>
            </div>

            <FloatingActionButton />
        </>
    )
}
