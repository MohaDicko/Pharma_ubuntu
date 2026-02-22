"use client"

import { useState, useEffect } from "react"
import { useCsvExport } from "@/hooks/useCsvExport"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, FileDown, Layers, Calendar, RefreshCw, Loader2, Clock } from "lucide-react"

// Interface TypeScript pour l'API
interface Product {
    id: string
    name: string
    dci: string
    stock: number
    minThreshold: number
    status: 'OK' | 'LOW' | 'RUPTURE'
    nextExpiry: string | null
    batchesCount: number
}

export default function InventoryManager() {
    const [searchTerm, setSearchTerm] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const { downloadCsv } = useCsvExport()

    // Fonction pour charger les données réelles
    async function fetchInventory() {
        setLoading(true)
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                setProducts(data)
            }
        } catch (error) {
            console.error("Erreur de chargement", error)
        } finally {
            setLoading(false)
        }
    }

    // Charger au montage du composant
    useEffect(() => {
        fetchInventory()
    }, [])

    // Export CSV
    const handleExport = () => {
        const exportData = products.map(p => ({
            Nom: p.name,
            DCI: p.dci,
            Stock: p.stock,
            Seuil: p.minThreshold,
            Statut: p.status,
            Prochaine_Peremption: p.nextExpiry ? new Date(p.nextExpiry).toLocaleDateString() : 'N/A'
        }))
        downloadCsv(exportData, `inventaire-${new Date().toISOString().split('T')[0]}.csv`)
    }

    // Filtrage local
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dci.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const lowStockProducts = products.filter(p => p.stock <= p.minThreshold)

    const expiringProducts = products.filter(p => {
        if (!p.nextExpiry) return false;
        const expiry = new Date(p.nextExpiry);
        const now = new Date();
        const diffTime = Math.abs(expiry.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < 90;
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestion des Stocks</h2>
                    <p className="text-sm text-muted-foreground">
                        Vue temps réel des lots et péremptions (FEFO).
                    </p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <Button variant="secondary" onClick={fetchInventory} disabled={loading} className="flex-1 sm:flex-none">
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden xs:inline">Actualiser</span>
                    </Button>
                    <Button className="flex-1 sm:flex-none">
                        <Plus className="mr-2 h-4 w-4" />
                        Produit
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full flex-1">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher (Nom, DCI)..."
                        className="pl-9 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={handleExport} disabled={products.length === 0} className="w-full sm:w-auto h-11">
                    <FileDown className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <ScrollArea className="w-full">
                    <TabsList className="w-full inline-flex sm:w-auto">
                        <TabsTrigger value="all" className="flex-1 sm:flex-none">Tous ({products.length})</TabsTrigger>
                        <TabsTrigger value="low" className="flex-1 sm:flex-none whitespace-nowrap">Alertes ({lowStockProducts.length})</TabsTrigger>
                        <TabsTrigger value="expires" className="flex-1 sm:flex-none whitespace-nowrap">Expiration ({expiringProducts.length})</TabsTrigger>
                    </TabsList>
                </ScrollArea>

                <TabsContent value="all" className="space-y-4">
                    <Card className="border-none sm:border shadow-sm sm:shadow-md">
                        <CardHeader className="px-0 sm:px-6">
                            <CardTitle className="text-xl px-4 sm:px-0">Inventaire Global</CardTitle>
                            <CardDescription className="px-4 sm:px-0">Vue agrégée par produit.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6">
                            <ProductTable products={filteredProducts} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="low" className="space-y-4">
                    <Card className="border-none sm:border shadow-sm sm:shadow-md">
                        <CardHeader className="px-0 sm:px-6">
                            <CardTitle className="text-xl px-4 sm:px-0">Alertes de Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6">
                            <ProductTable products={lowStockProducts} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expires" className="space-y-4">
                    <Card className="border-none sm:border shadow-sm sm:shadow-md">
                        <CardHeader className="px-0 sm:px-6">
                            <CardTitle className="text-xl px-4 sm:px-0">Péremptions Imminentes</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6">
                            <ProductTable products={expiringProducts} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ProductTable({ products, loading }: { products: Product[], loading: boolean }) {
    if (loading) return (
        <div className="rounded-md border p-10 text-center flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
        </div>
    )

    if (products.length === 0) return (
        <div className="rounded-md border p-10 text-center text-muted-foreground">Aucun produit trouvé.</div>
    )

    return (
        <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-md border">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[300px]">Produit / DCI</TableHead>
                            <TableHead className="text-center">Stock Total</TableHead>
                            <TableHead className="text-center">Seuil</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Lots</TableHead>
                            <TableHead>Expiration Proche</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <div className="font-bold">{product.name}</div>
                                    <div className="text-xs text-muted-foreground uppercase">{product.dci}</div>
                                </TableCell>
                                <TableCell className="text-center font-mono font-bold">{product.stock}</TableCell>
                                <TableCell className="text-center text-muted-foreground font-mono">{product.minThreshold}</TableCell>
                                <TableCell>
                                    <Badge variant={product.status === 'OK' ? 'default' : 'destructive'}
                                        className={product.status === 'OK' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                                        {product.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                        {product.batchesCount}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {product.nextExpiry ? (
                                        <div className={`flex items-center text-sm font-medium ${new Date(product.nextExpiry).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                                            ? 'text-rose-600' : 'text-amber-600'
                                            }`}>
                                            <Calendar className="mr-2 h-3.5 w-3.5" />
                                            {new Date(product.nextExpiry).toLocaleDateString()}
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Détails</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3 px-4 sm:px-0 pb-10">
                {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl border p-4 shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-900">{product.name}</h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">{product.dci}</p>
                            </div>
                            <Badge variant={product.status === 'OK' ? 'default' : 'destructive'}
                                className={product.status === 'OK' ? 'bg-emerald-600' : ''}>
                                {product.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 my-3">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase mb-1">Stock</p>
                                <p className="text-lg font-black text-primary">{product.stock}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase mb-1">Seuil</p>
                                <p className="text-lg font-bold text-slate-500">{product.minThreshold}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            {product.nextExpiry ? (
                                <div className="flex items-center text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">
                                    <Clock className="mr-1.5 h-3 w-3" />
                                    {new Date(product.nextExpiry).toLocaleDateString()}
                                </div>
                            ) : <div></div>}
                            <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold text-primary border-primary/20 hover:bg-primary/5">
                                Gérer les lots
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
