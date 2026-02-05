'use client'

import { useState } from 'react'
import {
    FileText,
    Download,
    ExternalLink,
    Eye,
    Calendar,
    CheckCircle2,
    Clock,
    Plus,
    X,
    Upload,
    Link as LinkIcon,
    File,
    Trash2,
    AlertTriangle,
    Pencil
} from 'lucide-react'

interface Report {
    id: number
    name: string
    date: string
    type: 'PDF' | 'XLSX' | 'CSV' | 'LINK' | 'IMG'
    status: string
    size: string
    url?: string
    description?: string
}

interface ReportsClientProps {
    initialReports: Report[]
}

export default function ReportsClient({ initialReports }: ReportsClientProps) {
    const [reports, setReports] = useState<Report[]>(initialReports)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [reportToDelete, setReportToDelete] = useState<Report | null>(null)
    const [reportToEdit, setReportToEdit] = useState<Report | null>(null)

    // Form State
    const [newReportName, setNewReportName] = useState('')
    const [newReportType, setNewReportType] = useState<'FILE' | 'LINK'>('FILE')
    const [newReportFile, setNewReportFile] = useState<File | null>(null)
    const [newReportUrl, setNewReportUrl] = useState('')
    const [newReportDate, setNewReportDate] = useState('')
    const [newReportStatus, setNewReportStatus] = useState('Disponible')

    // Edit Form State
    const [editReportName, setEditReportName] = useState('')
    const [editReportType, setEditReportType] = useState<'FILE' | 'LINK'>('FILE')
    const [editReportStatus, setEditReportStatus] = useState('Disponible')
    const [editReportFile, setEditReportFile] = useState<File | null>(null)
    const [editReportUrl, setEditReportUrl] = useState('')
    const [editReportDate, setEditReportDate] = useState('')

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Disponible':
            case 'Activo':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'Archivado':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            case 'Confidencial':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            default:
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PDF':
                return <FileText className="h-5 w-5 text-red-500" />
            case 'XLSX':
            case 'CSV':
                return <FileText className="h-5 w-5 text-emerald-500" />
            case 'LINK':
                return <ExternalLink className="h-5 w-5 text-blue-500" />
            default:
                return <FileText className="h-5 w-5 text-slate-500" />
        }
    }

    const handleCreateReport = (e: React.FormEvent) => {
        e.preventDefault()

        // Simulate creation
        const newReport: Report = {
            id: Date.now(),
            name: newReportName,
            date: newReportDate || new Date().toISOString().split('T')[0],
            type: newReportType === 'LINK' ? 'LINK' : 'PDF', // Mocking PDF for files
            status: newReportStatus,
            size: newReportType === 'LINK' ? '-' : '1.2 MB', // Mock size
            url: newReportUrl || '#',
            description: 'Reporte generado recientemente'
        }

        setReports([newReport, ...reports])
        setIsCreateModalOpen(false)
        // Reset form
        setNewReportName('')
        setNewReportType('FILE')
        setNewReportStatus('Disponible')
        setNewReportFile(null)
        setNewReportUrl('')
        setNewReportDate('')
    }

    const openViewModal = (report: Report) => {
        setSelectedReport(report)
        setIsViewModalOpen(true)
    }

    const handleDeleteClick = (report: Report) => {
        setReportToDelete(report)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = () => {
        if (reportToDelete) {
            setReports(reports.filter(r => r.id !== reportToDelete.id))
            setIsDeleteModalOpen(false)
            setReportToDelete(null)
        }
    }

    const handleEditClick = (report: Report) => {
        setReportToEdit(report)

        setEditReportName(report.name)
        setEditReportDate(report.date)
        setEditReportType(report.type === 'LINK' ? 'LINK' : 'FILE')
        setEditReportStatus(report.status)
        setEditReportUrl(report.url || '')
        setEditReportFile(null) // Reset file on open
        setIsEditModalOpen(true)
    }

    const handleUpdateReport = (e: React.FormEvent) => {
        e.preventDefault()
        if (reportToEdit) {
            const updatedReports = reports.map(r =>
                r.id === reportToEdit.id
                    ? {
                        ...r,
                        name: editReportName,
                        date: editReportDate,
                        status: editReportStatus,
                        type: editReportType === 'LINK' ? 'LINK' as const : (r.type === 'LINK' ? 'PDF' as const : r.type), // Simple mock type switch
                        url: editReportUrl || r.url
                    }
                    : r
            )
            setReports(updatedReports)
            setIsEditModalOpen(false)
            setReportToEdit(null)
        }
    }

    const groupReportsByMonth = (reports: Report[]) => {
        const groups: { [key: string]: Report[] } = {}

        // Sort by date descending
        const sortedReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        sortedReports.forEach(report => {
            const date = new Date(report.date)
            // Manual month names to ensure Spanish
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
            const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

            if (!groups[monthYear]) {
                groups[monthYear] = []
            }
            groups[monthYear].push(report)
        })
        return groups
    }

    const groupedReports = groupReportsByMonth(reports)

    return (
        <div className="p-4 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Gestión de Reportes</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Accede a documentos, métricas y enlaces importantes</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                    <Plus className="h-5 w-5" />
                    Nuevo Reporte
                </button>
            </div>

            {/* Container for Reports */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Nombre del Reporte</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Tamaño</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {Object.entries(groupedReports).map(([monthYear, groupReports]) => (
                                <>
                                    <tr key={monthYear} className="bg-gray-50/50 dark:bg-slate-800/30">
                                        <td colSpan={5} className="px-6 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {monthYear}
                                        </td>
                                    </tr>
                                    {groupReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800">
                                                        {getTypeIcon(report.type)}
                                                    </div>
                                                    <div>
                                                        <div>{report.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{report.type}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {report.date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {report.size}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openViewModal(report)}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Ver"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(report)}
                                                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteClick(report)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <File className="h-10 w-10 text-gray-300 dark:text-slate-600" />
                                            <p>No hay reportes disponibles</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE REPORT MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Reporte</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateReport} className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Reporte</label>
                                <input
                                    type="text"
                                    required
                                    value={newReportName}
                                    onChange={(e) => setNewReportName(e.target.value)}
                                    placeholder="Ej. Reporte Mensual Marzo"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del Reporte</label>
                                <input
                                    type="date"
                                    required
                                    value={newReportDate}
                                    onChange={(e) => setNewReportDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                <select
                                    value={newReportStatus}
                                    onChange={(e) => setNewReportStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Disponible">Disponible</option>
                                    <option value="Activo">Activo</option>
                                    <option value="Confidencial">Confidencial</option>
                                    <option value="Archivado">Archivado</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Contenido</label>
                                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setNewReportType('FILE')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${newReportType === 'FILE' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Archivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewReportType('LINK')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${newReportType === 'LINK' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        Enlace
                                    </button>
                                </div>
                            </div>

                            {newReportType === 'FILE' ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subir Archivo</label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => setNewReportFile(e.target.files?.[0] || null)}
                                        />
                                        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <Upload className="h-8 w-8" />
                                            <span className="text-sm">{newReportFile ? newReportFile.name : 'Arrastra un archivo o haz clic para seleccionar'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL del Recurso</label>
                                    <input
                                        type="url"
                                        required
                                        value={newReportUrl}
                                        onChange={(e) => setNewReportUrl(e.target.value)}
                                        placeholder="https://ejemplo.com/reporte"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Crear Reporte
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW REPORT MODAL */}
            {isViewModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                    {getTypeIcon(selectedReport.type)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedReport.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedReport.date} • {selectedReport.size}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-4 overflow-auto flex items-center justify-center">
                            {/* Preview Logic */}
                            {selectedReport.type === 'LINK' ? (
                                <div className="w-full h-full flex flex-col">
                                    <iframe
                                        src={selectedReport.url?.includes('docs.google.com') && selectedReport.url.includes('/edit')
                                            ? selectedReport.url.replace(/\/edit.*/, '/preview')
                                            : selectedReport.url}
                                        className="w-full flex-1 rounded-lg border border-gray-200 dark:border-slate-800 bg-white"
                                        title="Report Preview"
                                        allowFullScreen
                                    />
                                    <div className="mt-4 flex justify-center">
                                        <a
                                            href={selectedReport.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                        >
                                            Abrir en nueva pestaña <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            ) : selectedReport.type === 'IMG' ? (
                                <img src={selectedReport.url} alt={selectedReport.name} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                            ) : (
                                <div className="text-center space-y-4">
                                    <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Vista previa no disponible</h4>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                        Este tipo de archivo ({selectedReport.type}) no se puede previsualizar directamente aquí. Por favor, descárgalo para verlo.
                                    </p>
                                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                                        Descargar Archivo <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>


                    </div>
                </div>
            )}
            {/* DELETE CONFIRMATION MODAL */}
            {
                isDeleteModalOpen && reportToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    ¿Estás seguro?
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Estás a punto de eliminar el reporte <span className="font-medium text-gray-900 dark:text-white">"{reportToDelete.name}"</span>. Esta acción no se puede deshacer.
                                </p>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        Sí, eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* EDIT REPORT MODAL */}
            {isEditModalOpen && reportToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Reporte</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateReport} className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Reporte</label>
                                <input
                                    type="text"
                                    required
                                    value={editReportName}
                                    onChange={(e) => setEditReportName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del Reporte</label>
                                <input
                                    type="date"
                                    required
                                    value={editReportDate}
                                    onChange={(e) => setEditReportDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                <select
                                    value={editReportStatus}
                                    onChange={(e) => setEditReportStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Disponible">Disponible</option>
                                    <option value="Activo">Activo</option>
                                    <option value="Confidencial">Confidencial</option>
                                    <option value="Archivado">Archivado</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Contenido</label>
                                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setEditReportType('FILE')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${editReportType === 'FILE' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Archivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditReportType('LINK')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${editReportType === 'LINK' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        Enlace
                                    </button>
                                </div>
                            </div>

                            {editReportType === 'FILE' ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reemplazar Archivo (Opcional)</label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => setEditReportFile(e.target.files?.[0] || null)}
                                        />
                                        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <Upload className="h-8 w-8" />
                                            <span className="text-sm">{editReportFile ? editReportFile.name : 'Arrastra un archivo o haz clic para seleccionar'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL del Recurso</label>
                                    <input
                                        type="url"
                                        required
                                        value={editReportUrl}
                                        onChange={(e) => setEditReportUrl(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    )
}
