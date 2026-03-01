"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
    TrendingUp, TrendingDown, DollarSign, FileText, Download,
    Loader2, Calendar, ChevronLeft, ChevronRight, Package,
    BarChart3, ArrowUpRight, Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageShell } from "@/components/PageShell"
import { useCsvExport } from "@/hooks/useCsvExport"
import { toast } from "@/components/ui/toast"
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts'

interface FinancialReport {
    period: { month: string; start: string; end: string }
    summary: {
        totalRevenue: number
        totalCOGS: number
        grossMargin: number
        grossMarginPct: number
        totalPurchases: number
        netCash: number
        salesCount: number
        revenueGrowth: number | null
        prevRevenue: number
    }
    byPayment: Array<{ method: string; amount: number }>
    topProducts: Array<{ name: string; qty: number; revenue: number }>
    dailyTrend: Array<{ day: string; amount: number }>
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ef4444']

function KpiCard({ title, value, subtitle, icon: Icon, colorClass, trend }: {
    title: string; value: string; subtitle: string
    icon: React.ElementType; colorClass: string; trend?: number | null
}) {
    return (
        <Card className={`border-l-4 ${colorClass} shadow-sm`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
                        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className={`p-2 rounded-xl ${colorClass.replace('border-l-', 'bg-').replace('-500', '-50').replace('-600', '-50')}`}>
                            <Icon className={`h-5 w-5 ${colorClass.replace('border-l-', 'text-')}`} />
                        </div>
                        {trend !== undefined && trend !== null && (
                            <span className={`text-xs font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function FinancialReportPage() {
    const { user } = useAuth()
    const { downloadCsv } = useCsvExport()

    // Mois courant par défaut
    const now = new Date()
    const [monthStr, setMonthStr] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    const [report, setReport] = useState<FinancialReport | null>(null)
    const [loading, setLoading] = useState(true)

    async function fetchReport(month: string) {
        setLoading(true)
        try {
            const res = await fetch(`/api/reports/financial?month=${month}`)
            if (res.ok) {
                setReport(await res.json())
            } else if (res.status === 403) {
                toast("Accès réservé aux administrateurs et pharmaciens", 'error')
            } else {
                toast("Erreur chargement rapport", 'error')
            }
        } catch { toast("Erreur réseau", 'error') }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchReport(monthStr) }, [monthStr])

    const prevMonth = () => {
        const d = new Date(`${monthStr}-01`)
        d.setMonth(d.getMonth() - 1)
        setMonthStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const nextMonth = () => {
        const d = new Date(`${monthStr}-01`)
        d.setMonth(d.getMonth() + 1)
        const now = new Date()
        if (d <= now) setMonthStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const isCurrentMonth = monthStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const handleCsvExport = () => {
        if (!report) return
        downloadCsv([
            { Indicateur: "Chiffre d'Affaires", Valeur: report.summary.totalRevenue, Unite: "FCFA" },
            { Indicateur: "Coût des ventes (COGS)", Valeur: report.summary.totalCOGS, Unite: "FCFA" },
            { Indicateur: "Marge Brute", Valeur: report.summary.grossMargin, Unite: "FCFA" },
            { Indicateur: "Taux de Marge", Valeur: report.summary.grossMarginPct, Unite: "%" },
            { Indicateur: "Total Achats/Approvisionnements", Valeur: report.summary.totalPurchases, Unite: "FCFA" },
            { Indicateur: "Trésorerie Nette", Valeur: report.summary.netCash, Unite: "FCFA" },
            { Indicateur: "Nombre de Ventes", Valeur: report.summary.salesCount, Unite: "transactions" },
            ...report.topProducts.map(p => ({ Indicateur: `[TOP] ${p.name}`, Valeur: p.revenue, Unite: "FCFA" })),
        ], `rapport-financier-${monthStr}.csv`)
        toast("Export CSV lancé !", 'success')
    }

    return (
        <PageShell>
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Rapport Financier
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Analyse des performances — {report?.period.month ?? '...'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Navigation mois */}
                    <div className="flex items-center gap-1 border rounded-xl px-2 bg-white shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1.5 px-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm font-bold capitalize min-w-[120px] text-center">
                                {report?.period.month ?? monthStr}
                            </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth} disabled={isCurrentMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" className="h-10 gap-2" onClick={handleCsvExport} disabled={!report}>
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-slate-500 animate-pulse">Calcul du rapport financier...</p>
                </div>
            ) : !report ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
                    <Info className="h-10 w-10" />
                    <p className="text-sm font-medium">Impossible de charger le rapport.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ── KPI Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="Chiffre d'Affaires"
                            value={`${report.summary.totalRevenue.toLocaleString('fr-FR')} F`}
                            subtitle={`${report.summary.salesCount} ventes réalisées`}
                            icon={DollarSign} colorClass="border-l-emerald-500"
                            trend={report.summary.revenueGrowth}
                        />
                        <KpiCard
                            title="Marge Brute"
                            value={`${report.summary.grossMargin.toLocaleString('fr-FR')} F`}
                            subtitle={`Taux : ${report.summary.grossMarginPct}%`}
                            icon={TrendingUp} colorClass="border-l-blue-500"
                        />
                        <KpiCard
                            title="Approvisionnements"
                            value={`${report.summary.totalPurchases.toLocaleString('fr-FR')} F`}
                            subtitle="Achats de stock"
                            icon={TrendingDown} colorClass="border-l-rose-500"
                        />
                        <KpiCard
                            title="Trésorerie Nette"
                            value={`${report.summary.netCash.toLocaleString('fr-FR')} F`}
                            subtitle="CA − Achats"
                            icon={BarChart3}
                            colorClass={report.summary.netCash >= 0 ? 'border-l-indigo-500' : 'border-l-orange-500'}
                        />
                    </div>

                    {/* ── Comparaison Mois Précédent ── */}
                    {report.summary.revenueGrowth !== null && (
                        <Card className={`shadow-sm border-none ${report.summary.revenueGrowth >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                {report.summary.revenueGrowth >= 0
                                    ? <TrendingUp className="h-8 w-8 text-emerald-500 shrink-0" />
                                    : <TrendingDown className="h-8 w-8 text-rose-500 shrink-0" />
                                }
                                <div>
                                    <p className={`text-sm font-bold ${report.summary.revenueGrowth >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                        {report.summary.revenueGrowth >= 0 ? '📈 Croissance positive' : '📉 Baisse vs mois précédent'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Mois précédent : {report.summary.prevRevenue.toLocaleString('fr-FR')} FCFA
                                        &nbsp;→&nbsp;
                                        <strong>{report.summary.totalRevenue.toLocaleString('fr-FR')} FCFA</strong>
                                        &nbsp;({report.summary.revenueGrowth >= 0 ? '+' : ''}{report.summary.revenueGrowth}%)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Graphiques ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Trend journalier */}
                        <Card className="lg:col-span-2 border-none shadow-md">
                            <CardHeader className="bg-slate-50/50 border-b pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Évolution des Ventes (CA journalier)
                                </CardTitle>
                                <CardDescription className="text-xs">Chiffre d&apos;affaires par jour du mois</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 pb-2">
                                {report.dailyTrend.length > 0 ? (
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={report.dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                                    tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)', fontSize: 12 }}
                                                    formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, 'CA']}
                                                />
                                                <Bar dataKey="amount" fill="#3b82f6" radius={[5, 5, 0, 0]} barSize={18} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-52 text-slate-300 flex-col gap-2">
                                        <BarChart3 className="h-10 w-10 opacity-30" />
                                        <p className="text-xs font-medium">Aucune vente ce mois-ci</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Répartition paiements */}
                        <Card className="border-none shadow-md">
                            <CardHeader className="bg-slate-50/50 border-b pb-3">
                                <CardTitle className="text-sm font-bold">Modes de Règlement</CardTitle>
                                <CardDescription className="text-xs">Répartition par méthode de paiement</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {report.byPayment.length > 0 ? (
                                    <>
                                        <div className="h-[140px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={report.byPayment} dataKey="amount" nameKey="method"
                                                        cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4}>
                                                        {report.byPayment.map((_, i) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(v: number) => [`${v.toLocaleString('fr-FR')} F`, '']}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 11 }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-1.5 mt-2">
                                            {report.byPayment.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                        <span className="text-slate-600 font-medium">{p.method}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900">{p.amount.toLocaleString('fr-FR')} F</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-slate-300 flex-col gap-2">
                                        <DollarSign className="h-8 w-8 opacity-30" />
                                        <p className="text-xs">Aucune donnée</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Top Produits ── */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="bg-slate-50/50 border-b pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Package className="h-4 w-4 text-amber-500" />
                                Top 10 Produits — {report.period.month}
                            </CardTitle>
                            <CardDescription className="text-xs">Classement par chiffre d&apos;affaires généré</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            {report.topProducts.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">Aucune vente ce mois-ci.</p>
                            ) : (
                                <div className="space-y-3">
                                    {report.topProducts.map((p, i) => {
                                        const maxRevenue = report.topProducts[0]?.revenue ?? 1
                                        const pct = Math.round((p.revenue / maxRevenue) * 100)
                                        return (
                                            <div key={i} className="flex items-center gap-3 group">
                                                <span className={`text-xs font-black w-5 text-right shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                                                    #{i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-semibold text-slate-800 truncate">{p.name}</span>
                                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                                            <Badge variant="outline" className="text-xs font-mono">{p.qty} vendus</Badge>
                                                            <span className="text-sm font-black text-emerald-700">{p.revenue.toLocaleString('fr-FR')} F</span>
                                                        </div>
                                                    </div>
                                                    <Progress value={pct} className="h-1.5"
                                                        style={{ '--progress-foreground': i === 0 ? '#f59e0b' : '#3b82f6' } as React.CSSProperties} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Résumé P&L ── */}
                    <Card className="border-none shadow-md bg-slate-900 text-white">
                        <CardHeader className="pb-3 border-b border-white/10">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-400" />
                                Compte de Résultat Simplifié — {report.period.month}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">(+) Chiffre d&apos;Affaires</span>
                                    <span className="text-emerald-400 font-bold">+{report.summary.totalRevenue.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">(-) Coût des Ventes (COGS)</span>
                                    <span className="text-rose-400 font-bold">-{report.summary.totalCOGS.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="border-t border-white/10 pt-3 flex justify-between">
                                    <span className="text-white font-bold">(=) MARGE BRUTE</span>
                                    <span className={`font-black ${report.summary.grossMargin >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {report.summary.grossMargin >= 0 ? '+' : ''}{report.summary.grossMargin.toLocaleString('fr-FR')} FCFA
                                        <span className="text-xs ml-2 opacity-60">({report.summary.grossMarginPct}%)</span>
                                    </span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-slate-400">(-) Approvisionnements</span>
                                    <span className="text-rose-400 font-bold">-{report.summary.totalPurchases.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="border-t border-white/10 pt-3 flex justify-between">
                                    <span className="text-white font-bold">(=) TRÉSORERIE NETTE</span>
                                    <span className={`font-black text-base ${report.summary.netCash >= 0 ? 'text-emerald-300' : 'text-orange-300'}`}>
                                        {report.summary.netCash >= 0 ? '+' : ''}{report.summary.netCash.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageShell>
    )
}
