// Composant Skeleton réutilisable — remplace les spinners dans les tableaux et cartes
import { cn } from "@/lib/utils"

function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200/70",
                className
            )}
        />
    )
}

// ─── Skeleton Tableau (lignes de données) ────────────────────────────────
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="w-full space-y-0 overflow-hidden rounded-lg border">
            {/* Header */}
            <div className="flex gap-4 bg-slate-50 px-6 py-3 border-b">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className={`h-3 ${i === 0 ? 'flex-[2]' : 'flex-1'}`} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                    key={rowIdx}
                    className={`flex gap-4 px-6 py-4 border-b last:border-b-0 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                >
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <div key={colIdx} className={`${colIdx === 0 ? 'flex-[2] space-y-1.5' : 'flex-1 flex items-center'}`}>
                            {colIdx === 0 ? (
                                <>
                                    <Skeleton className="h-3.5 w-3/4" />
                                    <Skeleton className="h-2.5 w-1/2" />
                                </>
                            ) : (
                                <Skeleton className={`h-3 w-${colIdx === cols - 1 ? '16' : 'full'}`} />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

// ─── Skeleton Cards KPI (rangée de 4 cartes) ─────────────────────────────
export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-3 sm:gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white p-4 sm:p-5 space-y-3">
                    <div className="flex justify-between items-start">
                        <Skeleton className="h-2.5 w-24" />
                        <Skeleton className="h-8 w-8 rounded-xl" />
                    </div>
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-2 w-20" />
                </div>
            ))}
        </div>
    )
}

// ─── Skeleton Liste simple (pour panier vide, transactions, etc) ──────────
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-2.5 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            ))}
        </div>
    )
}

// ─── Skeleton Dashboard complet ───────────────────────────────────────────
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
            </div>
            {/* KPIs */}
            <KpiCardsSkeleton count={4} />
            {/* Grid areas */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4 rounded-xl border bg-white p-5 space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
                <div className="lg:col-span-3 rounded-xl border bg-white p-5 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <ListSkeleton rows={3} />
                </div>
            </div>
        </div>
    )
}

export { Skeleton }
