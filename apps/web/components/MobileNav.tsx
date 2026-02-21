"use client"

import { useState } from "react"
import { Menu, X, Hospital } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="md:hidden">
            {/* Header Mobile Fixed */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-40 shadow-sm">
                <div className="flex items-center gap-2">
                    <Hospital className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold text-primary">Sahel CPMS</span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(true)}
                    className="text-primary hover:bg-primary/10"
                >
                    <Menu className="h-6 w-6" />
                </Button>
            </header>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-out Menu */}
            <aside className={cn(
                "fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[60] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-6 border-b">
                    <span className="font-bold text-primary">Menu Navigation</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <Sidebar onClick={() => setIsOpen(false)} />
                </div>

                <div className="p-4 border-t bg-slate-50 text-[10px] text-center text-muted-foreground flex flex-col gap-1">
                    <span className="uppercase tracking-widest font-bold">© 2026 Cabinet Ubuntu</span>
                    <span>Par <a href="https://sahelmultiservices.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Sahel Multiservices</a></span>
                </div>
            </aside>

            {/* Spacer for fixed header */}
            <div className="h-16" />
        </div>
    )
}
