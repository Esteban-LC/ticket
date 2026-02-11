'use client'

import { useState, useEffect } from 'react'
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
    Clock,
    Loader2
} from 'lucide-react'

interface AgendaItem {
    id: string
    project: string
    subproject: string | null
    deliverable: string | null
    link: string | null
    responsible: string | null
    date: string | null
    status: string
    observations: string | null
    userId: string
    user?: { id: string; name: string | null; email: string }
}

interface AgendaClientProps {
    user: any
    openTicketsCount: number
}

export default function AgendaClient({ user, openTicketsCount }: AgendaClientProps) {
    const canEdit = user?.role !== 'VIEWER'
    const [items, setItems] = useState<AgendaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null)
    const [itemToDelete, setItemToDelete] = useState<AgendaItem | null>(null)
    const [saving, setSaving] = useState(false)
    const [newItem, setNewItem] = useState<Partial<AgendaItem>>({
        project: '', subproject: '', deliverable: '', link: '', responsible: '', date: '', status: 'Stand by', observations: ''
    })
    const [editItem, setEditItem] = useState<Partial<AgendaItem>>({})

    const fetchItems = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/agenda')
            if (res.ok) {
                setItems(await res.json())
            }
        } catch (error) {
            console.error('Error fetching agenda:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchItems() }, [])

    const getStatusStyle = (status: string | undefined) => {
        switch (status) {
            case 'En Proceso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'Completado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'Stand by': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) })
            if (res.ok) {
                setItems([...items, await res.json()])
                setIsCreateModalOpen(false)
                setNewItem({ project: '', subproject: '', deliverable: '', link: '', responsible: '', date: '', status: 'Stand by', observations: '' })
            }
        } catch (error) { console.error('Error:', error) } finally { setSaving(false) }
    }

    const handleEditClick = (item: AgendaItem) => { setSelectedItem(item); setEditItem({ ...item }); setIsEditModalOpen(true) }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedItem) return
        setSaving(true)
        try {
            const res = await fetch(`/api/agenda/${selectedItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) })
            if (res.ok) {
                const updated = await res.json()
                setItems(items.map(item => item.id === selectedItem.id ? updated : item))
                setIsEditModalOpen(false); setSelectedItem(null)
            }
        } catch (error) { console.error('Error:', error) } finally { setSaving(false) }
    }

    const handleDeleteClick = (item: AgendaItem) => { setItemToDelete(item); setIsDeleteModalOpen(true) }

    const confirmDelete = async () => {
        if (!itemToDelete) return
        setSaving(true)
        try {
            const res = await fetch(`/api/agenda/${itemToDelete.id}`, { method: 'DELETE' })
            if (res.ok) { setItems(items.filter(i => i.id !== itemToDelete.id)); setIsDeleteModalOpen(false); setItemToDelete(null) }
        } catch (error) { console.error('Error:', error) } finally { setSaving(false) }
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar user={user} openTicketsCount={openTicketsCount} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader title="Agenda Semestral" />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CalendarIcon className="h-8 w-8 text-pink-600" />
                                    Agenda Semestral
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Cronograma de entregables y responsables</p>
                            </div>
                            {canEdit && (
                                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors">
                                    <Plus className="h-4 w-4" /> Nuevo Evento
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                                <span className="ml-3 text-gray-500 dark:text-gray-400">Cargando agenda...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-20">
                                <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Sin eventos en agenda</h3>
                                <p className="text-gray-500 dark:text-gray-400">Crea tu primer evento para comenzar.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white w-12">#</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Proyecto General</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Subproyecto</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white max-w-xs">Entregable</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Link</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Responsable</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Fecha</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Estatus</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Observaciones</th>
                                            <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-500">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.project}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.subproject || '-'}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={item.deliverable || ''}>{item.deliverable || '-'}</td>
                                                <td className="px-6 py-4">
                                                    {item.link && item.link.startsWith('http') ? (
                                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Link</a>
                                                    ) : (<span className="text-gray-400">{item.link || '-'}</span>)}
                                                </td>
                                                <td className="px-6 py-4 flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">{(item.responsible || '?').charAt(0)}</div>
                                                    <span className="text-gray-700 dark:text-gray-300">{item.responsible || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.date || 'Por definir'}</td>
                                                <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(item.status)}`}>{item.status}</span></td>
                                                <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate" title={item.observations || ''}>{item.observations || '-'}</td>
                                                {canEdit && (
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => handleEditClick(item)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-blue-600 hover:text-blue-800 mr-2">Editar</button>
                                                        <button onClick={() => handleDeleteClick(item)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 hover:text-red-700">Eliminar</button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-slate-800"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Evento de Agenda</h2></div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyecto General</label><input type="text" required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newItem.project || ''} onChange={(e) => setNewItem({ ...newItem, project: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subproyecto</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newItem.subproject || ''} onChange={(e) => setNewItem({ ...newItem, subproject: e.target.value })} /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del Entregable</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newItem.deliverable || ''} onChange={(e) => setNewItem({ ...newItem, deliverable: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newItem.responsible || ''} onChange={(e) => setNewItem({ ...newItem, responsible: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Entrega</label><input type="text" placeholder="Ej. lunes 22 de junio" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newItem.date || ''} onChange={(e) => setNewItem({ ...newItem, date: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label><select className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newItem.status || ''} onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}><option value="En Proceso">En Proceso</option><option value="Completado">Completado</option><option value="Stand by">Stand by</option><option value="Por definir">Por definir</option></select></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link / Documento</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={newItem.link || ''} onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label><textarea className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" rows={2} value={newItem.observations || ''} onChange={(e) => setNewItem({ ...newItem, observations: e.target.value })} /></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Guardando...' : 'Crear Evento'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-slate-800"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Evento</h2></div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyecto General</label><input type="text" required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={editItem.project || ''} onChange={(e) => setEditItem({ ...editItem, project: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subproyecto</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={editItem.subproject || ''} onChange={(e) => setEditItem({ ...editItem, subproject: e.target.value })} /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del Entregable</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={editItem.deliverable || ''} onChange={(e) => setEditItem({ ...editItem, deliverable: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={editItem.responsible || ''} onChange={(e) => setEditItem({ ...editItem, responsible: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Entrega</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={editItem.date || ''} onChange={(e) => setEditItem({ ...editItem, date: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label><select className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={editItem.status || ''} onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}><option value="En Proceso">En Proceso</option><option value="Completado">Completado</option><option value="Stand by">Stand by</option><option value="Por definir">Por definir</option></select></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link / Documento</label><input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" value={editItem.link || ''} onChange={(e) => setEditItem({ ...editItem, link: e.target.value })} /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label><textarea className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white" rows={2} value={editItem.observations || ''} onChange={(e) => setEditItem({ ...editItem, observations: e.target.value })} /></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Eliminar evento?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Se eliminará &quot;{itemToDelete.project}&quot;. Esta acción no se puede deshacer.</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Eliminando...' : 'Eliminar'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
