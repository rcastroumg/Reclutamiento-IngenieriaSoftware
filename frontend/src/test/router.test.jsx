import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { AppShell } from '../components/AppShell.jsx'
import { ProtectedRoute } from '../components/ProtectedRoute.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'

function seedSession() {
  window.localStorage.setItem(
    'recruitment-frontend-auth',
    JSON.stringify({
      token: 'token-demo',
      activeCompanyId: '10',
      companies: [{ company: { id: 10, name: 'Recruitment Solutions' }, role: 'admin' }],
    }),
  )
}

describe('frontend shell', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('redirects unauthenticated users away from protected areas', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <ProtectedRoute>
            <div>Zona privada</div>
          </ProtectedRoute>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.queryByText('Zona privada')).not.toBeInTheDocument()
  })

  it('renders company selector and navigation for authenticated users', () => {
    seedSession()

    render(
      <AuthProvider>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByText('Panel Operativo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Recruitment Solutions')).toBeInTheDocument()
    expect(screen.getByText('Pipelines')).toBeInTheDocument()
    expect(screen.getByText('Vacantes')).toBeInTheDocument()
  })
})
