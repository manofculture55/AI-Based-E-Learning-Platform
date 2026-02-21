/**
 * AuthContext — manages user authentication state across the app.
 *
 * Provides: user (object|null), login(userData, token), logout(), loading (bool)
 * Persists auth state in localStorage (token + user JSON).
 * On app load, checks localStorage for existing session.
 */
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load, check if a token exists and validate it with the backend
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (token && savedUser) {
        try {
          // Temporarily set user to avoid flash of login screen
          setUser(JSON.parse(savedUser))
          
          // Validate token with backend
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!res.ok) {
            throw new Error('Token invalid or expired')
          }
          
          // Update user with fresh data from backend
          const freshUser = await res.json()
          setUser(freshUser)
          localStorage.setItem('user', JSON.stringify(freshUser))
        } catch (err) {
          // Token is invalid, expired, or backend is unreachable in a way that means we should log out
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext)
}
