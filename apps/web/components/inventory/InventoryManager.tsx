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
import { Search, Plus, FileDown, Layers, Calendar, RefreshCw, Loader2, Clock, Trash2, Edit2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Product {
    id: string
    name: string
    dci: string
    category: string
    stock: number
    minThreshold: number
    sellingPrice: number
    status: 'OK' | 'LOW' | 'RUPTURE'
    nextExpiry: string | null
    batchesCount: number
}

export default function InventoryManager() {
    const [searchTerm, setSearchTerm] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const { downloadCsv } = useCsvExport()

    // Form state for new product
    const [newProduct, setNewProduct] = useState({
        name: "",
        dci: "",
        category: "Générique",
        sellingPrice: "",
        minThreshold: "10"
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function fetchInventory() {
        setLoading(true)
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                setProducts(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInventory()
    }, [])

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.sellingPrice) return
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            })
            if (res.ok) {
                setIsAddModalOpen(false)
                setNewProduct({ name: "", dci: "", category: "Générique", sellingPrice: "", minThreshold: "10" })
                fetchInventory()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleExport = () => {
        const exportData = products.map(p => ({
            Nom: p.name,
            DCI: p.dci,
            Stock: p.stock,
            Prix: p.sellingPrice,
            Status: p.status
        }))
        downloadCsv(exportData, `inventaire-${new Date().toISOString().split('T')[0]}.csv`)
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dci.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const lowStockProducts = products.filter(p => p.stock <= p.minThreshold)
    const expiringSoon = products.filter(p => p.nextExpiry && (new Date(p.nextExpiry).getTime() - Date.now() < 90 * 24 * 3600 * 1000))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gestion des Stocks</h2>
                    <p className="text-muted-foreground mt-1">Vue temps réel des lots et du catalogue produits.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={fetchInventory} disabled={loading} className="flex-1 sm:flex-none">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none shadow-lg">
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Produit
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Chercher un médicament..."
                        className="pl-9 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={handleExport} disabled={products.length === 0} className="w-full sm:w-auto h-11">
                    <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="all">Tout ({products.length})</TabsTrigger>
                    <TabsTrigger value="low" className="text-amber-600">Ruptures ({lowStockProducts.length})</TabsTrigger>
                    <TabsTrigger value="expires" className="text-rose-600">Péremptions ({expiringSoon.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <ProductTable products={filteredProducts} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="low">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <ProductTable products={lowStockProducts} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="expires">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <ProductTable products={expiringSoon} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal Ajout Produit */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter au référentiel</DialogTitle>
                        <DialogDescription>Créez une nouvelle fiche produit dans le catalogue.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="p-name">Nom Commercial</Label>
                            <Input id="p-name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="p-dci">DCI / Molécule</Label>
                            <Input id="p-dci" value={newProduct.dci} onChange={(e) => setNewProduct({ ...newProduct, dci: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="p-price">Prix de Vente (F)</Label>
                                <Input id="p-price" type="number" value={newProduct.sellingPrice} onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p-min">Seuil Alerte</Label>
                                <Input id="p-min" type="number" value={newProduct.minThreshold} onChange={(e) => setNewProduct({ ...newProduct, minThreshold: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleAddProduct} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ProductTable({ products, loading }: { products: Product[], loading: boolean }) {
    if (loading) return (
        <div className="h-48 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-slate-500">Chargement de l'inventaire...</span>
        </div>
    )

    if (products.length === 0) return (
        <div className="h-48 flex items-center justify-center text-slate-400">
            Aucun produit trouvé.
        </div>
    )

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="pl-6">Produit</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Péremption</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((p) => (
                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                            <TableCell className="pl-6">
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground uppercase font-medium">{p.dci}</div>
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold">{p.stock}</TableCell>
                            <TableCell>
                                <Badge variant={p.status === 'OK' ? 'default' : 'destructive'}
                                    className={p.status === 'OK' ? 'bg-emerald-600' : ''}>
                                    {p.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-bold">{p.sellingPrice.toLocaleString()} F</TableCell>
                            <TableCell>
                                {p.nextExpiry ? (
                                    <div className="flex items-center text-xs font-bold text-slate-600">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {new Date(p.nextExpiry).toLocaleDateString()}
                                    </div>
                                ) : '-'}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
