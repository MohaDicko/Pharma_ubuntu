"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, UserPlus, Shield, Trash2, Edit2, MoreHorizontal, Loader2, RefreshCw } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TeamMember {
    id: string
    name: string
    email: string
    role: string
    status: 'ACTIF' | 'INACTIF'
    lastLogin: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Form state for new user
    const [newData, setNewData] = useState({
        name: "",
        email: "",
        password: "",
        role: "CASHIER"
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleAddUser = async () => {
        if (!newData.name || !newData.email || !newData.password) return
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            })
            if (res.ok) {
                setIsAddModalOpen(false)
                setNewData({ name: "", email: "", password: "", role: "CASHIER" })
                fetchUsers()
            } else {
                const err = await res.json()
                alert(err.error || "Erreur")
            }
        } catch (e) {
            console.error(e)
            alert("Erreur réseau")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeactivate = async (id: string) => {
        if (!confirm("Désactiver ce compte ?")) return
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) fetchUsers()
        } catch (e) {
            console.error(e)
        }
    }

    const handleRoleChange = async (id: string, newRole: string) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            })
            if (res.ok) fetchUsers()
        } catch (e) {
            console.error(e)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gestion de l'Équipe</h2>
                    <p className="text-muted-foreground mt-1">
                        Contrôlez les accès et les rôles de votre personnel (Admin, Pharmacien, Caissier).
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={fetchUsers} disabled={loading} className="flex-1 sm:flex-none">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none shadow-lg">
                        <UserPlus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom ou email..."
                        className="pl-9 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle>Liste des Utilisateurs</CardTitle>
                    <CardDescription>Comptes ayant accès à la plateforme.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/30">
                                <TableHead className="w-[80px] pl-6">Personnel</TableHead>
                                <TableHead>Identité & Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Dernière Activité</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center pt-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="text-muted-foreground font-medium">Chargement de l'équipe...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        Aucun membre trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <Avatar className="h-10 w-10 ring-2 ring-primary/5">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-slate-900">{user.name}</div>
                                            <div className="text-xs text-muted-foreground font-medium">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                user.role === 'ADMIN' ? "border-indigo-200 text-indigo-700 bg-indigo-50" :
                                                    user.role === 'PHARMACIST' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 bg-slate-50"
                                            }>
                                                {user.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3" />}
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`flex items-center gap-2 ${user.status === 'ACTIF' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                <div className={`h-2 w-2 rounded-full ${user.status === 'ACTIF' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                <span className="text-xs font-bold uppercase tracking-wider">{user.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs font-medium italic">
                                            {user.lastLogin === 'Jamais' ? 'Jamais connecté' : new Date(user.lastLogin).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 shadow-xl border-slate-200">
                                                    <DropdownMenuLabel>Gestion du compte</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'ADMIN')} className="cursor-pointer">
                                                        <Shield className="mr-2 h-4 w-4 text-indigo-500" /> Passer ADMIN
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'PHARMACIST')} className="cursor-pointer">
                                                        <Shield className="mr-2 h-4 w-4 text-emerald-500" /> Passer PHARMACIEN
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'CASHIER')} className="cursor-pointer">
                                                        <Shield className="mr-2 h-4 w-4 text-slate-500" /> Passer CAISSIER
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeactivate(user.id)} className="text-rose-600 focus:bg-rose-50 cursor-pointer">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Désactiver
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Ajout Utilisateur */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
                        <DialogDescription>
                            Créez un nouvel accès pour votre personnel. Ils pourront se connecter avec leur email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom Complet</Label>
                            <Input
                                id="name"
                                placeholder="p.ex. Safi Konaté"
                                value={newData.name}
                                onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Professionnel</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="safi@ubuntu.com"
                                value={newData.email}
                                onChange={(e) => setNewData({ ...newData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Mot de passe provisoire</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={newData.password}
                                onChange={(e) => setNewData({ ...newData, password: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rôle assigné</Label>
                            <Select
                                value={newData.role}
                                onValueChange={(v) => setNewData({ ...newData, role: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrateur (Tout voir)</SelectItem>
                                    <SelectItem value="PHARMACIST">Pharmacien (Ventes & Stock)</SelectItem>
                                    <SelectItem value="CASHIER">Caissier (Ventes uniquement)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Annuler</Button>
                        <Button onClick={handleAddUser} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Créer le compte
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
