"use client"

import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OfflineBanner } from "@/components/OfflineBanner"
import { usePathname } from "next/navigation"
import { ToastProvider } from "@/components/ui/toast"
import { CabinetUbuntuLogo } from "@/components/CabinetUbuntuLogo"

// Écran de chargement partagé — évite la page blanche
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

    // Routes publiques sans Sidebar
    if (pathname === '/login') {
        return (
            <>
                <main className="flex-1 min-h-screen bg-background">{children}</main>
                <ToastProvider />
            </>
        )
    }

    // Chargement de la session : spinner au lieu de page blanche
    if (loading) {
        return <LoadingScreen message="Chargement de votre session..." />
    }

    // Pas encore de user (pendant la redirection middleware) :
    // on affiche le spinner au lieu de null (page blanche)
    if (!user) {
        return <LoadingScreen message="Vérification des accès..." />
    }

    // App principale avec Sidebar
    return (
        <div className="flex flex-col h-screen overflow-hidden animate-in fade-in duration-300">
            <OfflineBanner />
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                <MobileNav />

                {/* Sidebar Navigation (Desktop) */}
                <aside className="hidden w-64 flex-col border-r bg-card md:flex">
                    <div className="flex h-14 items-center border-b px-4 gap-3">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <CabinetUbuntuLogo className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-base font-bold text-primary">Sahel CPMS</span>
                    </div>
                    <ScrollArea className="flex-1 py-4">
                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                                Navigation
                            </h2>
                            <Sidebar />
                        </div>
                    </ScrollArea>

                    {/* User Profile */}
                    <div className="mt-auto border-t p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase ring-2 ring-primary/10">
                                {user.name.charAt(0)}
                            </div>
                            <div className="text-sm overflow-hidden">
                                <p className="font-medium truncate max-w-[140px]" title={user.name}>{user.name}</p>
                                <p className="text-xs text-muted-foreground font-semibold uppercase">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50/50">
                    {children}
                </main>
            </div>
            <ToastProvider />
        </div>
    )
}
