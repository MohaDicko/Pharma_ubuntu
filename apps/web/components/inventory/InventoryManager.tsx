"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { useCsvExport } from "@/hooks/useCsvExport"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, FileDown, Calendar, RefreshCw, Loader2, Trash2, Edit2, AlertTriangle, PackagePlus } from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/hooks/useAuth"

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

// ─── Memoized Row ─────────────────────────────────────────────────────────
const ProductRow = memo(({ product, onEdit, onDelete, canDelete }: {
    product: Product,
    onEdit: (p: Product) => void,
    onDelete: (p: Product) => void,
    canDelete: boolean
}) => (
    <TableRow className="hover:bg-slate-50/50">
        <TableCell className="pl-6">
            <div className="font-bold text-slate-900">{product.name}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">{product.dci || '-'}</div>
            <div className="text-[10px] text-slate-400">{product.category}</div>
        </TableCell>
        <TableCell className="text-center font-mono font-bold text-lg">
            <span className={product.stock <= 0 ? 'text-rose-600' : product.stock <= product.minThreshold ? 'text-amber-600' : 'text-slate-800'}>
                {product.stock}
            </span>
        </TableCell>
        <TableCell>
            <Badge variant={product.status === 'OK' ? 'default' : 'destructive'}
                className={
                    product.status === 'OK' ? 'bg-emerald-600' :
                        product.status === 'LOW' ? 'bg-amber-500' : ''
                }>
                {product.status}
            </Badge>
        </TableCell>
        <TableCell className="font-bold text-slate-700">{product.sellingPrice.toLocaleString()} F</TableCell>
        <TableCell>
            {product.nextExpiry ? (
                <div className="flex items-center text-xs font-medium text-slate-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(product.nextExpiry).toLocaleDateString('fr-FR')}
                </div>
            ) : <span className="text-slate-300 text-xs">Aucun lot</span>}
        </TableCell>
        <TableCell className="text-right pr-6">
            <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                    onClick={() => onEdit(product)} title="Modifier">
                    <Edit2 className="h-4 w-4" />
                </Button>
                {canDelete && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        onClick={() => onDelete(product)} title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </TableCell>
    </TableRow>
))
ProductRow.displayName = "ProductRow"

function ProductTable({ products, loading, onEdit, onDelete, canDelete }: {
    products: Product[], loading: boolean,
    onEdit: (p: Product) => void, onDelete: (p: Product) => void,
    canDelete: boolean
}) {
    if (loading) return (
        <div className="h-48 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-slate-500">Chargement de l'inventaire...</span>
        </div>
    )

    if (products.length === 0) return (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
            <PackagePlus className="h-10 w-10 text-slate-200" />
            <span className="text-sm">Aucun produit trouvé.</span>
        </div>
    )

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="pl-6">Produit / DCI</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Prix Vente</TableHead>
                        <TableHead>Proch. Péremption</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((p) => (
                        <ProductRow key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} canDelete={canDelete} />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function InventoryManager() {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const { downloadCsv } = useCsvExport()

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Formulaire Ajout
    const [newProduct, setNewProduct] = useState({
        name: "", dci: "", category: "Médicament",
        sellingPrice: "", minThreshold: "5",
        // Lot initial
        initialQuantity: "", costPrice: "",
        expiryDate: "", batchNumber: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Formulaire Édition
    const [editForm, setEditForm] = useState({ name: "", dci: "", sellingPrice: "", minThreshold: "" })
    const [isEditing, setIsEditing] = useState(false)

    async function fetchInventory() {
        setLoading(true)
        try {
            const res = await fetch('/api/products')
            if (res.ok) setProducts(await res.json())
            else toast("Erreur lors du chargement", 'error')
        } catch {
            toast("Erreur réseau", 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchInventory() }, [])

    // ── Ajouter produit + lot initial ──
    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.sellingPrice) {
            toast("Nom et Prix sont requis", 'warning')
            return
        }
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            })
            if (res.ok) {
                setIsAddModalOpen(false)
                setNewProduct({ name: "", dci: "", category: "Médicament", sellingPrice: "", minThreshold: "5", initialQuantity: "", costPrice: "", expiryDate: "", batchNumber: "" })
                fetchInventory()
                toast("Produit ajouté avec succès !", 'success')
            } else {
                const err = await res.json()
                toast(err.error || "Erreur lors de l'ajout", 'error')
            }
        } catch {
            toast("Erreur réseau", 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── Ouvrir l'édition ──
    const handleEditOpen = (product: Product) => {
        setEditProduct(product)
        setEditForm({
            name: product.name,
            dci: product.dci || '',
            sellingPrice: String(product.sellingPrice),
            minThreshold: String(product.minThreshold)
        })
    }

    // ── Sauvegarder l'édition ──
    const handleEditSave = async () => {
        if (!editProduct) return
        setIsEditing(true)
        try {
            const res = await fetch(`/api/products/${editProduct.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })
            if (res.ok) {
                setEditProduct(null)
                fetchInventory()
                toast("Produit mis à jour !", 'success')
            } else {
                const err = await res.json()
                toast(err.error || "Erreur lors de la mise à jour", 'error')
            }
        } catch {
            toast("Erreur réseau", 'error')
        } finally {
            setIsEditing(false)
        }
    }

    // ── Supprimer ──
    const handleDeleteConfirmed = async () => {
        if (!deleteProduct) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/products/${deleteProduct.id}`, { method: 'DELETE' })
            if (res.ok) {
                setDeleteProduct(null)
                fetchInventory()
                toast(`"${deleteProduct.name}" supprimé`, 'success')
            } else {
                const err = await res.json()
                toast(err.error || "Suppression impossible", 'error')
                setDeleteProduct(null)
            }
        } catch {
            toast("Erreur réseau", 'error')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleExport = () => {
        const data = products.map(p => ({ Nom: p.name, DCI: p.dci, Stock: p.stock, Prix: p.sellingPrice, Statut: p.status }))
        downloadCsv(data, `inventaire-${new Date().toISOString().split('T')[0]}.csv`)
    }

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.dci || '').toLowerCase().includes(searchTerm.toLowerCase())
        ), [products, searchTerm])

    const lowStockProducts = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minThreshold), [products])
    const ruptures = useMemo(() => products.filter(p => p.stock <= 0), [products])
    const expiringSoon = useMemo(() =>
        products.filter(p => p.nextExpiry && (new Date(p.nextExpiry).getTime() - Date.now() < 90 * 24 * 3600 * 1000)), [products])

    const isAdmin = user?.role === 'ADMIN'
    const canManage = user?.role === 'ADMIN' || user?.role === 'PHARMACIST'

    const tableProps = { loading, onEdit: handleEditOpen, onDelete: setDeleteProduct, canDelete: isAdmin }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gestion des Stocks</h2>
                    <p className="text-muted-foreground mt-1">Vue temps réel du catalogue et des lots.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={fetchInventory} disabled={loading} className="flex-1 sm:flex-none">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
                    </Button>
                    {canManage && (
                        <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none shadow-lg">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau Produit
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-none shadow-sm bg-white"><CardContent className="p-4"><div className="text-xs text-slate-500 mb-1">Total Références</div><div className="text-2xl font-bold text-slate-900">{products.length}</div></CardContent></Card>
                <Card className="border-none shadow-sm bg-emerald-50"><CardContent className="p-4"><div className="text-xs text-emerald-700 mb-1">En Stock</div><div className="text-2xl font-bold text-emerald-700">{products.filter(p => p.status === 'OK').length}</div></CardContent></Card>
                <Card className="border-none shadow-sm bg-amber-50"><CardContent className="p-4"><div className="text-xs text-amber-700 mb-1">Stock Bas</div><div className="text-2xl font-bold text-amber-700">{lowStockProducts.length}</div></CardContent></Card>
                <Card className="border-none shadow-sm bg-rose-50"><CardContent className="p-4"><div className="text-xs text-rose-700 mb-1">Ruptures</div><div className="text-2xl font-bold text-rose-700">{ruptures.length}</div></CardContent></Card>
            </div>

            {/* Recherche + Export */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Chercher un médicament..." className="pl-9 h-11"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Button variant="outline" onClick={handleExport} disabled={products.length === 0} className="w-full sm:w-auto h-11">
                    <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="bg-slate-100 p-1 rounded-lg flex-wrap h-auto gap-1">
                    <TabsTrigger value="all">Tous ({products.length})</TabsTrigger>
                    <TabsTrigger value="low" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">
                        Stock Bas ({lowStockProducts.length})
                    </TabsTrigger>
                    <TabsTrigger value="rupture" className="data-[state=active]:bg-rose-100 data-[state=active]:text-rose-800">
                        Ruptures ({ruptures.length})
                    </TabsTrigger>
                    <TabsTrigger value="expires" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                        Péremptions ({expiringSoon.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <ProductTable products={filteredProducts} {...tableProps} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="low">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <ProductTable products={lowStockProducts} {...tableProps} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="rupture">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <ProductTable products={ruptures} {...tableProps} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="expires">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardContent className="p-0">
                            <ProductTable products={expiringSoon} {...tableProps} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ─── Modal : Ajouter Produit ─── */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nouveau produit</DialogTitle>
                        <DialogDescription>Créez la fiche produit et définissez le stock de départ.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 border-b pb-1">Informations Produit</p>
                        <div className="grid gap-2">
                            <Label htmlFor="p-name">Nom Commercial *</Label>
                            <Input id="p-name" placeholder="Ex: Amoxicilline 500mg" value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="p-dci">DCI / Molécule</Label>
                            <Input id="p-dci" placeholder="Ex: Amoxicilline" value={newProduct.dci}
                                onChange={(e) => setNewProduct({ ...newProduct, dci: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="p-category">Catégorie</Label>
                            <Input id="p-category" placeholder="Ex: Antibiotique" value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="p-price">Prix de Vente (F) *</Label>
                                <Input id="p-price" type="number" min="0" placeholder="0" value={newProduct.sellingPrice}
                                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p-min">Seuil d'Alerte</Label>
                                <Input id="p-min" type="number" min="0" value={newProduct.minThreshold}
                                    onChange={(e) => setNewProduct({ ...newProduct, minThreshold: e.target.value })} />
                            </div>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 border-b pb-1 mt-2">Stock Initial (Lot)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="p-qty">Quantité en Stock</Label>
                                <Input id="p-qty" type="number" min="0" placeholder="0" value={newProduct.initialQuantity}
                                    onChange={(e) => setNewProduct({ ...newProduct, initialQuantity: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p-cost">Prix d'Achat (F)</Label>
                                <Input id="p-cost" type="number" min="0" placeholder="0" value={newProduct.costPrice}
                                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="p-expiry">Date de Péremption</Label>
                                <Input id="p-expiry" type="date" value={newProduct.expiryDate}
                                    onChange={(e) => setNewProduct({ ...newProduct, expiryDate: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p-batch">N° de Lot</Label>
                                <Input id="p-batch" placeholder="Ex: LOT-2024-001" value={newProduct.batchNumber}
                                    onChange={(e) => setNewProduct({ ...newProduct, batchNumber: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Annuler</Button>
                        <Button onClick={handleAddProduct} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Modal : Éditer Produit ─── */}
            <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Modifier le produit</DialogTitle>
                        <DialogDescription>Modifiez les informations de la fiche produit.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nom Commercial</Label>
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>DCI / Molécule</Label>
                            <Input value={editForm.dci} onChange={(e) => setEditForm({ ...editForm, dci: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Prix de Vente (F)</Label>
                                <Input type="number" value={editForm.sellingPrice} onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Seuil d'Alerte</Label>
                                <Input type="number" value={editForm.minThreshold} onChange={(e) => setEditForm({ ...editForm, minThreshold: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditProduct(null)} disabled={isEditing}>Annuler</Button>
                        <Button onClick={handleEditSave} disabled={isEditing}>
                            {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                            Sauvegarder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Modal : Confirmation Suppression ─── */}
            <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
                <DialogContent className="sm:max-w-[380px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5" /> Confirmer la suppression
                        </DialogTitle>
                        <DialogDescription>
                            Supprimer <strong>{deleteProduct?.name}</strong> ? Si ce produit a des ventes enregistrées, la suppression sera bloquée pour préserver l'historique.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setDeleteProduct(null)} disabled={isDeleting}>Annuler</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
