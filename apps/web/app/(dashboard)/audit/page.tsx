"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
    Search,
    Shield,
    History,
    User,
    Info,
    Loader2
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { PageShell } from "@/components/PageShell"

interface AuditEntry {
    id: string;
    action: string;
    timestamp: string;
    details: any;
    user: {
        name: string;
        role: string;
    };
}

export default function AuditPage() {
    const { user } = useAuth()
    const [logs, setLogs] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch('/api/audit')
                if (res.ok) {
                    const data = await res.json()
                    setLogs(data)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.user.name.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-10 w-10 text-primary" /></div>

    return (
        <PageShell>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Journal d&apos;Audit
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Traçabilité complète des actions.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Chercher une action..."
                        className="pl-10 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" /> Actions Récentes
                    </CardTitle>
                    <CardDescription>Journal immuable de toutes les opérations sensibles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="flex gap-4 p-4 rounded-xl border bg-slate-50/50 hover:bg-white transition-all group">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-sm flex items-center gap-2">
                                                    {log.user.name}
                                                    <Badge variant="outline" className="text-[10px] font-normal uppercase">{log.user.role}</Badge>
                                                </div>
                                                <p className="text-sm font-mono text-primary font-semibold">{log.action}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="mt-2 p-3 rounded-lg bg-white border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                                            <Info className="h-3 w-3 mt-0.5 shrink-0 text-blue-400" />
                                            <pre className="font-sans whitespace-pre-wrap">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </PageShell>
    )
}
