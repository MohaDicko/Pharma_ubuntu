import { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import { ClientLayout } from "./client-layout"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: {
        default: "Sahel Store - Gestion Pharmaceutique",
        template: "%s | Sahel Store"
    },
    description: "Système intelligent de gestion de stock et point de vente pour pharmacies cliniques en Afrique de l'Ouest.",
    keywords: ["pharmacie", "gestion de stock", "Sahel", "CPMS", "POS", "santé"],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr" className="h-full">
            <body className={`${inter.className} h-full bg-background font-sans antialiased`}>
                <Providers>
                    <ClientLayout>
                        {children}
                    </ClientLayout>
                </Providers>
            </body>
        </html>
    )
}
