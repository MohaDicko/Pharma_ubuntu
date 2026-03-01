"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Search, FileDown, ArrowUpRight, ArrowDownLeft, RefreshCw,
    Loader2, FileText, TrendingUp, TrendingDown, DollarSign,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, X
} from "lucide-react"
import { useCsvExport } from "@/hooks/useCsvExport"
import { generateTransactionsPDF } from "@/lib/pdf-reports"
import { toast } from "@/components/ui/toast"

interface Transaction {
    id: string
    date: string
    amount: number
    type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT'
    status: string
    paymentMethod: string
    products: string
    insuranceName: string | null
    insurancePart: number
    patientPart: number
}

interface PaginationMeta {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

const TYPE_OPTIONS = [
    { value: '', label: 'Tous les types' },
    { value: 'SALE', label: 'Ventes' },
    { value: 'PURCHASE', label: 'Achats' },
]

const METHOD_OPTIONS = [
    { value: '', label: 'Toutes les méthodes' },
    { value: 'CASH', label: 'Espèces' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
    { value: 'CARD', label: 'Carte Bancaire' },
    { value: 'INSURANCE', label: 'Assurance' },
    { value: 'INVOICE', label: 'Facture' },
]

export default function TransactionsList() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 25, totalPages: 1, hasNext: false, hasPrev: false })
    const [loading, setLoading] = useState(true)
    const [isPdfLoading, setIsPdfLoading] = useState(false)
    const { downloadCsv } = useCsvExport()

    // Filtres
    const [filters, setFilters] = useState({ type: '', method: '', from: '', to: '' })
    const [showFilters, setShowFilters] = useState(false)
    const [page, setPage] = useState(1)
    const LIMIT = 25

    const fetchTransactions = useCallback(async (p = page) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(p),
                limit: String(LIMIT),
                ...(filters.type ? { type: filters.type } : {}),
                ...(filters.method ? { method: filters.method } : {}),
                ...(filters.from ? { from: filters.from } : {}),
                ...(filters.to ? { to: filters.to } : {}),
            })
            const res = await fetch(`/api/transactions?${params}`)
            if (res.ok) {
                const json = await res.json()
                setTransactions(json.data ?? [])
                setMeta(json.meta)
            } else if (res.status === 401) {
                toast("Session expirée, veuillez vous reconnecter.", 'error')
            } else {
                toast("Erreur chargement des transactions", 'error')
            }
        } catch {
            toast("Erreur réseau", 'error')
        } finally {
            setLoading(false)
        }
    }, [page, filters])

    useEffect(() => { fetchTransactions(page) }, [page, filters])

    const applyFilters = () => { setPage(1); fetchTransactions(1) }
    const clearFilters = () => {
        setFilters({ type: '', method: '', from: '', to: '' })
        setPage(1)
    }
    const hasActiveFilters = Object.values(filters).some(Boolean)

    // ── Export CSV ──────────────────────────────────────────────────────────
    const handleExportCsv = () => {
        if (transactions.length === 0) { toast("Aucune transaction à exporter", 'warning'); return }
        const data = transactions.map(t => ({
            ID: t.id,
            Date: new Date(t.date).toLocaleString('fr-FR'),
            Type: t.type === 'SALE' ? 'Vente' : t.type === 'PURCHASE' ? 'Achat' : t.type,
            Montant_FCFA: t.amount,
            Methode_Paiement: t.paymentMethod,
            Produits: t.products,
            Statut: t.status,
            Assurance: t.insuranceName ?? '',
            Part_Assurance: t.insurancePart,
            Part_Patient: t.patientPart,
        }))
        downloadCsv(data, `transactions-p${page}-${new Date().toISOString().split('T')[0]}.csv`)
        toast("Export CSV de la page en cours...", 'success')
    }

    // ── Export PDF ──────────────────────────────────────────────────────────
    const handleExportPdf = async () => {
        if (transactions.length === 0) { toast("Aucune transaction à imprimer", 'warning'); return }
        setIsPdfLoading(true)
        try {
            const dateRange = filters.from && filters.to
                ? `du ${new Date(filters.from).toLocaleDateString('fr-FR')} au ${new Date(filters.to).toLocaleDateString('fr-FR')}`
                : `page ${page}/${meta.totalPages}`
            await generateTransactionsPDF({ transactions, dateRange })
            toast("PDF généré !", 'success')
        } catch (e) {
            console.error("PDF Error:", e)
            toast("Erreur PDF", 'error')
        } finally {
            setIsPdfLoading(false)
        }
    }

    // KPIs visibles sur la page courante
    const totalVentes = transactions.filter(t => t.type === 'SALE').reduce((s, t) => s + t.amount, 0)
    const totalAchats = transactions.filter(t => t.type === 'PURCHASE').reduce((s, t) => s + t.amount, 0)
    const bilan = totalVentes - totalAchats

    return (
        <div className="space-y-5">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Transactions Financières</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {meta.total} transaction(s) au total
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => fetchTransactions(page)} disabled={loading} size="sm" className="h-9">
                        <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualiser
                    </Button>
                    <Button variant="outline" onClick={handleExportCsv} disabled={loading || transactions.length === 0} size="sm" className="h-9">
                        <FileDown className="mr-2 h-3.5 w-3.5" /> Export CSV
                    </Button>
                    <Button onClick={handleExportPdf} disabled={loading || isPdfLoading || transactions.length === 0} size="sm" className="h-9 shadow-md">
                        {isPdfLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}
                        Imprimer PDF
                    </Button>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="border-none shadow-sm bg-emerald-50">
                    <CardContent className="p-3 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 rounded-lg"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
                        <div>
                            <p className="text-[10px] text-emerald-700 font-semibold uppercase">Ventes (page)</p>
                            <p className="text-lg font-black text-emerald-800">+{totalVentes.toLocaleString('fr-FR')} F</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-rose-50">
                    <CardContent className="p-3 flex items-center gap-2">
                        <div className="p-1.5 bg-rose-100 rounded-lg"><TrendingDown className="h-4 w-4 text-rose-600" /></div>
                        <div>
                            <p className="text-[10px] text-rose-700 font-semibold uppercase">Achats (page)</p>
                            <p className="text-lg font-black text-rose-800">-{totalAchats.toLocaleString('fr-FR')} F</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`border-none shadow-sm ${bilan >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <CardContent className="p-3 flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${bilan >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            <DollarSign className={`h-4 w-4 ${bilan >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-semibold uppercase ${bilan >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Bilan net</p>
                            <p className={`text-lg font-black ${bilan >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                                {bilan >= 0 ? '+' : ''}{bilan.toLocaleString('fr-FR')} F
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Filtres ─────────────────────────────────────────── */}
            <Card className="border-none shadow-sm">
                <CardContent className="p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            size="sm" className="h-8 gap-2"
                            onClick={() => setShowFilters(v => !v)}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Filtres {hasActiveFilters && <span className="ml-1 bg-white text-primary rounded-full h-4 w-4 text-[10px] font-black flex items-center justify-center">!</span>}
                        </Button>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" className="h-8 text-rose-500 hover:text-rose-700" onClick={clearFilters}>
                                <X className="h-3.5 w-3.5 mr-1" /> Effacer filtres
                            </Button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-slate-500 mb-1 block">Type</Label>
                                <select
                                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={filters.type}
                                    onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                                >
                                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-500 mb-1 block">Méthode de paiement</Label>
                                <select
                                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={filters.method}
                                    onChange={e => setFilters(f => ({ ...f, method: e.target.value }))}
                                >
                                    {METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-500 mb-1 block">Date début</Label>
                                <Input type="date" className="h-9 text-sm" value={filters.from}
                                    onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-500 mb-1 block">Date fin</Label>
                                <Input type="date" className="h-9 text-sm" value={filters.to}
                                    onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
                            </div>
                            <div className="col-span-full">
                                <Button size="sm" className="h-8" onClick={applyFilters}>
                                    <Search className="h-3.5 w-3.5 mr-2" /> Appliquer les filtres
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Table ───────────────────────────────────────────── */}
            <Card className="border-none shadow-md">
                <CardHeader className="bg-slate-50/50 border-b py-3 px-6 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold">Journal des Opérations</CardTitle>
                        <CardDescription className="text-xs">
                            {loading ? 'Chargement...' : `${transactions.length} lignes — page ${meta.page}/${meta.totalPages}`}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="pl-6 w-28">Type</TableHead>
                                    <TableHead>Date &amp; Heure</TableHead>
                                    <TableHead>Produits / Motif</TableHead>
                                    <TableHead>Méthode</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right pr-6">Montant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span className="text-xs font-medium animate-pulse">Chargement...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <DollarSign className="h-10 w-10 text-slate-200" />
                                                <p className="text-sm font-medium text-slate-500">Aucune transaction trouvée.</p>
                                                {hasActiveFilters && (
                                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
                                                        Effacer les filtres
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={tx.id} className="hover:bg-slate-50/50 group">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-2">
                                                    {tx.type === 'SALE' ? (
                                                        <div className="p-1 rounded-md bg-emerald-100">
                                                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1 rounded-md bg-rose-100">
                                                            <ArrowDownLeft className="h-3.5 w-3.5 text-rose-600" />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-sm">
                                                        {tx.type === 'SALE' ? 'Vente' : tx.type === 'PURCHASE' ? 'Achat' : tx.type}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500 tabular-nums">
                                                {new Date(tx.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                            </TableCell>
                                            <TableCell className="max-w-[240px]">
                                                <div className="truncate text-sm" title={tx.products}>{tx.products || '—'}</div>
                                                {tx.insuranceName && (
                                                    <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                                                        🛡️ {tx.insuranceName} ({tx.insurancePart.toLocaleString('fr-FR')} F)
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-medium">{tx.paymentMethod}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`text-xs ${tx.status === 'COMPLETED'
                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none'
                                                        : tx.status === 'CANCELLED'
                                                            ? 'bg-rose-100 text-rose-800 border-none'
                                                            : 'bg-amber-100 text-amber-800 border-none'
                                                        }`}
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right pr-6 font-black text-base tabular-nums ${tx.type === 'SALE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {tx.type === 'SALE' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR')} F
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Pagination ─────────────────────────────── */}
                    {meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50/50">
                            <p className="text-xs text-slate-500">
                                <span className="font-bold">{((meta.page - 1) * meta.limit) + 1}</span>–<span className="font-bold">{Math.min(meta.page * meta.limit, meta.total)}</span> sur <span className="font-bold">{meta.total}</span>
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                    disabled={!meta.hasPrev} onClick={() => setPage(1)}>
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                    disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {/* Pages autour de la page courante */}
                                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                                    const start = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4))
                                    const p = start + i
                                    return (
                                        <Button
                                            key={p} variant={p === meta.page ? "default" : "outline"}
                                            size="icon" className="h-7 w-7 text-xs"
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </Button>
                                    )
                                })}
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                    disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                    disabled={!meta.hasNext} onClick={() => setPage(meta.totalPages)}>
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
