"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    ShieldCheck, Plus, Pencil, Power, Loader2, AlertTriangle, Building2, Percent
} from "lucide-react"
import { toast } from "@/components/ui/toast"
import { PageShell } from "@/components/PageShell"

interface Insurance {
    id: string
    name: string
    code: string | null
    percentage: number
    status: 'ACTIF' | 'INACTIF'
    _count?: { transactions: number }
}

const emptyForm = { name: '', code: '', percentage: 70 }

export default function InsurancesPage() {
    const { user } = useAuth()
    const [insurances, setInsurances] = useState<Insurance[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<Insurance | null>(null)
    const [form, setForm] = useState(emptyForm)

    const isAdmin = user?.role === 'ADMIN'

    async function fetchInsurances() {
        setLoading(true)
        try {
            const res = await fetch('/api/insurances')
            if (res.ok) setInsurances(await res.json())
        } catch { toast("Erreur chargement assurances", 'error') }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchInsurances() }, [])

    const openCreate = () => {
        setEditTarget(null)
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (ins: Insurance) => {
        setEditTarget(ins)
        setForm({ name: ins.name, code: ins.code ?? '', percentage: ins.percentage })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) { toast("Le nom est requis", 'warning'); return }
        if (form.percentage < 0 || form.percentage > 100) { toast("Le taux doit être entre 0 et 100", 'warning'); return }
        setSaving(true)
        try {
            const payload = { name: form.name.trim(), code: form.code || undefined, percentage: Number(form.percentage) }
            let res: Response
            if (editTarget) {
                res = await fetch(`/api/insurances/${editTarget.id}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                })
            } else {
                res = await fetch('/api/insurances', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                })
            }
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erreur serveur')

            if (editTarget) {
                setInsurances(prev => prev.map(i => i.id === editTarget.id ? { ...i, ...data } : i))
                toast(`✅ "${data.name}" mis à jour !`, 'success')
            } else {
                setInsurances(prev => [...prev, data])
                toast(`✅ "${data.name}" créée !`, 'success')
            }
            setDialogOpen(false)
        } catch (e) {
            toast((e as Error).message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleStatus = async (ins: Insurance) => {
        const newStatus = ins.status === 'ACTIF' ? 'INACTIF' : 'ACTIF'
        try {
            const res = await fetch(`/api/insurances/${ins.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setInsurances(prev => prev.map(i => i.id === ins.id ? { ...i, status: newStatus } : i))
            toast(`Assurance ${newStatus === 'ACTIF' ? 'activée' : 'désactivée'}`, 'success')
        } catch (e) {
            toast((e as Error).message, 'error')
        }
    }

    const activeCount = insurances.filter(i => i.status === 'ACTIF').length
    const inactiveCount = insurances.filter(i => i.status === 'INACTIF').length

    return (
        <PageShell>
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-indigo-500" />
                        Gestion des Assurances
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Tiers payants, mutuelles et prise en charge.</p>
                </div>
                {isAdmin && (
                    <Button className="gap-2 shadow-md" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Nouvelle Assurance
                    </Button>
                )}
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{insurances.length}</p>
                        <p className="text-xs text-slate-400 mt-1">Assureurs référencés</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actifs</p>
                        <p className="text-3xl font-black text-emerald-700 mt-1">{activeCount}</p>
                        <p className="text-xs text-slate-400 mt-1">Disponibles au POS</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-slate-300 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inactifs</p>
                        <p className="text-3xl font-black text-slate-400 mt-1">{inactiveCount}</p>
                        <p className="text-xs text-slate-400 mt-1">Désactivés</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Table ── */}
            <Card className="border-none shadow-md">
                <CardHeader className="bg-slate-50/50 border-b py-3 px-6">
                    <CardTitle className="text-sm font-bold">Référentiel des Assureurs</CardTitle>
                    <CardDescription className="text-xs">Taux de prise en charge et nombre de transactions associées.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : insurances.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                            <Building2 className="h-10 w-10 text-slate-200" />
                            <span className="text-sm font-medium">Aucune assurance configurée.</span>
                            {isAdmin && <Button size="sm" variant="outline" onClick={openCreate}>Ajouter la première</Button>}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="pl-6">Assureur</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-center">Taux prise en charge</TableHead>
                                    <TableHead className="text-center">Transactions</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    {isAdmin && <TableHead className="text-right pr-6">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {insurances.map((ins) => (
                                    <TableRow key={ins.id} className={`hover:bg-slate-50 ${ins.status === 'INACTIF' ? 'opacity-50' : ''}`}>
                                        <TableCell className="pl-6 font-bold text-slate-900 flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${ins.status === 'ACTIF' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                            {ins.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs text-slate-400">{ins.code ?? '—'}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <div className="w-24 bg-slate-100 rounded-full h-2">
                                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${ins.percentage}%` }} />
                                                </div>
                                                <span className="font-black text-indigo-700 text-sm w-10 text-right">{ins.percentage}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-mono">
                                                {ins._count?.transactions ?? 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={ins.status === 'ACTIF'
                                                ? 'bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-500 border-none hover:bg-slate-100'
                                            }>
                                                {ins.status}
                                            </Badge>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50" onClick={() => openEdit(ins)}>
                                                        <Pencil className="h-3.5 w-3.5 text-indigo-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8"
                                                        onClick={() => handleToggleStatus(ins)}
                                                        title={ins.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                                                    >
                                                        <Power className={`h-3.5 w-3.5 ${ins.status === 'ACTIF' ? 'text-rose-500 hover:text-rose-700' : 'text-emerald-500'}`} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Note informative ── */}
            <Card className="bg-indigo-50 border-indigo-100 shadow-none">
                <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-indigo-800">Comment ça fonctionne ?</p>
                        <p className="text-xs text-indigo-600 mt-1">
                            Lors d&apos;une vente au POS, sélectionnez le mode de paiement <strong>&quot;Assurance&quot;</strong>, puis choisissez l&apos;assureur.
                            Le système calcule automatiquement la part prise en charge et le reste à payer par le patient.
                            Chaque transaction est liée à l&apos;assureur pour un suivi précis du tiers payant.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* ── Modal Créer / Modifier ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-500" />
                            {editTarget ? 'Modifier l\'assurance' : 'Nouvelle assurance'}
                        </DialogTitle>
                        <DialogDescription>
                            {editTarget
                                ? `Modification de "${editTarget.name}"`
                                : 'Ajouter un nouvel assureur ou mutuelle.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="ins-name" className="text-sm font-semibold">Nom de l&apos;assureur *</Label>
                            <Input
                                id="ins-name"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ex: AMU, CNSS, Allianz..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="ins-code" className="text-sm font-semibold">Code interne (optionnel)</Label>
                            <Input
                                id="ins-code"
                                value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                                placeholder="Ex: AMU-BF, CNSS-01..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="ins-pct" className="text-sm font-semibold flex items-center gap-1">
                                <Percent className="h-3.5 w-3.5" /> Taux de prise en charge *
                            </Label>
                            <div className="flex items-center gap-3 mt-1">
                                <Input
                                    id="ins-pct"
                                    type="number"
                                    min={0} max={100}
                                    value={form.percentage}
                                    onChange={e => setForm(f => ({ ...f, percentage: Number(e.target.value) }))}
                                    className="w-24"
                                />
                                <span className="text-slate-500 text-sm font-medium">%</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-2">
                                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, form.percentage)}%` }} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                L&apos;assurance couvre {form.percentage}% — le patient paie {100 - form.percentage}%
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {editTarget ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageShell>
    )
}
