"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Store, Lock, Save } from "lucide-react"
import { PageShell } from "@/components/PageShell"

export default function SettingsPage() {
    return (
        <PageShell>
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
                <p className="text-muted-foreground">
                    Gérez votre pharmacie, vos périphériques et vos préférences.
                </p>
            </div>
            <Separator className="my-6" />

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="w-full sm:w-auto overflow-x-auto flex">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Store className="h-4 w-4" /> Général
                    </TabsTrigger>
                    <TabsTrigger value="hardware" className="flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Matériel
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Sécurité
                    </TabsTrigger>
                </TabsList>

                {/* --- ONGLET GÉNÉRAL --- */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identité de la Pharmacie</CardTitle>
                            <CardDescription>
                                Ces informations apparaîtront sur les tickets de caisse et les factures.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="storeName">Nom de l&apos;établissement</Label>
                                <Input id="storeName" defaultValue="Pharmacie Clinique du Sahel" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input id="phone" defaultValue="+226 70 00 00 00" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="nif">NIF / RCCM</Label>
                                    <Input id="nif" defaultValue="000123456789" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Adresse Complète</Label>
                                <Input id="address" defaultValue="Secteur 01, Rue de la Chance, Ouagadougou" />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button>
                                <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* --- ONGLET MATÉRIEL --- */}
                <TabsContent value="hardware">
                    <Card>
                        <CardHeader>
                            <CardTitle>Imprimantes & Scanners</CardTitle>
                            <CardDescription>
                                Configuration des périphériques de caisse.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Format d&apos;impression Ticket</Label>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="border-primary bg-primary/10">Thermique (80mm)</Button>
                                    <Button variant="outline">Standard (A4)</Button>
                                </div>
                            </div>

                            <div className="rounded-md bg-muted p-4">
                                <div className="flex items-center">
                                    <Printer className="h-6 w-6 mr-4 opacity-50" />
                                    <div>
                                        <p className="text-sm font-medium">Imprimante par défaut</p>
                                        <p className="text-xs text-muted-foreground">Gérée par le navigateur</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button variant="secondary">Tester l&apos;impression</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* --- ONGLET SÉCURITÉ --- */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Politique d&apos;Accès</CardTitle>
                            <CardDescription>
                                Gérez les délais de session et les backups.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Déconnexion automatique</Label>
                                    <p className="text-sm text-muted-foreground">Après 15 minutes d&apos;inactivité</p>
                                </div>
                                {/* Switch simulé faute de composant importé */}
                                <div className="h-6 w-11 rounded-full bg-primary p-1 cursor-pointer"><div className="bg-white h-4 w-4 rounded-full ml-auto"></div></div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Sauvegarde Cloud</Label>
                                    <p className="text-sm text-muted-foreground">Sauvegarder la base chaque nuit</p>
                                </div>
                                <div className="h-6 w-11 rounded-full bg-input p-1 cursor-pointer"><div className="bg-white h-4 w-4 rounded-full"></div></div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </PageShell>
    )
}
