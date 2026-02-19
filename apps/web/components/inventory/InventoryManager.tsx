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
import { Search, Plus, FileDown, Layers, Calendar, RefreshCw } from "lucide-react"

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
        // Préparer les données propres pour le CSV (aplatir si besoin)
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

    // Logique simple pour "expire bientôt" (exemple: moins de 90 jours)
    const expiringProducts = products.filter(p => {
        if (!p.nextExpiry) return false;
        const expiry = new Date(p.nextExpiry);
        const now = new Date();
        const diffTime = Math.abs(expiry.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < 90; // Moins de 3 mois
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestion des Stocks</h2>
                    <p className="text-muted-foreground">
                        Vue temps réel des lots et des dates de péremption (FEFO).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={fetchInventory} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Produit
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom commercial ou DCI..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={handleExport} disabled={products.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">Tous ({products.length})</TabsTrigger>
                    <TabsTrigger value="low">Alerte Stock ({lowStockProducts.length})</TabsTrigger>
                    <TabsTrigger value="expires">Expire Bientôt ({expiringProducts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventaire Global</CardTitle>
                            <CardDescription>Vue agrégée par produit (tous lots confondus).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProductTable products={filteredProducts} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="low" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alertes de Stock</CardTitle>
                            <CardDescription>Produits ayant atteint ou dépassé le seuil minimum.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProductTable products={lowStockProducts} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expires" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Péremptions Imminentes</CardTitle>
                            <CardDescription>Produits ayant des lots expirant dans moins de 90 jours.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
        <div className="rounded-md border p-10 text-center">Chargement des données...</div>
    )

    if (products.length === 0) return (
        <div className="rounded-md border p-10 text-center">Aucun produit concerné.</div>
    )

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produit / DCI</TableHead>
                        <TableHead>Stock Total</TableHead>
                        <TableHead>Seuil Min.</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Lots Actifs</TableHead>
                        <TableHead>Prochaine Péremption</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted-foreground">{product.dci}</div>
                            </TableCell>
                            <TableCell className="font-bold text-center">{product.stock}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{product.minThreshold}</TableCell>
                            <TableCell>
                                <Badge variant={product.status === 'OK' ? 'default' : 'destructive'}
                                    className={product.status === 'OK' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                    {product.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                    <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {product.batchesCount}
                                </div>
                            </TableCell>
                            <TableCell>
                                {product.nextExpiry ? (
                                    <div className="flex items-center text-orange-600">
                                        <Calendar className="mr-2 h-4 w-4" />
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
    )
}
