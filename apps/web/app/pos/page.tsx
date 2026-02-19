"use client"

import POS from "@/components/pos/POSTerminal"

export default function POSPage() {
    return (
        <div className="flex-1 p-6 h-[calc(100vh-64px)] overflow-hidden">
            <POS />
        </div>
    )
}
