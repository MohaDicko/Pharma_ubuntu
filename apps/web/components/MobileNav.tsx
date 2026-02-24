"use client"

import { useState } from "react"
import { Menu, X, Hospital } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

// Map des titres de page
const PAGE_TITLES: Record<string, string> = {
    "/": "Tableau de Bord",
    "/pos": "Point de Vente",
    "/inventory": "Stocks & Lots",
    "/transactions": "Transactions",
    "/users": "Utilisateurs",
    "/audit": "Sécurité & Audit",
    "/reports": "Analyses & Rapports",
    "/settings": "Paramètres",
    "/inventory/receive": "Réception de Stock",
}

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const { user } = useAuth()

    const pageTitle = PAGE_TITLES[pathname] || "Ubuntu"
    const isPos = pathname === "/pos"

    return (
        <div className="md:hidden">
            {/* Header Mobile Fixed */}
            <header className="h-14 bg-white border-b flex items-center justify-between px-4 z-40 shadow-sm">
                {/* Logo + Titre de page */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                        <Hospital className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate leading-tight">{pageTitle}</p>
                        {user && (
                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5 truncate">
                                {user.name} · <span className="font-semibold text-primary">{user.role}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions droite */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Indicateur POS actif */}
                    {isPos && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            En ligne
                        </span>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(true)}
                        className="h-9 w-9 text-slate-600 hover:bg-slate-100"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Slide-in Menu — depuis la gauche (plus naturel) */}
            <aside className={cn(
                "fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[60] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header du drawer */}
                <div className="flex h-14 items-center justify-between px-4 border-b bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <Hospital className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-black text-slate-900 text-sm">Ubuntu CPMS</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Profil utilisateur */}
                {user && (
                    <div className="px-4 py-3 border-b bg-white">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black uppercase text-sm ring-2 ring-primary/10 shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-3 px-3">
                    <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Navigation</p>
                    <Sidebar onClick={() => setIsOpen(false)} />
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 text-[10px] text-center text-muted-foreground space-y-0.5">
                    <p className="uppercase tracking-widest font-bold text-slate-400">© 2026 Cabinet Ubuntu</p>
                    <p>Par <a href="https://sahelmultiservices.com" target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold">Sahel Multiservices</a></p>
                </div>
            </aside>
        </div>
    )
}
