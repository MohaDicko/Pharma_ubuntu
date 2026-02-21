"use client"

import { useActionState } from "react"
import { authenticate } from "@/lib/actions"
import { Loader2, Lock, Mail, ChevronRight, ShieldCheck, HeartPulse } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CabinetUbuntuLogo } from "@/components/CabinetUbuntuLogo"

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl" />

            <div className="w-full max-w-[1000px] grid md:grid-cols-2 gap-0 overflow-hidden bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-10 mx-4">

                {/* Left Side: Illustration & Vision */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-white relative">
                    <div className="space-y-6">
                        <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md">
                            <HeartPulse className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold leading-tight">
                            Gérez votre pharmacie avec précision et humanité.
                        </h1>
                        <p className="text-blue-100 text-lg">
                            Le système CPMS (Cabinet Pharmaceutical Management System) aide les professionnels de santé à optimiser leurs stocks et sécuriser leurs ventes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            <ShieldCheck className="h-6 w-6 text-blue-200" />
                            <div className="text-sm">
                                <p className="font-semibold text-white">Sécurité Maximale</p>
                                <p className="text-blue-200/80 text-xs">Accès sécurisé pour chaque rôle du cabinet.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-8 md:p-14 flex flex-col justify-center">
                    <div className="mb-10 text-center md:text-left">
                        <div className="flex justify-center md:justify-start mb-6">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <CabinetUbuntuLogo className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Bienvenue</h2>
                        <p className="text-slate-500 mt-2">Identifiez-vous pour accéder au Sahel CPMS</p>
                    </div>

                    <form action={dispatch} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-medium">Email professionnel</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="safi@ubuntu.com"
                                    className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700 font-medium">Mot de passe</Label>
                                <button type="button" className="text-xs text-primary font-semibold hover:underline">Oublié ?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                <p className="font-medium">{errorMessage}</p>
                            </div>
                        )}

                        <Button
                            className="w-full h-12 text-lg font-bold rounded-xl shadow-[0_10px_20px_rgba(var(--primary-rgb),0.3)] hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
                            disabled={isPending}
                            type="submit"
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Se Connecter
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            CABINET UBUNTU — SYSTÈME DE GESTION V1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
