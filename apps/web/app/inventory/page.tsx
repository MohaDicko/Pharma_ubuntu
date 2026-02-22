"use client"

import InventoryManager from "@/components/inventory/InventoryManager"
import { PageShell } from "@/components/PageShell"

export default function InventoryPage() {
    return (
        <PageShell>
            <InventoryManager />
        </PageShell>
    )
}
