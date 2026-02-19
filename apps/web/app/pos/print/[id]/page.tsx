"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Receipt } from "@/components/pos/Receipt"
import { Loader2 } from "lucide-react"

interface PrintTransaction {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number }[];
    amount: number;
    paymentMethod: string;
}

export default function PrintReceiptPage() {
    const params = useParams()
    const id = params.id as string
    const [transaction, setTransaction] = useState<PrintTransaction | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        //Charger les détails de la transaction pour impression
        async function fetchTx() {
            try {
                // On réutilise l'API transactions existante (ou on filtre localement si pas d'endpoint unique)
                // Pour l'instant, on va simuler ou adapter l'API transactions pour get by ID
                // Disons qu'on fetch tout et qu'on trouve (pas optimal mais ok pour MVP)
                const res = await fetch('/api/transactions')
                const data = await res.json()
                const tx = data.find((t: PrintTransaction) => t.id === id)

                if (tx) {
                    setTransaction(tx)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchTx()
    }, [id])

    useEffect(() => {
        if (transaction && !loading) {
            // Lancer l'impression automatiquement quand les données sont là
            setTimeout(() => {
                window.print()
            }, 500)
        }
    }, [transaction, loading])

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin mr-2" /> Chargement du Ticket...</div>

    if (!transaction) return <div className="p-10 text-center text-red-500">Transaction introuvable.</div>

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 print:p-0 print:bg-white">
            {/* Bouton retour (caché à l'impression) */}
            <button onClick={() => window.close()} className="fixed top-4 left-4 bg-black text-white px-4 py-2 rounded print:hidden">
                Fermer
            </button>

            <Receipt
                transactionId={transaction.id}
                date={new Date(transaction.date)}
                items={transaction.items}
                total={transaction.amount}
                paymentMethod={transaction.paymentMethod}
                cashierName="Admin"
            />
        </div>
    )
}
