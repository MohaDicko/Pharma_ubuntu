"use client"

import DashboardOverview from "@/components/dashboard/DashboardOverview"
import { PageShell } from "@/components/PageShell"

export default function DashboardPage() {
    return (
        <PageShell>
            <DashboardOverview />
        </PageShell>
    )
}
