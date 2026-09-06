import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api, { clearTokens, getTokens, saveTokens } from '../api/client'
import { TokenResponse, User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: TokenResponse) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const resp = await api.get<User>('/users/me')
      setUser(resp.data)
    } catch {
      setUser(null)
      clearTokens()
    }
  }

  useEffect(() => {
    const tokens = getTokens()
    if (tokens) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    const onLogout = () => {
      clearTokens()
      setUser(null)
    }
    window.addEventListener('jartest:logout', onLogout)
    return () => window.removeEventListener('jartest:logout', onLogout)
  }, [])

  useEffect(() => {
    if (
      user &&
      !user.perfil_completo &&
      !window.location.pathname.startsWith('/perfil') &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/contrato') &&
      !window.location.pathname.startsWith('/verificar-email')
    ) {
      window.history.replaceState({}, '', '/perfil')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [user])

  const login = (data: TokenResponse) => {
    saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
    setUser(data.user)
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
