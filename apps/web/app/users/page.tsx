"use client"

import { useState } from "react"
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
import { Search, UserPlus, Shield, Trash2, Edit2, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Pour l'instant, données statiques simulées
const initialUsers = [
    { id: 1, name: "Jean Drabo", email: "jean@sahel.com", role: "ADMIN", status: "ACTIF", lastLogin: "2 min" },
    { id: 2, name: "Aïcha Koné", email: "aicha@sahel.com", role: "PHARMACIST", status: "ACTIF", lastLogin: "Hier" },
    { id: 3, name: "Moussa Sawadogo", email: "moussa@sahel.com", role: "STOCK_MANAGER", status: "INACTIF", lastLogin: "Juin 2025" },
]

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredUsers = initialUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestion de l&apos;Équipe</h2>
                    <p className="text-muted-foreground">
                        Contrôlez les accès et les rôles de votre personnel.
                    </p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ajouter un Membre
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un employé..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des Utilisateurs</CardTitle>
                    <CardDescription>Comptes actifs sur la plateforme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead>Identité</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Dernière Connexion</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {user.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            user.role === 'ADMIN' ? "border-purple-500 text-purple-700 bg-purple-50" :
                                                user.role === 'PHARMACIST' ? "border-blue-500 text-blue-700 bg-blue-50" : "border-slate-500"
                                        }>
                                            {user.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3" />}
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`flex items-center gap-2 ${user.status === 'ACTIF' ? 'text-green-600' : 'text-slate-400'}`}>
                                            <div className={`h-2 w-2 rounded-full ${user.status === 'ACTIF' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                            <span className="text-sm font-medium">{user.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {user.lastLogin}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Ouvrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem><Edit2 className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                                                <DropdownMenuItem><Shield className="mr-2 h-4 w-4" /> Changer Rôle</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Désactiver</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
