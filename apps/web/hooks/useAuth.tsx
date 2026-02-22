"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"

type Role = 'ADMIN' | 'PHARMACIST' | 'CASHIER';

interface User {
    id: string
    name: string
    email: string
    role: Role
}

interface AuthContextType {
    user: User | null
    loading: boolean
    logout: () => void
    hasRole: (roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => { },
    hasRole: () => false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const [user, setUser] = useState<User | null>(null)
    const loading = status === "loading"
    const router = useRouter()

    useEffect(() => {
        if (session?.user) {
            setUser({
                id: session.user.id || '1',
                name: session.user.name || '',
                email: session.user.email || '',
                role: (session.user as any).role || 'CASHIER'
            })
        } else {
            setUser(null)
        }
    }, [session])

    const logout = async () => {
        await nextAuthSignOut({ redirect: false })
        setUser(null)
        router.push('/login')
        router.refresh()
    }

    const hasRole = (allowedRoles: Role[]) => {
        if (!user) return false
        return allowedRoles.includes(user.role)
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
