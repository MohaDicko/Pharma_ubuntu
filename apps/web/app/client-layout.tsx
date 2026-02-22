"use client"

import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OfflineBanner } from "@/components/OfflineBanner"
import { usePathname } from "next/navigation"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const pathname = usePathname()

    // Routes publiques sans Sidebar
    if (pathname === '/login') {
        return <main className="flex-1 min-h-screen bg-background">{children}</main>
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Initialisation du système...</p>
                </div>
            </div>
        )
    }

    // Si on n'est pas sur login et pas de user après chargement, 
    // l'utilisateur sera redirigé par le middleware, mais on évite de flasher le layout
    if (!user) {
        return null;
    }

    // App principale avec Sidebar
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <OfflineBanner />
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                <MobileNav />

                {/* Sidebar Navigation (Desktop) */}
                <aside className="hidden w-64 flex-col border-r bg-card md:flex">
                    <div className="flex h-14 items-center border-b px-4">
                        <span className="text-xl font-bold text-primary">🏥 Sahel CPMS</span>
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
        </div>
    )
}
