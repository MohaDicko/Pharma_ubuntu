"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    DollarSign, Activity, AlertTriangle, PackageSearch, Loader2,
    TrendingUp, ShoppingCart, Users, Clock, PieChart as PieIcon
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer as ResponsiveContainerType
} from 'recharts'

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

interface ReportData {
    trends: Array<{ name: string, ventes: number }>
    payments: Array<{ name: string, value: number }>
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'];

function StatCard({ title, value, subtitle, icon: Icon, color }: {
    title: string, value: string, subtitle: string,
    icon: React.ElementType, color: string
}) {
    return (
        <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${color} group cursor-default`}>
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">{title}</p>
                        <p className="text-xl sm:text-2xl font-black mt-1 text-slate-900 truncate group-hover:text-primary transition-colors">{value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate font-medium">{subtitle}</p>
                    </div>
                    <div className={`p-2.5 rounded-2xl shrink-0 group-hover:scale-110 transition-transform ${color.replace('border-l-', 'bg-').replace('-500', '-100').replace('-600', '-100')}`}>
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
    const [reports, setReports] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, reportsRes] = await Promise.all([
                    fetch('/api/dashboard/stats'),
                    fetch('/api/dashboard/reports')
                ])

                if (statsRes.ok) setStats(await statsRes.json())
                if (reportsRes.ok) setReports(await reportsRes.json())
            } catch (e) {
                console.error("Dashboard data error:", e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const isAdmin = user?.role === 'ADMIN'
    const isPharmacist = user?.role === 'PHARMACIST'
    const isCashier = user?.role === 'CASHIER'

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" strokeWidth={1.5} />
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                </div>
                <span className="text-base font-bold text-slate-500 animate-pulse">Synchronisation des données...</span>
            </div>
        )
    }

    const revenue = stats?.revenueToday || 0
    const stockValue = stats?.stockValue || 0
    const outOfStock = stats?.outOfStockCount || 0
    const stockCount = stats?.stockCount || 0
    const expires = stats?.expiringBatches || []

    return (
        <div className="space-y-6 pb-10">
            {/* En-tête Dynamique */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 to-primary bg-clip-text">
                        Bonjour, {user?.name.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {(isCashier || isPharmacist || isAdmin) && (
                    <Link href="/pos">
                        <Button className="w-full sm:w-auto h-12 px-6 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-2xl gap-2 font-bold text-base">
                            <ShoppingCart className="h-5 w-5" />
                            Vendre Maintenant
                        </Button>
                    </Link>
                )}
            </div>

            {/* ── KPI Cards ───────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Revenus"
                    value={`${revenue.toLocaleString()} F`}
                    subtitle="CA encaissé aujourd'hui"
                    icon={DollarSign}
                    color="border-l-emerald-500"
                />
                {(isAdmin || isPharmacist) && (
                    <StatCard
                        title="Valeur Stock"
                        value={`${stockValue.toLocaleString()} F`}
                        subtitle="Évaluation totale PAMP"
                        icon={Activity}
                        color="border-l-blue-500"
                    />
                )}
                <StatCard
                    title="Alertes"
                    value={`${outOfStock}`}
                    subtitle={outOfStock > 0 ? "Ruptures à traiter" : "Inventaire optimal"}
                    icon={AlertTriangle}
                    color={outOfStock > 0 ? "border-l-rose-500" : "border-l-emerald-400"}
                />
                {(isAdmin || isPharmacist) && (
                    <StatCard
                        title="Catalogue"
                        value={`${stockCount}`}
                        subtitle="Références actives"
                        icon={PackageSearch}
                        color="border-l-indigo-500"
                    />
                )}
            </div>

            {/* ── Graphiques & Reports ──────────────────────────── */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">

                {/* Graphique Tendances */}
                {(isAdmin || isPharmacist) && (
                    <Card className="col-span-1 lg:col-span-4 rounded-3xl overflow-hidden border-none shadow-md">
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Performance (7 jours)
                                    </CardTitle>
                                    <CardDescription>Évolution des ventes quotidiennes</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-bold">
                                    En hausse 📈
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[280px] w-full">
                                {reports?.trends && reports.trends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reports.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                                            />
                                            <Bar
                                                dataKey="ventes"
                                                fill="#3b82f6"
                                                radius={[6, 6, 0, 0]}
                                                barSize={32}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                        <TrendingUp className="h-10 w-10 opacity-20" />
                                        <p className="text-xs font-medium">Pas assez de données pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Répartition Paiements ou Alertes */}
                <div className="col-span-1 lg:col-span-3 space-y-6">
                    {/* Répartition Modes de Payement */}
                    <Card className="rounded-3xl border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <PieIcon className="h-5 w-5 text-indigo-500" />
                                Modes de Règlement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[180px]">
                                {reports?.payments && reports.payments.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={reports.payments}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {reports.payments.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 border-2 border-dashed rounded-2xl">
                                        <DollarSign className="h-8 w-8 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider">Aucune transaction today</p>
                                    </div>
                                )}
                            </div>
                            {/* Legend simple */}
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {reports?.payments.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-900 truncate">{p.name}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">{p.value.toLocaleString()} F</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alertes Péremption */}
                    {(isAdmin || isPharmacist) && expires.length > 0 && (
                        <Card className="rounded-3xl border-none shadow-md bg-rose-50 border border-rose-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-700">
                                    <AlertTriangle className="h-4 w-4" />
                                    Priorité FEFO (Péremptions)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {expires.slice(0, 3).map((batch, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm gap-2">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">{batch.productName}</p>
                                            <p className="text-[10px] text-slate-400">Lot {batch.batchNumber}</p>
                                        </div>
                                        <Badge variant="destructive" className="font-black text-[10px] px-2 py-0.5 rounded-lg">
                                            J-{Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24))}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Section Rôles & Admin */}
            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-slate-900 text-white border-none rounded-3xl p-6 relative overflow-hidden group">
                        <Users className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-125 transition-transform duration-500" />
                        <h3 className="text-lg font-black mb-1">Équipe & Accès</h3>
                        <p className="text-xs text-slate-400 mb-6">Gérez les permissions et rôles.</p>
                        <Link href="/users">
                            <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 font-bold rounded-xl">
                                Voir les Utilisateurs
                            </Button>
                        </Link>
                    </Card>

                    <Card className="bg-primary text-white border-none rounded-3xl p-6 relative overflow-hidden group">
                        <Activity className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 group-hover:scale-125 transition-transform duration-500" />
                        <h3 className="text-lg font-black mb-1">Audit & Sécurité</h3>
                        <p className="text-xs text-white/60 mb-6">Tracez chaque action système.</p>
                        <Link href="/audit">
                            <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary font-bold rounded-xl">
                                Consulter l&apos;Audit
                            </Button>
                        </Link>
                    </Card>

                    <Card className="bg-slate-100 border-none rounded-3xl p-6 relative overflow-hidden group md:col-span-2 lg:col-span-1">
                        <DollarSign className="absolute -right-4 -bottom-4 h-32 w-32 text-slate-200 group-hover:scale-125 transition-transform duration-500" />
                        <h3 className="text-lg font-black text-slate-800 mb-1">Rapports Complets</h3>
                        <p className="text-xs text-slate-500 mb-6">Historique financier détaillé.</p>
                        <Link href="/transactions">
                            <Button className="w-full font-bold rounded-xl">
                                Archivage Transactions
                            </Button>
                        </Link>
                    </Card>
                </div>
            )}
        </div>
    )
}
