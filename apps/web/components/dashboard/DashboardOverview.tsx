"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    DollarSign,
    Activity,
    AlertTriangle,
    PackageSearch,
    Loader2
} from "lucide-react"

// Interface TypeScript pour l'API
interface DashboardStats {
    revenueToday: number
    stockValue: number
    stockCount: number // Nombre total produits
    outOfStockCount: number
    expiringBatches: Array<{
        productName: string
        batchNumber: string
        expiryDate: string
        quantity: number
    }>
}

export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        async function fetchStats() {
            setLoading(true)
            try {
                const res = await fetch('/api/dashboard/stats')
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (error) {
                console.error("Erreur Dashboard Stats:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (!isMounted || loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center space-x-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xl font-medium text-muted-foreground">Chargement du Tableau de Bord...</span>
            </div>
        )
    }

    // Données par défaut si l'API échoue ou renvoie null
    const displayRevenue = stats?.revenueToday || 0
    const displayStockValue = stats?.stockValue || 0
    const displayOutOfStock = stats?.outOfStockCount || 0
    const expiringItems = stats?.expiringBatches || []

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Tableau de Bord Exécutif</h2>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires (Jour)</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {displayRevenue.toLocaleString()} FCFA
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +0% par rapport à hier (Démarrage)
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valeur du Stock (PAMP)</CardTitle>
                        <Activity className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {displayStockValue.toLocaleString()} FCFA
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Inventaire tournant en cours
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-red-200 bg-red-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Ruptures de Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{displayOutOfStock} Produits</div>
                        <p className="text-xs text-red-600/80">
                            Action requise impérative
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Catalogue Produits</CardTitle>
                        <PackageSearch className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {stats?.stockCount || 0} Références
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Base de données catalogue
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                {/* Sale Chart Placeholder */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Tendances Ventes vs Achats</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center bg-zinc-50 rounded-md border border-dashed">
                            <span className="text-muted-foreground text-sm">Graphique sera disponible après 7 jours de données</span>
                            {/* Ici on mettra Recharts plus tard */}
                        </div>
                    </CardContent>
                </Card>

                {/* Alertes Urgent */}
                <Card className="lg:col-span-3 border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Alertes Péremption (Urgent)
                        </CardTitle>
                        <CardDescription>
                            Produits expirant dans les 30 jours. Priorité FEFO.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expiringItems.length === 0 ? (
                                <div className="text-sm text-green-600 flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Aucun produit critique.
                                </div>
                            ) : (
                                expiringItems.map((batch, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none text-red-600">
                                                Expiration Proche (J-{Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24))})
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Lot {batch.batchNumber} - {batch.productName}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-red-600">
                                            Qté: {batch.quantity}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventaire Tournant Rapide */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PackageSearch className="h-5 w-5" />
                        Inventaire Tournant du Jour
                    </CardTitle>
                    <CardDescription>
                        5 produits sélectionnés aléatoirement à compter ce matin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground italic">
                        Fonctionnalité à venir dans la v0.2
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
