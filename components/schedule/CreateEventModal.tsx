'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface CreateEventModalProps {
    initialDate?: Date
    eventToEdit?: any
    onClose: () => void
    onEventCreated: () => void
}

const EVENT_TYPES = [
    { value: 'TASK', label: 'Tarea', color: '#8b5cf6' },
    { value: 'MEETING', label: 'Reunión', color: '#3b82f6' },
    { value: 'DEADLINE', label: 'Fecha límite', color: '#f59e0b' },
    { value: 'REMINDER', label: 'Recordatorio', color: '#10b981' },
    { value: 'MAINTENANCE', label: 'Mantenimiento', color: '#ef4444' }
]

const EVENT_STATUSES = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'IN_PROGRESS', label: 'En progreso' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' }
]

export default function CreateEventModal({
    initialDate,
    eventToEdit,
    onClose,
    onEventCreated
}: CreateEventModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        allDay: false,
        type: 'TASK',
        status: 'PENDING',
        color: '#8b5cf6',
        ticketId: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [tickets, setTickets] = useState<any[]>([])

    useEffect(() => {
        // Cargar tickets disponibles
        fetchTickets()

        // Si hay una fecha inicial, configurarla
        if (initialDate) {
            const dateStr = initialDate.toISOString().split('T')[0]
            setFormData(prev => ({
                ...prev,
                startDate: dateStr,
                endDate: dateStr
            }))
        }

        // Si hay un evento para editar, cargar sus datos
        if (eventToEdit) {
            const startDate = new Date(eventToEdit.startDate)
            const endDate = eventToEdit.endDate ? new Date(eventToEdit.endDate) : null

            setFormData({
                title: eventToEdit.title,
                description: eventToEdit.description || '',
                startDate: startDate.toISOString().split('T')[0],
                startTime: eventToEdit.allDay ? '' : startDate.toTimeString().slice(0, 5),
                endDate: endDate ? endDate.toISOString().split('T')[0] : '',
                endTime: endDate && !eventToEdit.allDay ? endDate.toTimeString().slice(0, 5) : '',
                allDay: eventToEdit.allDay,
                type: eventToEdit.type,
                status: eventToEdit.status,
                color: eventToEdit.color || '#8b5cf6',
                ticketId: eventToEdit.ticketId || ''
            })
        }
    }, [initialDate, eventToEdit])

    const fetchTickets = async () => {
        try {
            const response = await fetch('/api/tickets')
            if (response.ok) {
                const data = await response.json()
                setTickets(data.tickets || [])
            }
        } catch (error) {
            console.error('Error al cargar tickets:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Construir fechas ISO
            let startDateTime: string
            let endDateTime: string | undefined

            if (formData.allDay) {
                startDateTime = new Date(formData.startDate).toISOString()
                endDateTime = formData.endDate ? new Date(formData.endDate).toISOString() : undefined
            } else {
                startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString()
                endDateTime = formData.endDate && formData.endTime
                    ? new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
                    : undefined
            }

            const payload = {
                title: formData.title,
                description: formData.description || undefined,
                startDate: startDateTime,
                endDate: endDateTime,
                allDay: formData.allDay,
                type: formData.type,
                status: formData.status,
                color: formData.color,
                ticketId: formData.ticketId || undefined
            }

            const url = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events'
            const method = eventToEdit ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al guardar evento')
            }

            onEventCreated()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleTypeChange = (type: string) => {
        const selectedType = EVENT_TYPES.find(t => t.value === type)
        setFormData(prev => ({
            ...prev,
            type,
            color: selectedType?.color || prev.color
        }))
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {eventToEdit ? 'Editar Evento' : 'Nuevo Evento'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="Nombre del evento"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="Detalles del evento"
                        />
                    </div>

                    {/* Todo el día */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="allDay"
                            checked={formData.allDay}
                            onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="allDay" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Todo el día
                        </label>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha de inicio *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {!formData.allDay && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Hora de inicio *
                                </label>
                                <input
                                    type="time"
                                    required={!formData.allDay}
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha de fin
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {!formData.allDay && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Hora de fin
                                </label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* Tipo y Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            >
                                {EVENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Estado *
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            >
                                {EVENT_STATUSES.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Color
                        </label>
                        <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="w-20 h-10 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer bg-white dark:bg-slate-700"
                        />
                    </div>

                    {/* Ticket relacionado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ticket relacionado (opcional)
                        </label>
                        <select
                            value={formData.ticketId}
                            onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Sin ticket relacionado</option>
                            {tickets.map(ticket => (
                                <option key={ticket.id} value={ticket.id}>
                                    #{ticket.number} - {ticket.subject}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : eventToEdit ? 'Actualizar' : 'Crear Evento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
