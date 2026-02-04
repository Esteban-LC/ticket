'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarContextType {
    isOpen: boolean
    toggle: () => void
    close: () => void
    open: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <SidebarContext.Provider value={{
            isOpen,
            toggle: () => setIsOpen(!isOpen),
            close: () => setIsOpen(false),
            open: () => setIsOpen(true)
        }}>
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider')
    }
    return context
}
