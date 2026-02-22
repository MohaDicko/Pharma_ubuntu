"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ShoppingCart, Plus, Minus, CreditCard, ScanBarcode, Loader2, Trash2, Package } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"

interface Product {
    id: string
    name: string
    price: number
    stock: number
}

interface CartItem extends Product {
    quantity: number
}

export default function POSTerminal() {
    const [searchQuery, setSearchQuery] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [lastTransactionId, setLastTransactionId] = useState<string | null>(null)
    const [mobileView, setMobileView] = useState<'products' | 'cart'>('products')
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { fetchProducts() }, [])

    async function fetchProducts() {
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                setProducts(data.map((p: { id: string, name: string, sellingPrice: number, stock: number }) => ({
                    id: p.id, name: p.name, price: p.sellingPrice, stock: p.stock
                })))
            }
        } catch (e) {
            console.error("Erreur chargement produits", e)
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const addToCart = (product: Product) => {
        if (product.stock <= 0) { toast("Rupture de stock !", 'warning'); return }
        setCart(currentCart => {
            const existing = currentCart.find(item => item.id === product.id)
            if (existing) {
                if (existing.quantity >= product.stock) { toast("Stock max atteint !", 'warning'); return currentCart }
                return currentCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            // Sur mobile, switcher auto vers le panier après ajout
            setTimeout(() => { if (window.innerWidth < 768) setMobileView('cart') }, 300)
            return [...currentCart, { ...product, quantity: 1 }]
        })
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(currentCart =>
            currentCart.map(item => {
                if (item.id !== id) return item
                const newQty = item.quantity + delta
                if (newQty <= 0) return null
                return { ...item, quantity: newQty }
            }).filter(Boolean) as CartItem[]
        )
    }

    const totalTTC = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    const handleCheckout = async () => {
        if (cart.length === 0 || isCheckingOut) return
        setIsCheckingOut(true)
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(item => ({ productId: item.id, quantity: item.quantity, sellingPrice: item.price })),
                    paymentMethod: 'CASH'
                })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Erreur transaction")

            setLastTransactionId(result.transactionId)
            window.open(`/pos/print/${result.transactionId}`, '_blank')
            setCart([])
            setMobileView('products')
            fetchProducts()
            toast("Vente enregistrée avec succès !", 'success')
            setTimeout(() => setLastTransactionId(null), 5000)
        } catch (error) {
            toast("Erreur : " + (error as Error).message, 'error')
        } finally {
            setIsCheckingOut(false)
        }
    }

    // ── Section Produits ─────────────────────────────────────────
    const ProductsPanel = () => (
        <div className="flex flex-col h-full gap-3">
            {/* Barre de recherche */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    ref={searchInputRef}
                    placeholder="Scanner ou chercher un médicament..."
                    className="pl-10 h-12 text-base shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Grille Produits */}
            <ScrollArea className="flex-1 rounded-xl border bg-white/60 shadow-inner">
                <div className="p-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-slate-500">Chargement...</span>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                            <Package className="h-10 w-10" />
                            <span className="text-sm">Aucun produit trouvé</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={`
                                        w-full text-left rounded-xl border-2 p-3 bg-white shadow-sm
                                        transition-all duration-150 active:scale-95
                                        ${product.stock <= 0
                                            ? 'opacity-40 grayscale cursor-not-allowed border-slate-100'
                                            : 'hover:border-primary hover:shadow-md cursor-pointer border-slate-100'
                                        }
                                    `}
                                >
                                    <div className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2" title={product.name}>
                                        {product.name}
                                    </div>
                                    <div className="text-primary font-bold text-base font-mono">
                                        {product.price.toLocaleString()} <span className="text-xs font-normal">F</span>
                                    </div>
                                    <div className={`text-[10px] font-semibold mt-1 uppercase tracking-wide
                                        ${product.stock <= 0 ? 'text-rose-500' : product.stock <= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                        {product.stock <= 0 ? 'Rupture' : `Stock: ${product.stock}`}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )

    // ── Section Panier ────────────────────────────────────────────
    const CartPanel = () => (
        <div className="flex flex-col h-full bg-white rounded-xl border shadow-lg overflow-hidden">
            {/* Header Panier */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span>Panier</span>
                    {cartCount > 0 && (
                        <Badge className="bg-primary text-white text-xs px-2 min-w-[22px] justify-center">
                            {cartCount}
                        </Badge>
                    )}
                </div>
                {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                        <Trash2 className="h-3 w-3" /> Vider
                    </button>
                )}
            </div>

            {/* Liste Articles */}
            <ScrollArea className="flex-1 px-3 py-2">
                {cart.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-3">
                        <ScanBarcode className="h-12 w-12" />
                        <span className="text-sm">Panier vide</span>
                    </div>
                ) : (
                    <div className="space-y-2 py-1">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-slate-900 truncate">{item.name}</div>
                                    <div className="text-xs text-slate-400">{item.price.toLocaleString()} F/u</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => updateQuantity(item.id, -1)}
                                        className="h-7 w-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)}
                                        className="h-7 w-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="font-bold text-sm text-primary min-w-[55px] text-right">
                                    {(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Total + Encaisser */}
            <div className="p-4 border-t bg-slate-50 space-y-3">
                {lastTransactionId && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 p-2.5 rounded-lg text-xs font-semibold animate-in fade-in">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Vente réussie ! Ticket en cours d'impression.
                    </div>
                )}

                <div className="space-y-1.5">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Sous-total</span>
                        <span>{totalTTC.toLocaleString()} F</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>TVA (0%)</span>
                        <span>0 F</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-lg">Net à Payer</span>
                        <span className="font-black text-2xl text-primary">{totalTTC.toLocaleString()} <span className="text-sm font-normal">FCFA</span></span>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="w-full h-14 text-base font-black tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-95"
                    disabled={cart.length === 0 || isCheckingOut}
                    onClick={handleCheckout}
                >
                    {isCheckingOut ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> TRAITEMENT EN COURS...</>
                    ) : (
                        <><CreditCard className="mr-2 h-5 w-5" /> ENCAISSER {cart.length > 0 ? `(${cartCount} art.)` : ''}</>
                    )}
                </Button>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-56px)]">

            {/* ─── MOBILE : Onglets Produits / Panier ──────────────────── */}
            <div className="md:hidden flex-1 flex flex-col overflow-hidden">
                {/* Toggle mobile */}
                <div className="flex p-2 gap-2 bg-white border-b shrink-0">
                    <button
                        onClick={() => setMobileView('products')}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
                            ${mobileView === 'products' ? 'bg-primary text-white shadow' : 'bg-slate-100 text-slate-600'}`}
                    >
                        <Package className="h-4 w-4" /> Produits
                    </button>
                    <button
                        onClick={() => setMobileView('cart')}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 relative
                            ${mobileView === 'cart' ? 'bg-primary text-white shadow' : 'bg-slate-100 text-slate-600'}`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Panier
                        {cartCount > 0 && (
                            <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center
                                ${mobileView === 'cart' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Contenu mobile */}
                <div className="flex-1 overflow-hidden p-3">
                    {mobileView === 'products' ? <ProductsPanel /> : <CartPanel />}
                </div>
            </div>

            {/* ─── DESKTOP : Layout côte-à-côte ─────────────────────────── */}
            <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 overflow-hidden p-4">
                <div className="md:col-span-2 overflow-hidden flex flex-col">
                    <ProductsPanel />
                </div>
                <div className="overflow-hidden flex flex-col">
                    <CartPanel />
                </div>
            </div>
        </div>
    )
}
