"use client"

import TransactionsList from "@/components/transactions/TransactionsList"
import { PageShell } from "@/components/PageShell"

export default function TransactionsPage() {
    return (
        <PageShell>
            <TransactionsList />
        </PageShell>
    )
}
