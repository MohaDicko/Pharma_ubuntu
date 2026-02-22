import { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import { ClientLayout } from "./client-layout"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: {
        default: "Cabinet Ubuntu Pharm",
        template: "%s | Ubuntu Pharm"
    },
    description: "Système de Gestion Pharmaceutique Optimisé - Cabinet Ubuntu",
    keywords: ["pharmacie", "gestion de stock", "Mali", "Sahel", "POS", "santé"],
    manifest: "/manifest.json",
    themeColor: "#0ea5e9",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Ubuntu Pharm",
    },
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
