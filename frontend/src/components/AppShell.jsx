import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../context/useAuth.jsx'

const navItems = [
  { to: '/dashboard', label: 'Resumen' },
  { to: '/pipelines', label: 'Pipelines' },
  { to: '/positions', label: 'Vacantes' },
  { to: '/candidates', label: 'Candidatos' },
  { to: '/evaluation', label: 'Evaluacion' },
  { to: '/notifications', label: 'Notificaciones' },
  { to: '/jobs', label: 'Portal' },
]

export function AppShell() {
  const { companies, activeCompanyId, selectCompany, logout } = useAuth()

  return (
    <div className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="glass-panel rounded-3xl border border-white/10 p-6 lg:w-80">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Recruitment SaaS</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Panel Operativo</h1>
            <p className="mt-3 text-sm text-slate-300">Gestiona reclutamiento interno y portal publico desde una sola consola.</p>
          </div>

          <label className="mb-3 block text-xs font-medium uppercase tracking-[0.25em] text-slate-400">Compania activa</label>
          <select
            className="mb-8 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
            value={activeCompanyId}
            onChange={(event) => selectCompany(event.target.value)}
          >
            {companies.map((membership) => (
              <option key={membership.company.id} value={membership.company.id}>
                {membership.company.name}
              </option>
            ))}
          </select>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-10 w-full rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
          >
            Cerrar sesion
          </button>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
