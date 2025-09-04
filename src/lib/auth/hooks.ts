'use client'

import { useEffect, useState } from 'react'
import { AuthUser } from './types'

// Hook para acessar dados do usuário autenticado
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Buscar dados do usuário atual
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data?.user || null)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    tenant: user?.tenant,
    logout,
  }
}

// Hook para verificar permissões
export function usePermissions() {
  const { user } = useAuth()

  const can = (permission: string): boolean => {
    if (!user) return false
    
    // Super admin pode tudo
    if (user.role === 'SUPER_ADMIN') return true
    
    // Lógica de permissões específicas
    switch (permission) {
      case 'manage_users':
        return user.role === 'ADMIN'
      case 'view_analytics':
        return user.role === 'ADMIN'
      case 'manage_tenant':
        return user.role === 'ADMIN'
      default:
        return false
    }
  }

  return { can }
}