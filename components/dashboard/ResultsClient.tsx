'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import {
    Layout,
    Plus,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Filter,
    Download
} from 'lucide-react'

interface ResultItem {
    id: number
    product: string
    project: string
    description: string
    status: 'Entregado' | 'En proceso' | 'Pausado' | 'Completado'
    observations: string
}

interface ResultsClientProps {
    user: any
    openTicketsCount: number
}

export default function ResultsClient({ user, openTicketsCount }: ResultsClientProps) {
    // Mock Data based on user image
    const [results, setResults] = useState<ResultItem[]>([
        {
            id: 1,
            product: '',
            project: 'Liceo Michoacano',
            description: 'Se tiene pensado entregar una página web completa con varias secciones',
            status: 'En proceso',
            observations: 'Por ahora hay una landing page funcional'
        },
        {
            id: 2,
            product: '',
            project: 'Biometricos Liceo',
            description: 'Sistema para capturar huellas y convertirlas a formato requerido de la unam',
            status: 'Completado',
            observations: ''
        },
        {
            id: 3,
            product: '',
            project: 'Sistema Capturador de Firmas',
            description: 'Página para capturar firmas en un entorno local',
            status: 'Completado',
            observations: 'Falta dispositivo designado para captura'
        },
        {
            id: 4,
            product: '',
            project: 'Software de creación de etiquetas',
            description: 'Programa que genera etiquetas en pdf con la información especificada',
            status: 'Entregado',
            observations: ''
        },
        {
            id: 5,
            product: '',
            project: 'Generador de imagenes bienvenida',
            description: 'Página que permite generar imagenes con los datos de los nuevos cursistas',
            status: 'Entregado',
            observations: ''
        },
        {
            id: 6,
            product: '',
            project: 'Dashboard administrativo',
            description: 'Dashboard donde se centraliza datos de información de citas, formularios y analíticas',
            status: 'En proceso',
            observations: ''
        },
        {
            id: 7,
            product: '',
            project: 'Generador de Links Material LIQ',
            description: 'Página que permite generar un enlace funcional para introducirlo como material',
            status: 'Entregado',
            observations: ''
        }
    ])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Entregado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'Completado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'En proceso': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'Pausado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar user={user} openTicketsCount={openTicketsCount} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader title="Resultados Semestrales" />

                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-8">
                        {/* Header Section */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Layout className="h-8 w-8 text-indigo-600" />
                                    Resultado Semestral
                                </h1>
                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <p><span className="font-semibold text-gray-900 dark:text-gray-200">Área:</span> Sistemas</p>
                                    <p><span className="font-semibold text-gray-900 dark:text-gray-200">Coordinador:</span> Esteban Luciano Castro</p>
                                    <p><span className="font-semibold text-gray-900 dark:text-gray-200">Periodo:</span> JULIO - DICIEMBRE</p>
                                    <p><span className="font-semibold text-gray-900 dark:text-gray-200">Entrega:</span> 29 DE DICIEMBRE</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full lg:w-auto">
                                <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                                    <Plus className="h-4 w-4" />
                                    Nuevo Proyecto
                                </button>
                                <button className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <Download className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar proyecto..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <Filter className="h-4 w-4" />
                                Filtros
                            </button>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white w-16">No.</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Proyecto</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white lg:w-1/3">Descripción del Resultado</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Estatus</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white lg:w-1/4">Observaciones</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {results.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.id}</td>
                                                <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">{item.project}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.description}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 italic">
                                                    {item.observations || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
