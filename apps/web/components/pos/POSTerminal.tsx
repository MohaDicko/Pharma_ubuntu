"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
    Search, ShoppingCart, Plus, Minus, CreditCard,
    ScanBarcode, Loader2, Trash2, Package, Smartphone,
    Banknote, CheckCircle2, ArrowLeft, Calculator, ShieldCheck
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"

// ── Types ────────────────────────────────────────────────────────
interface Product { id: string; name: string; price: number; stock: number }
interface CartItem extends Product { quantity: number }
interface Insurance { id: string; name: string; percentage: number }
type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'INSURANCE'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'CASH', label: 'Espèces', icon: Banknote, color: 'emerald' },
    { id: 'INSURANCE', label: 'Assurance', icon: ShieldCheck, color: 'indigo' },
    { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone, color: 'orange' },
    { id: 'CARD', label: 'Carte Bancaire', icon: CreditCard, color: 'blue' },
]

// ── Preset rapides pour les montants ─────────────────────────────
function getQuickAmounts(total: number): number[] {
    const base = [500, 1000, 2000, 5000, 10000, 20000, 25000, 50000]
    return base.filter(v => v >= total).slice(0, 4)
}

// ═══════════════════════════════════════════════════════════════
export default function POSTerminal() {
    const [searchQuery, setSearchQuery] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [insurances, setInsurances] = useState<Insurance[]>([])
    const [loading, setLoading] = useState(true)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [lastTransactionId, setLastTransactionId] = useState<string | null>(null)
    const [mobileView, setMobileView] = useState<'products' | 'cart'>('products')
    // Paiement
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
    const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null)
    const [amountReceived, setAmountReceived] = useState("")
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart')

    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchProducts()
        fetchInsurances()
    }, [])

    async function fetchProducts() {
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                setProducts(data.map((p: { id: string; name: string; sellingPrice: number; stock: number }) => ({
                    id: p.id, name: p.name, price: p.sellingPrice, stock: p.stock
                })))
            }
        } catch (e) { console.error("Erreur chargement produits", e) }
        finally { setLoading(false) }
    }

    async function fetchInsurances() {
        try {
            const res = await fetch('/api/insurances')
            if (res.ok) {
                const data = await res.json()
                setInsurances(data)
            }
        } catch (e) { console.error("Erreur chargement assurances", e) }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const addToCart = useCallback((product: Product) => {
        if (product.stock <= 0) { toast("Rupture de stock !", 'warning'); return }
        setCart(current => {
            const existing = current.find(i => i.id === product.id)
            if (existing) {
                if (existing.quantity >= product.stock) { toast("Stock max atteint !", 'warning'); return current }
                return current.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
            }
            setTimeout(() => { if (window.innerWidth < 768) setMobileView('cart') }, 300)
            return [...current, { ...product, quantity: 1 }]
        })
    }, [])

    const updateQuantity = useCallback((id: string, delta: number) => {
        setCart(current =>
            current.map(i => {
                if (i.id !== id) return i
                const newQty = i.quantity + delta
                return newQty <= 0 ? null : { ...i, quantity: newQty }
            }).filter(Boolean) as CartItem[]
        )
    }, [])

    const totalTTC = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

    // Calcul de la part assurance
    const insuranceAmount = paymentMethod === 'INSURANCE' && selectedInsurance
        ? (totalTTC * selectedInsurance.percentage) / 100
        : 0
    const patientDue = totalTTC - insuranceAmount

    const received = parseFloat(amountReceived.replace(/\s/g, '')) || 0
    const change = received - (paymentMethod === 'INSURANCE' ? patientDue : totalTTC)
    const changeOk = (paymentMethod !== 'CASH' && paymentMethod !== 'INSURANCE')
        || (paymentMethod === 'INSURANCE' && (!selectedInsurance ? false : received >= patientDue))
        || (paymentMethod === 'CASH' && received >= totalTTC)

    const resetCheckout = () => {
        setCheckoutStep('cart')
        setAmountReceived("")
        setPaymentMethod('CASH')
    }

    const handleCheckout = async () => {
        if (cart.length === 0 || isCheckingOut) return
        if (paymentMethod === 'CASH' && received < totalTTC) {
            toast("Montant insuffisant — veuillez vérifier.", 'warning')
            return
        }
        if (paymentMethod === 'INSURANCE' && (!selectedInsurance || received < patientDue)) {
            toast("Veuillez sélectionner une assurance et vérifier l'encaissement patient.", 'warning')
            return
        }
        setIsCheckingOut(true)
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(i => ({ productId: i.id, quantity: i.quantity, sellingPrice: i.price })),
                    paymentMethod,
                    insuranceId: selectedInsurance?.id,
                    insurancePart: insuranceAmount,
                    patientPart: patientDue
                })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Erreur transaction")

            setLastTransactionId(result.transactionId)
            setCheckoutStep('success')

            // Ouvrir ticket dans 1.5s (laisser voir la page succès)
            setTimeout(() => {
                window.open(`/pos/print/${result.transactionId}`, '_blank')
            }, 1500)

            // Reset après 4 secondes
            setTimeout(() => {
                setCart([])
                setMobileView('products')
                fetchProducts()
                resetCheckout()
                setLastTransactionId(null)
            }, 4000)

        } catch (error) {
            toast("Erreur : " + (error as Error).message, 'error')
        } finally {
            setIsCheckingOut(false)
        }
    }

    // ── Panel Produits ────────────────────────────────────────────
    const ProductsPanel = () => (
        <div className="flex flex-col h-full gap-3">
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

            <ScrollArea className="flex-1 rounded-xl border bg-white/60 shadow-inner">
                <div className="p-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-slate-500">Chargement...</span>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300">
                            <Package className="h-12 w-12" />
                            <span className="text-sm font-medium">Aucun produit trouvé</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={`w-full text-left rounded-xl border-2 p-3 bg-white shadow-sm transition-all duration-150 active:scale-95
                                        ${product.stock <= 0
                                            ? 'opacity-40 grayscale cursor-not-allowed border-slate-100'
                                            : 'hover:border-primary hover:shadow-md cursor-pointer border-slate-100'}`}
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

    // ── Écran Succès ──────────────────────────────────────────────
    const SuccessScreen = () => (
        <div className="flex flex-col items-center justify-center h-full gap-5 p-6 animate-in zoom-in-75 duration-500">
            <div className="relative">
                <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
            </div>
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Vente Réussie !</h2>
                <p className="text-slate-500 text-sm">Ticket en cours d'impression...</p>
            </div>
            {paymentMethod === 'CASH' && change > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center w-full">
                    <p className="text-sm text-emerald-700 font-semibold uppercase tracking-wider mb-1">Monnaie à rendre</p>
                    <p className="text-4xl font-black text-emerald-700">{change.toLocaleString()} <span className="text-xl font-bold">FCFA</span></p>
                </div>
            )}
            <p className="text-xs text-slate-300 animate-pulse">Réinitialisation automatique...</p>
        </div>
    )

    // ── Panel Panier (Étape 1 : Articles) ────────────────────────
    const CartItemsStep = () => (
        <>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span>Panier</span>
                    {cartCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center">
                            {cartCount}
                        </span>
                    )}
                </div>
                {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1">
                        <Trash2 className="h-3 w-3" /> Vider
                    </button>
                )}
            </div>

            <ScrollArea className="flex-1 px-3 py-2">
                {cart.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-200 gap-3">
                        <ScanBarcode className="h-12 w-12" />
                        <span className="text-sm font-medium text-slate-400">Panier vide</span>
                        <p className="text-xs text-slate-300 text-center">Touchez un produit pour l'ajouter</p>
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
                                    <span className="w-7 text-center font-black text-slate-900">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)}
                                        className="h-7 w-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="ml-2 font-bold text-sm text-primary min-w-[60px] text-right">
                                    {(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Total + bouton aller au paiement */}
            <div className="p-4 border-t bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600">Total</span>
                    <span className="text-2xl font-black text-primary">{totalTTC.toLocaleString()} <span className="text-sm font-normal">FCFA</span></span>
                </div>
                <Button
                    size="lg"
                    className="w-full h-14 text-base font-black tracking-wide shadow-lg"
                    disabled={cart.length === 0}
                    onClick={() => setCheckoutStep('payment')}
                >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Procéder au Paiement
                </Button>
            </div>
        </>
    )

    // ── Panel Panier (Étape 2 : Paiement) ────────────────────────
    const PaymentStep = () => {
        const quickAmounts = getQuickAmounts(totalTTC)

        return (
            <>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-slate-50">
                    <button
                        onClick={() => setCheckoutStep('cart')}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-600" />
                    </button>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">Encaissement</p>
                        <p className="text-[11px] text-slate-400">{cartCount} article(s) — {totalTTC.toLocaleString()} FCFA</p>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-5">

                        {/* ─ Méthode de paiement ─ */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Méthode de paiement
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_METHODS.map(method => {
                                    const Icon = method.icon
                                    const isSelected = paymentMethod === method.id
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => {
                                                setPaymentMethod(method.id)
                                                setAmountReceived("")
                                            }}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all font-semibold text-xs
                                                ${isSelected
                                                    ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700`
                                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <Icon className={`h-5 w-5 ${isSelected ? `text-${method.color}-600` : ''}`} />
                                            <span className="leading-tight text-center">{method.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ─ Montant total ─ */}
                        <div className="bg-slate-900 text-white rounded-xl p-4 text-center">
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">À Payer</p>
                            <p className="text-3xl font-black">{totalTTC.toLocaleString()} <span className="text-base font-normal">FCFA</span></p>
                        </div>

                        {/* ─ Section espèces : montant reçu ─ */}
                        {paymentMethod === 'CASH' && (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calculator className="h-3.5 w-3.5" /> Montant reçu du client
                                </p>

                                {/* Input montant reçu */}
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="number"
                                        placeholder="Ex: 10000"
                                        className="pl-10 h-14 text-xl font-bold text-right pr-16 focus:ring-2 focus:ring-primary"
                                        value={amountReceived}
                                        onChange={e => setAmountReceived(e.target.value)}
                                        autoFocus
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">FCFA</span>
                                </div>

                                {/* Montants rapides */}
                                {quickAmounts.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-slate-400 mb-1.5">Billets rapides :</p>
                                        <div className="flex flex-wrap gap-2">
                                            {quickAmounts.map(amount => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setAmountReceived(String(amount))}
                                                    className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all
                                                        ${amountReceived === String(amount)
                                                            ? 'border-primary bg-primary text-white'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary'
                                                        }`}
                                                >
                                                    {amount.toLocaleString()} F
                                                </button>
                                            ))}
                                            {/* Montant exact */}
                                            <button
                                                onClick={() => setAmountReceived(String(totalTTC))}
                                                className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all
                                                    ${amountReceived === String(totalTTC)
                                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-500'
                                                    }`}
                                            >
                                                Exact
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Monnaie à rendre */}
                                {received > 0 && (
                                    <div className={`rounded-xl p-4 border-2 transition-all
                                        ${change >= 0
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : 'bg-rose-50 border-rose-300'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className={`text-xs font-bold uppercase tracking-wider ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {change >= 0 ? '✓ Monnaie à rendre' : '✗ Montant insuffisant'}
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {received.toLocaleString()} − {totalTTC.toLocaleString()} FCFA
                                                </p>
                                            </div>
                                            <p className={`text-2xl font-black ${change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {Math.abs(change).toLocaleString()}
                                                <span className="text-sm font-normal ml-1">F</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─ Section Assurance ─ */}
                        {paymentMethod === 'INSURANCE' && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Choisir l'Assureur</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {insurances.map(ins => (
                                            <button
                                                key={ins.id}
                                                onClick={() => {
                                                    setSelectedInsurance(ins)
                                                    setAmountReceived("") // Reset received amount when changing insurance
                                                }}
                                                className={`p-3 rounded-xl border-2 transition-all text-xs font-bold flex flex-col items-center gap-1
                                                    ${selectedInsurance?.id === ins.id
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                            >
                                                <span>{ins.name}</span>
                                                <span className="text-[10px] opacity-70">Prise en charge: {ins.percentage}%</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedInsurance && (
                                    <div className="bg-slate-50 rounded-xl border p-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Part Assurance ({selectedInsurance.percentage}%)</span>
                                            <span className="font-bold text-indigo-600">-{insuranceAmount.toLocaleString()} F</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="font-bold text-slate-700">Reste à payer</span>
                                            <span className="font-black text-slate-900">{patientDue.toLocaleString()} F</span>
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Montant reçu (Espèces)</p>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="Encaissement patient..."
                                                    className="h-12 text-lg font-bold text-right pr-12"
                                                    value={amountReceived}
                                                    onChange={e => setAmountReceived(e.target.value)}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">F</span>
                                            </div>
                                            {received > 0 && (
                                                <div className="flex justify-between items-center mt-2 px-1">
                                                    <span className="text-[10px] text-slate-500">Monnaie à rendre :</span>
                                                    <span className={`text-sm font-bold ${change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {Math.max(0, change).toLocaleString()} F
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─ Mobile Money / Carte ─ */}
                        {(paymentMethod === 'MOBILE_MONEY' || paymentMethod === 'CARD') && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
                                {paymentMethod === 'MOBILE_MONEY' ? (
                                    <>
                                        <Smartphone className="h-8 w-8 text-orange-500 mx-auto" />
                                        <p className="font-bold text-slate-800">Paiement Mobile Money</p>
                                        <p className="text-sm text-slate-500">Demandez au client d'effectuer le transfert au numéro de la pharmacie avant de valider.</p>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-8 w-8 text-blue-500 mx-auto" />
                                        <p className="font-bold text-slate-800">Paiement par Carte</p>
                                        <p className="text-sm text-slate-500">Insérez ou approchez la carte du terminal de paiement TPE et validez.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Bouton Encaisser */}
                <div className="p-4 border-t bg-white space-y-2">
                    <Button
                        size="lg"
                        className={`w-full h-14 text-base font-black tracking-wide shadow-lg transition-all
                            ${changeOk ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!changeOk || isCheckingOut}
                        onClick={handleCheckout}
                    >
                        {isCheckingOut ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Traitement...</>
                        ) : (
                            <><CheckCircle2 className="mr-2 h-5 w-5" /> CONFIRMER LA VENTE</>
                        )}
                    </Button>
                    {paymentMethod === 'CASH' && received > 0 && change < 0 && (
                        <p className="text-xs text-center text-rose-500 font-medium">
                            Il manque {Math.abs(change).toLocaleString()} FCFA
                        </p>
                    )}
                </div>
            </>
        )
    }

    // ── Panel Panier complet (wrapper des étapes) ─────────────────
    const CartPanel = () => (
        <div className="flex flex-col h-full bg-white rounded-xl border shadow-lg overflow-hidden">
            {checkoutStep === 'success' ? (
                <SuccessScreen />
            ) : checkoutStep === 'payment' ? (
                <PaymentStep />
            ) : (
                <CartItemsStep />
            )}
        </div>
    )

    const cartTab = (
        <button
            onClick={() => setMobileView('cart')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 relative
                ${mobileView === 'cart' ? 'bg-primary text-white shadow' : 'bg-slate-100 text-slate-600'}`}
        >
            <ShoppingCart className="h-4 w-4" />
            {checkoutStep === 'payment' ? 'Paiement' : 'Panier'}
            {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] font-black flex items-center justify-center
                    ${mobileView === 'cart' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                    {cartCount}
                </span>
            )}
        </button>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-56px)]">

            {/* ─── MOBILE ──────────────────────────────────────────────── */}
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
                    {cartTab}
                </div>

                <div className="flex-1 overflow-hidden p-3">
                    {mobileView === 'products' ? <ProductsPanel /> : <CartPanel />}
                </div>
            </div>

            {/* ─── DESKTOP ─────────────────────────────────────────────── */}
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
