import { useCallback, useEffect, useMemo, useState } from 'react'

import { AUTH_UNAUTHORIZED_EVENT, authApi, companyApi } from '../api/client.js'
import { AuthContext } from './auth-context.js'

const AUTH_STORAGE_KEY = 'recruitment-frontend-auth'

function readStoredSession() {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  return raw ? JSON.parse(raw) : { token: '', companies: [], activeCompanyId: '' }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  }, [session])

  const logout = useCallback(() => {
    setSession({ token: '', companies: [], activeCompanyId: '' })
    setStatus('idle')
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [logout])

  const login = useCallback(async (credentials) => {
    setStatus('loading')
    try {
      const tokenPayload = await authApi.login(credentials)
      const companies = await companyApi.listMine(tokenPayload.access_token)
      const activeCompanyId = companies[0]?.company.id ? String(companies[0].company.id) : ''

      setSession({ token: tokenPayload.access_token, companies, activeCompanyId })
      setStatus('authenticated')
      return { token: tokenPayload.access_token, companies, activeCompanyId }
    } catch (error) {
      setStatus('idle')
      throw error
    }
  }, [])

  const createCompany = useCallback(async (payload) => {
    const createdCompany = await companyApi.create({ token: session.token, payload })
    const companies = await companyApi.listMine(session.token)
    const activeCompanyId = String(createdCompany.id)

    setSession((current) => ({
      ...current,
      companies,
      activeCompanyId,
    }))

    return { createdCompany, companies, activeCompanyId }
  }, [session.token])

  const selectCompany = useCallback((companyId) => {
    setSession((current) => ({ ...current, activeCompanyId: String(companyId) }))
  }, [])

  const value = useMemo(
    () => ({
      ...session,
      isAuthenticated: Boolean(session.token),
      status,
      login,
      createCompany,
      logout,
      selectCompany,
    }),
    [session, status, login, createCompany, logout, selectCompany],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
