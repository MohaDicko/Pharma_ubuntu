"use client"

import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/Sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePathname } from "next/navigation"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const pathname = usePathname()

    // Routes publiques sans Sidebar
    if (pathname === '/login') {
        return <main className="flex-1 min-h-screen bg-background">{children}</main>
    }

    // App principale avec Sidebar (mode Loading ou Connecté)
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Navigation */}
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
                    {loading ? (
                        <div className="text-xs text-muted-foreground animate-pulse">Chargement profil...</div>
                    ) : user ? (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase ring-2 ring-primary/10">
                                {user.name.charAt(0)}
                            </div>
                            <div className="text-sm overflow-hidden">
                                <p className="font-medium truncate max-w-[140px]" title={user.name}>{user.name}</p>
                                <p className="text-xs text-muted-foreground font-semibold">{user.role}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-red-500">Non connecté</div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50">
                {children}
            </main>
        </div>
    )
}
