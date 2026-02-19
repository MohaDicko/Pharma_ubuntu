"use client"

import { useFormState, useFormStatus } from "react-dom"
import { authenticate } from "@/lib/actions"
import { Loader2, Lock, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { CabinetUbuntuLogo } from "@/components/CabinetUbuntuLogo"

function LoginButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full h-11 text-lg font-bold" disabled={pending} type="submit">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se Connecter
        </Button>
    )
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined)

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <CabinetUbuntuLogo className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Cabinet Ubuntu</CardTitle>
                    <CardDescription>
                        Système de Gestion Pharmaceutique
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={dispatch} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email professionnel</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@ubuntu.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        {errorMessage && (
                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <LoginButton />
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <div className="text-xs">
                        Pour tester : <span className="font-mono bg-slate-200 px-1 rounded">admin@ubuntu.com</span> / <span className="font-mono bg-slate-200 px-1 rounded">admin123</span>
                    </div>
                    <div className="mt-4">© 2026 Cabinet Ubuntu. Tous droits réservés.</div>
                </CardFooter>
            </Card>
        </div>
    )
}
