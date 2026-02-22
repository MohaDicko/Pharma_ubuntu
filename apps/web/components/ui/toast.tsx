"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react"

export type ToastType = 'success' | 'error' | 'warning'

interface Toast {
    id: number
    message: string
    type: ToastType
}

let toastId = 0
let addToastExternal: ((message: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
    if (addToastExternal) {
        addToastExternal(message, type)
    }
}

export function ToastProvider() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => removeToast(id), 4000)
    }, [removeToast])

    useEffect(() => {
        addToastExternal = addToast
        return () => { addToastExternal = null }
    }, [addToast])

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium
                        pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300
                        ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                        ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                        ${t.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : ''}
                    `}
                >
                    {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                    {t.type === 'error' && <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
                    {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />}
                    <span className="flex-1">{t.message}</span>
                    <button onClick={() => removeToast(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
