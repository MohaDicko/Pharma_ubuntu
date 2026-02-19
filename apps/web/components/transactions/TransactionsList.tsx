"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2 } from "lucide-react"

interface Transaction {
    id: string
    date: string
    amount: number
    type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT'
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED'
    paymentMethod: string
    products: string
}

export default function TransactionsList() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    async function fetchTransactions() {
        setLoading(true)
        try {
            const res = await fetch('/api/transactions') // Pas encore créé, mais on prépare le terrain
            if (res.ok) {
                const data = await res.json()
                // Adaptation si l'API n'est pas encore prête (fallback safe)
                if (Array.isArray(data)) {
                    setTransactions(data)
                }
            }
        } catch (error) {
            console.error("Erreur chargement transactions", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [])

    const filteredTransactions = transactions.filter(t =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.products.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transactions Financières</h2>
                    <p className="text-muted-foreground">
                        Historique complet des ventes, achats et ajustements de stock.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={fetchTransactions} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par ID transaction ou produit..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Journal des Opérations</CardTitle>
                    <CardDescription>Les 50 dernières transactions enregistrées.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead>Date & Heure</TableHead>
                                    <TableHead>Détails (Produits / Motif)</TableHead>
                                    <TableHead>Méthode</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune transaction trouvée.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {tx.type === 'SALE' ? (
                                                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <ArrowDownLeft className="h-4 w-4 text-red-500" />
                                                    )}
                                                    <span className="font-medium">{tx.type === 'SALE' ? 'Vente' : 'Achat'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(tx.date).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={tx.products}>
                                                {tx.products}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{tx.paymentMethod}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                    className={tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${tx.type === 'SALE' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'SALE' ? '+' : '-'}{tx.amount.toLocaleString()} F
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
