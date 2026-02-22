"use client"

import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OfflineBanner } from "@/components/OfflineBanner"
import { usePathname } from "next/navigation"
import { ToastProvider } from "@/components/ui/toast"
import { CabinetUbuntuLogo } from "@/components/CabinetUbuntuLogo"

function LoadingScreen({ message = "Initialisation..." }: { message?: string }) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-5">
                <div className="relative">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CabinetUbuntuLogo className="h-7 w-7 text-primary" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-700">{message}</p>
                    <p className="text-xs text-slate-400">Sahel CPMS</p>
                </div>
            </div>
        </div>
    )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const pathname = usePathname()

    if (pathname === '/login') {
        return (
            <>
                <main className="flex-1 min-h-screen bg-background">{children}</main>
                <ToastProvider />
            </>
        )
    }

    if (loading) return <LoadingScreen message="Chargement de votre session..." />
    if (!user) return <LoadingScreen message="Vérification des accès..." />

    return (
        <div className="flex flex-col h-screen overflow-hidden animate-in fade-in duration-300">
            <OfflineBanner />
            <div className="flex flex-1 overflow-hidden">

                {/* ─── Sidebar Desktop ─────────────────────────────────── */}
                <aside className="hidden md:flex w-56 lg:w-64 flex-col border-r bg-card shrink-0">
                    <div className="flex h-14 items-center border-b px-4 gap-3">
                        <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                            <CabinetUbuntuLogo className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm lg:text-base font-bold text-primary truncate">Sahel CPMS</span>
                    </div>
                    <ScrollArea className="flex-1 py-3">
                        <div className="px-2 lg:px-3">
                            <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Navigation
                            </p>
                            <Sidebar />
                        </div>
                    </ScrollArea>
                    <div className="mt-auto border-t p-3 lg:p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black uppercase ring-2 ring-primary/10 shrink-0 text-sm">
                                {user.name.charAt(0)}
                            </div>
                            <div className="text-sm overflow-hidden min-w-0">
                                <p className="font-semibold truncate text-slate-900" title={user.name}>{user.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ─── Contenu Principal ────────────────────────────────── */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Mobile Nav Header */}
                    <MobileNav />

                    {/* Page content — scroll interne */}
                    <main className="flex-1 overflow-y-auto bg-slate-50/50">
                        {children}
                    </main>
                </div>
            </div>
            <ToastProvider />
        </div>
    )
}
