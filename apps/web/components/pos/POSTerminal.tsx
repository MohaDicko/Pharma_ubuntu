"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ShoppingCart, Plus, Minus, CreditCard, ScanBarcode } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
// Tabs removed as they are unused

interface Product {
    id: string
    name: string
    price: number
    stock: number
    tva?: number
}

interface CartItem extends Product {
    quantity: number
}

export default function POSTerminal() {
    const [searchQuery, setSearchQuery] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Charger les produits (Simulation API réelle)
    // Dans une vraie app : useQuery ou fetch sur /api/products
    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                // Mapping pour s'assurer des types
                const formatted = data.map((p: { id: string, name: string, sellingPrice: number, stock: number }) => ({
                    id: p.id,
                    name: p.name,
                    price: p.sellingPrice,
                    stock: p.stock // Quantité globale
                }))
                setProducts(formatted)
            }
        } catch (e) {
            console.error("Erreur chargement produits", e)
        } finally {
            setLoading(false)
        }
    }

    // Filtrer les produits
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Ajouter au panier
    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            alert("Rupture de stock !")
            return
        }

        setCart(currentCart => {
            const existing = currentCart.find(item => item.id === product.id)
            if (existing) {
                if (existing.quantity >= product.stock) {
                    alert("Stock insuffisant pour ajouter plus !")
                    return currentCart
                }
                return currentCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...currentCart, { ...product, quantity: 1 }]
        })
    }

    // Retirer / Diminuer
    const updateQuantity = (id: string, delta: number) => {
        setCart(currentCart => {
            return currentCart.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + delta
                    if (newQty <= 0) return null // Supprimer
                    // Vérif stock max (optionnel ici pour simplifier UX)
                    return { ...item, quantity: newQty }
                }
                return item
            }).filter(Boolean) as CartItem[]
        })
    }

    // Totaux
    const totalHT = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    // const totalTions = 0 // TVA simplifiée ou incluse - removed as unused
    const totalTTC = totalHT

    // Encaisser
    const handleCheckout = async () => {
        if (cart.length === 0) return

        try {
            const payload = {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    sellingPrice: item.price
                })),
                paymentMethod: 'CASH'
            }

            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const result = await res.json()

            if (!res.ok) throw new Error(result.error || "Erreur transaction")

            // Succès !
            // alert(`Vente réussie ! ID Transaction: ${result.transactionId}`)

            // Ouvrir l'impression du ticket dans un nouvel onglet
            window.open(`/pos/print/${result.transactionId}`, '_blank');

            setCart([]) // Vider le panier
            fetchProducts() // Recharger les stocks à jour
        } catch (error) {
            alert("Erreur lors de la vente: " + (error as Error).message)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Left Column: Search & Products */}
            <div className="md:col-span-2 space-y-4 flex flex-col h-full">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Scanner ou chercher (DCI, Nom)..."
                            className="pl-10 text-lg py-6"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 border rounded-md p-4 bg-white/50">
                    {loading ? (
                        <div className="p-10 text-center">Chargement...</div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <Card
                                    key={product.id}
                                    className={`cursor-pointer hover:border-primary transition-colors ${product.stock === 0 ? 'opacity-50 grayscale' : ''}`}
                                    onClick={() => addToCart(product)}
                                >
                                    <CardContent className="p-4 text-center space-y-2">
                                        <div className="font-bold truncate" title={product.name}>{product.name}</div>
                                        <div className="text-primary font-mono font-bold text-lg">{product.price.toLocaleString()} F</div>
                                        <Badge variant={product.stock > 10 ? "secondary" : "destructive"}>
                                            Stock: {product.stock}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right Column: Cart & Payment */}
            <Card className="flex flex-col h-full border-l-4 border-l-primary shadow-xl">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Panier en cours
                    </CardTitle>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                            <ScanBarcode className="h-16 w-16" />
                            <p>En attente de produits...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.price} x {item.quantity}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="ml-4 font-bold min-w-[60px] text-right">
                                        {(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-6 bg-muted/10 border-t space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total HT</span>
                            <span>{totalHT.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">TVA (0%)</span>
                            <span>0 F</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-2xl font-bold text-primary">
                            <span>Net à Payer</span>
                            <span>{totalTTC.toLocaleString()} FCFA</span>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full h-14 text-xl font-bold shadow-lg hover:scale-105 transition-transform"
                        disabled={cart.length === 0}
                        onClick={handleCheckout}
                    >
                        <CreditCard className="mr-2 h-6 w-6" />
                        ENCAISSER
                    </Button>
                </div>
            </Card>
        </div>
    )
}
