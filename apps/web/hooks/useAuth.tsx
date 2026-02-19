"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { useRouter } from "next/navigation"

type Role = 'ADMIN' | 'PHARMACIST' | 'STOCK_MANAGER';

interface User {
    id: string
    name: string
    email: string
    role: Role
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (role?: Role) => void
    logout: () => void
    hasRole: (roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    hasRole: () => false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const storedRole = typeof window !== 'undefined' ? localStorage.getItem('demo-role') as Role : null
        if (storedRole) {
            setUser({
                id: '1',
                name: 'Jean Drabo (Démo)',
                email: 'jean@sahel.com',
                role: storedRole
            })
        }
        setLoading(false)
    }, [])

    const login = (role: Role = 'ADMIN') => {
        localStorage.setItem('demo-role', role)
        document.cookie = "auth-token=DEMO_TOKEN; path=/; max-age=86400"
        setUser({
            id: '1',
            name: 'Jean Drabo (Démo)',
            email: 'jean@sahel.com',
            role: role
        })
        router.push('/')
    }

    const logout = () => {
        localStorage.removeItem('demo-role')
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        setUser(null)
        router.push('/login')
    }

    const hasRole = (allowedRoles: Role[]) => {
        if (!user) return false
        return allowedRoles.includes(user.role)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
