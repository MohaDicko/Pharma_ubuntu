"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Activity, AlertTriangle, PackageSearch, Loader2, TrendingUp, ShoppingCart, Users, Clock } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DashboardStats {
    revenueToday: number
    stockValue: number
    stockCount: number
    outOfStockCount: number
    expiringBatches: Array<{
        productName: string
        batchNumber: string
        expiryDate: string
        quantity: number
    }>
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
    title: string, value: string, subtitle: string,
    icon: React.ElementType, color: string
}) {
    return (
        <Card className={`hover:shadow-md transition-all border-l-4 ${color}`}>
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
                        <p className="text-xl sm:text-2xl font-black mt-1 text-slate-900 truncate">{value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">{subtitle}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl shrink-0 ${color.replace('border-l-', 'bg-').replace('-500', '-100').replace('-600', '-100')}`}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color.replace('border-l-', 'text-')}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function DashboardOverview() {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/dashboard/stats')
                if (res.ok) setStats(await res.json())
            } catch (e) {
                console.error("Dashboard stats error:", e)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const isAdmin = user?.role === 'ADMIN'
    const isPharmacist = user?.role === 'PHARMACIST'
    const isCashier = user?.role === 'CASHIER'

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-base font-medium text-muted-foreground">Chargement...</span>
            </div>
        )
    }

    const revenue = stats?.revenueToday || 0
    const stockValue = stats?.stockValue || 0
    const outOfStock = stats?.outOfStockCount || 0
    const stockCount = stats?.stockCount || 0
    const expires = stats?.expiringBatches || []

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        Bonjour, {user?.name.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {/* Raccourci rapide selon rôle */}
                {(isCashier || isPharmacist || isAdmin) && (
                    <Link href="/pos">
                        <Button className="w-full sm:w-auto shadow-lg">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Nouvelle Vente
                        </Button>
                    </Link>
                )}
            </div>

            {/* ── KPI Cards — adaptées selon le rôle ───────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Visible par tous */}
                <StatCard
                    title="CA Aujourd'hui"
                    value={`${revenue.toLocaleString()} F`}
                    subtitle="Ventes de la journée"
                    icon={DollarSign}
                    color="border-l-emerald-500"
                />

                {/* Visible ADMIN + PHARMACIST uniquement */}
                {(isAdmin || isPharmacist) && (
                    <StatCard
                        title="Valeur du Stock"
                        value={`${stockValue.toLocaleString()} F`}
                        subtitle="PAMP — Prix moyen"
                        icon={Activity}
                        color="border-l-blue-500"
                    />
                )}

                {/* Ruptures — visible par tous, mais seulement utile à ADMIN/PHARMACIST */}
                <StatCard
                    title="Ruptures"
                    value={`${outOfStock}`}
                    subtitle={outOfStock > 0 ? "Action requise !" : "Tout est OK ✓"}
                    icon={AlertTriangle}
                    color={outOfStock > 0 ? "border-l-rose-500" : "border-l-emerald-400"}
                />

                {/* Catalogue — ADMIN + PHARMACIST */}
                {(isAdmin || isPharmacist) && (
                    <StatCard
                        title="Références"
                        value={`${stockCount}`}
                        subtitle="Produits au catalogue"
                        icon={PackageSearch}
                        color="border-l-violet-500"
                    />
                )}

                {/* Card POS rapide pour CASHIER */}
                {isCashier && (
                    <Card className="border-l-4 border-l-primary bg-primary/5 col-span-1">
                        <CardContent className="p-4 sm:p-5">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Accès Rapide</p>
                            <p className="text-base font-black mt-1 text-slate-900">Point de Vente</p>
                            <p className="text-[11px] text-muted-foreground mt-1">Encaisser les ventes</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── Contenu conditionnel par rôle ──────────────────────────── */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">

                {/* Graphique tendances — ADMIN seulement */}
                {(isAdmin || isPharmacist) && (
                    <Card className="col-span-1 lg:col-span-4">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Tendances Ventes vs Achats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[180px] sm:h-[220px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 gap-2">
                                <TrendingUp className="h-10 w-10 text-slate-200" />
                                <span className="text-sm text-muted-foreground text-center px-4">
                                    Graphique disponible après 7 jours de données
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Alertes Péremption — ADMIN + PHARMACIST */}
                {(isAdmin || isPharmacist) && (
                    <Card className={`col-span-1 lg:col-span-3 ${expires.length > 0 ? 'border-orange-200 bg-orange-50/30' : ''}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-orange-700">
                                <AlertTriangle className="h-5 w-5" />
                                Alertes Péremption
                            </CardTitle>
                            <CardDescription>Lots expirant dans les 30 jours (méthode FEFO)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {expires.length === 0 ? (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                    <Activity className="h-4 w-4 shrink-0" />
                                    <span>Aucun produit critique. Bonne gestion !</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {expires.slice(0, 5).map((batch, i) => {
                                        const daysLeft = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24))
                                        return (
                                            <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-orange-100 gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{batch.productName}</p>
                                                    <p className="text-[11px] text-slate-400">Lot {batch.batchNumber}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className={`text-xs font-black px-2 py-1 rounded-full
                                                        ${daysLeft <= 7 ? 'bg-rose-100 text-rose-700' :
                                                            daysLeft <= 15 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-amber-100 text-amber-700'}`}>
                                                        J-{daysLeft}
                                                    </span>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">Qté: {batch.quantity}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {expires.length > 5 && (
                                        <p className="text-xs text-center text-slate-400 pt-1">+ {expires.length - 5} autre(s) lot(s)</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Vue caissier — recap du jour */}
                {isCashier && (
                    <Card className="col-span-1 lg:col-span-7">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-5 w-5 text-primary" /> Mon Activité du Jour
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                                    <p className="text-2xl font-black text-emerald-700">{revenue.toLocaleString()}</p>
                                    <p className="text-xs text-emerald-600 mt-1 font-medium">FCFA encaissés</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                                    <p className="text-2xl font-black text-blue-700">—</p>
                                    <p className="text-xs text-blue-600 mt-1 font-medium">Transactions du jour</p>
                                </div>
                                <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                                    <Link href="/pos">
                                        <Button className="w-full">
                                            <ShoppingCart className="h-4 w-4 mr-2" /> Encaisser
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Lien inventaire pour ADMIN et PHARMACIST */}
            {isAdmin && (
                <Card className="bg-slate-900 text-white border-none">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <p className="font-bold text-base flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Administration système
                            </p>
                            <p className="text-sm text-slate-400 mt-0.5">Gérez les utilisateurs, stocks, transactions et rapports</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Link href="/users" className="flex-1 sm:flex-none">
                                <Button variant="outline" className="w-full bg-transparent border-slate-700 text-white hover:bg-slate-800">
                                    Utilisateurs
                                </Button>
                            </Link>
                            <Link href="/reports" className="flex-1 sm:flex-none">
                                <Button variant="outline" className="w-full bg-transparent border-slate-700 text-white hover:bg-slate-800">
                                    Rapports
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
