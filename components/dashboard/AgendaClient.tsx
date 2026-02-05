'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import {
    Calendar as CalendarIcon,
    Link as LinkIcon,
    MoreVertical,
    Search,
    Filter,
    Download,
    Plus,
    User,
    CheckCircle2,
    Clock
} from 'lucide-react'

interface AgendaItem {
    id: number
    project: string
    subproject: string
    deliverable: string
    link: string | null
    responsible: string
    date: string
    status: 'En Proceso' | 'Stand by' | 'Por definir' | 'Completado'
    observations: string
}

interface AgendaClientProps {
    user: any
    openTicketsCount: number
}

export default function AgendaClient({ user, openTicketsCount }: AgendaClientProps) {
    const [items, setItems] = useState<AgendaItem[]>([
        {
            id: 1,
            project: 'Dashboard panel administrativo',
            subproject: 'Automatización de mensajes via WhatsApp y Correo',
            deliverable: 'Dashboard donde se centraliza datos de información de citas, formularios y analíticas',
            link: 'https://github.com/...',
            responsible: 'Javier',
            date: 'martes 9 de enero de 2026',
            status: 'En Proceso',
            observations: 'Falta de indicadores en hoja de canteras'
        },
        {
            id: 2,
            project: 'LIQ',
            subproject: 'Plataforma de aprendizaje con el modelo LMS',
            deliverable: 'Llevaremos a cabo la migración integral de nuestro servicio LMS hacia un stack tecnológico basado en Laravel.',
            link: 'Por definir',
            responsible: 'Esteban',
            date: 'viernes 5 de junio',
            status: 'Por definir',
            observations: ''
        },
        {
            id: 3,
            project: 'LICEON',
            subproject: '',
            deliverable: 'Por definir',
            link: 'Por definir',
            responsible: 'Esteban',
            date: 'Por definir',
            status: 'Stand by',
            observations: ''
        },
        {
            id: 4,
            project: 'Página WEB LM',
            subproject: '',
            deliverable: '',
            link: '',
            responsible: 'Juan',
            date: 'lunes 1 de junio de 2026',
            status: 'Stand by',
            observations: ''
        },
        {
            id: 5,
            project: 'Plataforma WEB LM',
            subproject: '',
            deliverable: '',
            link: '',
            responsible: 'Javier',
            date: '',
            status: 'Stand by',
            observations: ''
        },
        {
            id: 6,
            project: 'Integración de la Intranet',
            subproject: 'ERP',
            deliverable: '',
            link: '',
            responsible: 'Esteban',
            date: 'lunes 22 de junio de 2026',
            status: 'En Proceso',
            observations: ''
        }
    ])

    // State for Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null)
    const [itemToDelete, setItemToDelete] = useState<AgendaItem | null>(null)

    // Form State (New Item)
    const [newItem, setNewItem] = useState<Partial<AgendaItem>>({
        project: '',
        subproject: '',
        deliverable: '',
        link: '',
        responsible: '',
        date: '',
        status: 'Stand by',
        observations: ''
    })

    // Edit Form State
    const [editItem, setEditItem] = useState<Partial<AgendaItem>>({})

    const getStatusStyle = (status: string | undefined) => { // Handle potential undefined
        switch (status) {
            case 'En Proceso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'Completado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'Stand by': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        const newId = Math.max(...items.map(i => i.id), 0) + 1
        const createdItem: AgendaItem = {
            id: newId,
            project: newItem.project || '',
            subproject: newItem.subproject || '',
            deliverable: newItem.deliverable || '',
            link: newItem.link || '',
            responsible: newItem.responsible || '',
            date: newItem.date || '',
            status: (newItem.status as any) || 'Stand by',
            observations: newItem.observations || ''
        }
        setItems([...items, createdItem])
        setIsCreateModalOpen(false)
        setNewItem({
            project: '', subproject: '', deliverable: '', link: '', responsible: '', date: '', status: 'Stand by', observations: ''
        })
    }

    const handleEditClick = (item: AgendaItem) => {
        setSelectedItem(item)
        setEditItem({ ...item })
        setIsEditModalOpen(true)
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedItem) {
            const updatedItems = items.map(item =>
                item.id === selectedItem.id
                    ? { ...item, ...editItem } as AgendaItem
                    : item
            )
            setItems(updatedItems)
            setIsEditModalOpen(false)
            setSelectedItem(null)
        }
    }

    const handleDeleteClick = (item: AgendaItem) => {
        setItemToDelete(item)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = () => {
        if (itemToDelete) {
            setItems(items.filter(i => i.id !== itemToDelete.id))
            setIsDeleteModalOpen(false)
            setItemToDelete(null)
        }
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar user={user} openTicketsCount={openTicketsCount} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader title="Agenda Semestral" />

                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-8">
                        {/* Header Section */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CalendarIcon className="h-8 w-8 text-pink-600" />
                                    Agenda Semestral
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Cronograma de entregables y responsables</p>
                            </div>
                            <div className="flex gap-2 w-full lg:w-auto">
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo Evento
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
                                    placeholder="Buscar en agenda..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <Filter className="h-4 w-4" />
                                Filtros
                            </button>
                        </div>

                        {/* Custom Spreadsheet Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white w-12">#</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Proyecto General</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Subproyecto / Componente</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white max-w-xs">Descripción del Entregable</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Documento / Link</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Responsable</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Fecha Entrega</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Estatus</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Observaciones</th>
                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => handleEditClick(item)}>
                                            <td className="px-6 py-4 font-medium text-gray-500">{item.id}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.project}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.subproject || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={item.deliverable}>
                                                {item.deliverable || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                                {item.link && item.link.startsWith('http') ? (
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                        <LinkIcon className="h-3 w-3" /> Link
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">{item.link || '-'}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {item.responsible.charAt(0)}
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300">{item.responsible}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.date || 'Por definir'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate" title={item.observations}>
                                                {item.observations || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-blue-600 hover:text-blue-800 mr-2"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 hover:text-red-700"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Evento de Agenda</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyecto General</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newItem.project || ''}
                                        onChange={(e) => setNewItem({ ...newItem, project: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subproyecto / Componente</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newItem.subproject || ''}
                                        onChange={(e) => setNewItem({ ...newItem, subproject: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del Entregable</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newItem.deliverable || ''}
                                        onChange={(e) => setNewItem({ ...newItem, deliverable: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newItem.responsible || ''}
                                        onChange={(e) => setNewItem({ ...newItem, responsible: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Entrega</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. lunes 22 de junio"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newItem.date || ''}
                                        onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newItem.status || ''}
                                        onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                                    >
                                        <option value="En Proceso">En Proceso</option>
                                        <option value="Completado">Completado</option>
                                        <option value="Stand by">Stand by</option>
                                        <option value="Por definir">Por definir</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link / Documento</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={newItem.link || ''}
                                        onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                    <textarea
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        rows={2}
                                        value={newItem.observations || ''}
                                        onChange={(e) => setNewItem({ ...newItem, observations: e.target.value })}
                                    />
                                </div>
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
                                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                                >
                                    Crear Evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Evento</h2>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyecto General</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={editItem.project || ''}
                                        onChange={(e) => setEditItem({ ...editItem, project: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subproyecto / Componente</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={editItem.subproject || ''}
                                        onChange={(e) => setEditItem({ ...editItem, subproject: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del Entregable</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={editItem.deliverable || ''}
                                        onChange={(e) => setEditItem({ ...editItem, deliverable: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={editItem.responsible || ''}
                                        onChange={(e) => setEditItem({ ...editItem, responsible: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Entrega</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. lunes 22 de junio"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={editItem.date || ''}
                                        onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={editItem.status || ''}
                                        onChange={(e) => setEditItem({ ...editItem, status: e.target.value as any })}
                                    >
                                        <option value="En Proceso">En Proceso</option>
                                        <option value="Completado">Completado</option>
                                        <option value="Stand by">Stand by</option>
                                        <option value="Por definir">Por definir</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link / Documento</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        value={editItem.link || ''}
                                        onChange={(e) => setEditItem({ ...editItem, link: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                    <textarea
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                        rows={2}
                                        value={editItem.observations || ''}
                                        onChange={(e) => setEditItem({ ...editItem, observations: e.target.value })}
                                    />
                                </div>
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
                                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Eliminar evento?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Se eliminará permanentemente "{itemToDelete.project}". Esta acción no se puede deshacer.
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
