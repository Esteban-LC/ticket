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
    // State for mock data
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

    // Modals State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    // Selection State
    const [selectedItem, setSelectedItem] = useState<ResultItem | null>(null)
    const [itemToDelete, setItemToDelete] = useState<ResultItem | null>(null)
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<ResultItem>>({
        project: '',
        description: '',
        status: 'En proceso',
        observations: ''
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Entregado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'Completado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'En proceso': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'Pausado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        const newId = Math.max(...results.map(r => r.id), 0) + 1
        const newItem: ResultItem = {
            id: newId,
            product: '', // Not used in form currently but consistent with type
            project: formData.project || '',
            description: formData.description || '',
            status: (formData.status as any) || 'En proceso',
            observations: formData.observations || ''
        }
        setResults([...results, newItem])
        setIsCreateModalOpen(false)
        setFormData({ project: '', description: '', status: 'En proceso', observations: '' })
    }

    const handleEditClick = (item: ResultItem) => {
        setSelectedItem(item)
        setFormData({
            project: item.project,
            description: item.description,
            status: item.status,
            observations: item.observations
        })
        setIsEditModalOpen(true)
        setOpenMenuId(null)
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedItem) {
            const updatedResults = results.map(item =>
                item.id === selectedItem.id
                    ? { ...item, ...formData } as ResultItem
                    : item
            )
            setResults(updatedResults)
            setIsEditModalOpen(false)
            setSelectedItem(null)
        }
    }

    const handleDeleteClick = (item: ResultItem) => {
        setItemToDelete(item)
        setIsDeleteModalOpen(true)
        setOpenMenuId(null)
    }

    const confirmDelete = () => {
        if (itemToDelete) {
            setResults(results.filter(r => r.id !== itemToDelete.id))
            setIsDeleteModalOpen(false)
            setItemToDelete(null)
        }
    }

    const toggleMenu = (id: number) => {
        if (openMenuId === id) {
            setOpenMenuId(null)
        } else {
            setOpenMenuId(id)
        }
    }

    // Close menu when clicking outside (simple implementation)
    const handleBackdropClick = () => {
        if (openMenuId !== null) setOpenMenuId(null)
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950" onClick={handleBackdropClick}>
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
                                <button
                                    onClick={() => {
                                        setFormData({ project: '', description: '', status: 'En proceso', observations: '' })
                                        setIsCreateModalOpen(true)
                                    }}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo Proyecto
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
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <Filter className="h-4 w-4" />
                                Filtros
                            </button>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-visible">
                            <div className="overflow-x-auto overflow-y-visible">
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
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group relative">
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
                                                <td className="px-6 py-4 text-right relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleMenu(item.id)
                                                        }}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openMenuId === item.id && (
                                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-10 overflow-hidden animate-in fade-in zoom-in duration-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleEditClick(item)
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteClick(item)
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    )}
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

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Proyecto</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Proyecto</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    value={formData.project}
                                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del Resultado</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="En proceso">En proceso</option>
                                    <option value="Entregado">Entregado</option>
                                    <option value="Completado">Completado</option>
                                    <option value="Pausado">Pausado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                    value={formData.observations}
                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Crear Proyecto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Proyecto</h2>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Proyecto</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    value={formData.project}
                                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del Resultado</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="En proceso">En proceso</option>
                                    <option value="Entregado">Entregado</option>
                                    <option value="Completado">Completado</option>
                                    <option value="Pausado">Pausado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                    value={formData.observations}
                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Eliminar proyecto?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Se eliminará permanentemente "{itemToDelete.project}".
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
