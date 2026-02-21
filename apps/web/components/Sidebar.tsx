"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import {
    BarChart4,
    Settings,
    Package,
    Users,
    CreditCard,
    ClipboardList,
    LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
    onClick?: () => void;
}

export function Sidebar({ className, onClick, ...props }: SidebarProps) {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    // Définition des menus avec permissions
    const allNavItems = [
        {
            title: "Tableau de Bord",
            href: "/",
            icon: BarChart4,
            roles: ['ADMIN', 'PHARMACIST', 'STOCK_MANAGER']
        },
        {
            title: "Point de Vente",
            href: "/pos",
            icon: CreditCard,
            roles: ['ADMIN', 'PHARMACIST']
        },
        {
            title: "Stocks & Lots",
            href: "/inventory",
            icon: Package,
            roles: ['ADMIN', 'PHARMACIST', 'STOCK_MANAGER'] // Pharmacien voit stock mais ne modifie pas tout
        },
        {
            title: "Transactions",
            href: "/transactions",
            icon: ClipboardList,
            roles: ['ADMIN'] // Seul le patron voit l'argent
        },
        {
            title: "Utilisateurs",
            href: "/users",
            icon: Users,
            roles: ['ADMIN']
        },
        {
            title: "Paramètres",
            href: "/settings",
            icon: Settings,
            roles: ['ADMIN']
        },
    ]

    // Filtrer selon le rôle
    const userRole = user?.role || 'PHARMACIST' // Fallback safe
    const visibleItems = allNavItems.filter(item => item.roles.includes(userRole))

    return (
        <nav
            className={cn(
                "flex flex-col h-full space-y-1",
                className
            )}
            {...props}
        >
            <div className="flex-1 space-y-1">
                {visibleItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClick}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                            pathname === item.href
                                ? "bg-accent text-accent-foreground font-semibold border-l-4 border-primary pl-2 shadow-sm"
                                : "text-muted-foreground bg-transparent",
                            "justify-start"
                        )}
                    >
                        <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-primary" : "")} />
                        {item.title}
                    </Link>
                ))}
            </div>

            <div className="pt-4 mt-auto">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => logout()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                </Button>

                <div className="mt-4 px-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                        Développé par
                    </p>
                    <a
                        href="https://sahelmultiservices.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-primary hover:underline"
                    >
                        Sahel Multiservices
                    </a>
                </div>
            </div>
        </nav>
    )
}
