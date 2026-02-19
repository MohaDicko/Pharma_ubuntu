"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Fingerprint, Shield, Package, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

type Role = 'ADMIN' | 'PHARMACIST' | 'STOCK_MANAGER';

export default function LoginPage() {
    const { login } = useAuth()
    const [isLoading, setIsLoading] = useState<boolean>(false)

    async function handleDemoLogin(role: Role) {
        setIsLoading(true)
        // Simulation d'un délai réseau pour l'effet visuel
        setTimeout(() => {
            login(role)
            setIsLoading(false)
        }, 800)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Sahel Store</CardTitle>
                    <CardDescription>
                        Système de Gestion Pharmaceutique
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email professionnel</Label>
                        <Input id="email" type="email" placeholder="nom@sahel.com" disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input id="password" type="password" disabled={isLoading} />
                    </div>
                    <Button className="w-full h-11 text-lg font-bold" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Se Connecter
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground font-medium">Accès Démo Rapide</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            className="h-11 justify-start font-semibold border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                            disabled={isLoading}
                            onClick={() => handleDemoLogin('ADMIN')}
                        >
                            <Shield className="mr-3 h-5 w-5 text-purple-600" />
                            Administrateur
                        </Button>
                        <Button
                            variant="outline"
                            className="h-11 justify-start font-semibold border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            disabled={isLoading}
                            onClick={() => handleDemoLogin('PHARMACIST')}
                        >
                            <Fingerprint className="mr-3 h-5 w-5 text-blue-600" />
                            Pharmacien (Ventes)
                        </Button>
                        <Button
                            variant="outline"
                            className="h-11 justify-start font-semibold border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
                            disabled={isLoading}
                            onClick={() => handleDemoLogin('STOCK_MANAGER')}
                        >
                            <Package className="mr-3 h-5 w-5 text-orange-600" />
                            Gestionnaire Stock
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <div className="hover:text-primary transition-colors cursor-pointer">Mot de passe oublié ?</div>
                    <div className="mt-4">© 2026 Sahel-Vet Log. Tous droits réservés.</div>
                </CardFooter>
            </Card>
        </div>
    )
}
