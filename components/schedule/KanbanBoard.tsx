'use client'

import { useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EventCard from './EventCard'

interface Event {
    id: string
    title: string
    description?: string
    startDate: string
    endDate?: string
    allDay: boolean
    color?: string
    type: string
    status: string
    ticketId?: string
    user: {
        id: string
        name: string
        email: string
        avatar?: string
    }
    ticket?: {
        id: string
        number: number
        subject: string
        status: string
    }
}

interface KanbanBoardProps {
    events: Event[]
    onEventUpdate: (event: Event) => void
    onEditEvent: (event: Event) => void
}

const COLUMNS = [
    { id: 'PENDING', title: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' },
    { id: 'IN_PROGRESS', title: 'En Progreso', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' },
    { id: 'COMPLETED', title: 'Completado', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' },
    { id: 'CANCELLED', title: 'Cancelado', color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' }
]

function SortableItem({ event, onEdit }: { event: Event, onEdit: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: event.id, data: { event } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <EventCard event={event} onEdit={onEdit} />
        </div>
    )
}

export default function KanbanBoard({ events, onEventUpdate, onEditEvent }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeEvent, setActiveEvent] = useState<Event | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id as string)
        const item = active.data.current?.event as Event
        setActiveEvent(item)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) {
            setActiveId(null)
            setActiveEvent(null)
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        // Find the event
        const activeItem = events.find(e => e.id === activeId)
        if (!activeItem) return

        // Check if dropped on a column or another item
        let newStatus = activeItem.status
        const overColumn = COLUMNS.find(col => col.id === overId)

        if (overColumn) {
            // Dropped directly on a column
            newStatus = overColumn.id
        } else {
            // Dropped on another item, find its status
            const overItem = events.find(e => e.id === overId)
            if (overItem) {
                newStatus = overItem.status
            }
        }

        if (activeItem.status !== newStatus) {
            const updatedEvent = { ...activeItem, status: newStatus }

            // Optimistic update
            onEventUpdate(updatedEvent)

            // API call
            try {
                await fetch(`/api/events/${activeItem.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                })
            } catch (error) {
                console.error('Error updating event status:', error)
                // Revert on error (optional implementation)
            }
        }

        setActiveId(null)
        setActiveEvent(null)
    }

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
                {COLUMNS.map(column => {
                    const columnEvents = events.filter(e => e.status === column.id)

                    return (
                        <div key={column.id} className="flex-shrink-0 w-80 flex flex-col bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                            {/* Header */}
                            <div className={`p-4 border-b border-gray-200 dark:border-slate-800 font-semibold flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl z-10`}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${column.color.split(' ')[0]}`} />
                                    <span className="text-gray-700 dark:text-gray-200">{column.title}</span>
                                </div>
                                <span className="bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                                    {columnEvents.length}
                                </span>
                            </div>

                            {/* Droppable Area */}
                            <div className="p-3 flex-1 overflow-y-auto">
                                <SortableContext
                                    id={column.id}
                                    items={columnEvents.map(e => e.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="min-h-[100px]">
                                        {columnEvents.map((event) => (
                                            <SortableItem
                                                key={event.id}
                                                event={event}
                                                onEdit={() => onEditEvent(event)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </div>
                        </div>
                    )
                })}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeEvent ? (
                    <div className="w-80">
                        <EventCard event={activeEvent} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
