"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
    Download,
    FileText,
    AlertTriangle,
    TrendingUp,
    Activity,
    Package,
    Clock,
    ChevronRight,
    Loader2
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateInventoryPDF } from "@/lib/pdf-reports"
import { PageShell } from "@/components/PageShell"

interface InventoryReport {
    summary: {
        totalStockValue: number;
        itemCount: number;
        lowStockCount: number;
        expiringCount: number;
    };
    lowStockProducts: Array<{ name: string; currentQty: number; minThreshold: number }>;
    expiringSoon: Array<{ product: string; qty: number; expiryDate: string; status: string }>;
}

export default function ReportsPage() {
    const { user } = useAuth()
    const [report, setReport] = useState<InventoryReport | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch('/api/reports/inventory')
                if (res.ok) {
                    const data = await res.json()
                    setReport(data)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Génération des analyses en cours...</p>
        </div>
    )

    if (!report) return <div>Accès refusé ou erreur.</div>

    return (
        <PageShell>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Analyses &amp; Rapports
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Vue d&apos;ensemble de la santé financière et logistique.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button
                        onClick={async () => report && await generateInventoryPDF(report)}
                        className="gap-2 shadow-lg hover:translate-y-[-2px] transition-transform"
                    >
                        <FileText className="h-4 w-4" /> Rapport PDF Complet
                    </Button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border-l-4 border-l-blue-600 shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Valeur Totale Stock</CardDescription>
                        <CardTitle className="text-2xl font-black">{report.summary.totalStockValue.toLocaleString()} F</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3 text-green-500" /> +2.5% vs mois dernier
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Alertes Rupture</CardDescription>
                        <CardTitle className="text-2xl font-black text-amber-600">{report.summary.lowStockCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={(report.summary.lowStockCount / report.summary.itemCount) * 100} className="h-1" />
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-rose-600 shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Lots Critiques</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-600">{report.summary.expiringCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] text-rose-500 font-medium italic">Action requise immédiatement</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-600 shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Taux de Rotation</CardDescription>
                        <CardTitle className="text-2xl font-black underline underline-offset-4 decoration-indigo-200">68%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[10px] text-muted-foreground">Efficacité logistique optimale</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Low Stock Detailed */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-amber-700">
                                <Package className="h-5 w-5" /> Ruptures à Prévoir
                            </CardTitle>
                            <CardDescription>Produits sous le seuil de sécurité</CardDescription>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-amber-200" />
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {report.lowStockProducts.map((p, idx) => (
                                    <div key={idx} className="flex flex-col space-y-2 group">
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-transparent group-hover:border-amber-200 transition-colors">
                                            <span className="font-bold text-sm">{p.name}</span>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="font-mono">{p.currentQty} / {p.minThreshold}</Badge>
                                                <Button size="icon" variant="ghost" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Expiry Details */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-rose-700">
                                <Clock className="h-5 w-5" /> Suivi Péremption
                            </CardTitle>
                            <CardDescription>Lots expirant dans les 6 prochains mois</CardDescription>
                        </div>
                        <Activity className="h-8 w-8 text-rose-200" />
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {report.expiringSoon.map((b, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border-l-4 border-l-rose-500 bg-rose-50/30">
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{b.product}</p>
                                            <p className="text-[10px] text-muted-foreground">Expire le : {new Date(b.expiryDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-xs">{b.qty} boîtes</p>
                                            <Badge variant={b.status === 'PÉRIMÉ' ? 'destructive' : 'default'} className="text-[9px] h-4">
                                                {b.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    )
}
