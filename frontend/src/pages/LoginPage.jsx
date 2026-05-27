import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth.jsx'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, status } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await login(form)
      navigate('/dashboard')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass-panel w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_36%),linear-gradient(160deg,#091120_0%,#111d35_50%,#0b1426_100%)] p-10 lg:block">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/90">Plataforma SaaS</p>
          <h1 className="mt-6 max-w-md text-5xl font-semibold leading-tight text-white">Reclutamiento multiempresa con traza real del proceso.</h1>
          <p className="mt-6 max-w-lg text-base text-slate-300">
            Controla vacantes, candidatos, pipelines, evaluaciones y portal publico desde una interfaz clara,
            sobria y operativa.
          </p>
        </section>

        <section className="p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Acceso interno</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Iniciar sesion</h2>
          <p className="mt-3 text-sm text-slate-300">Usa las credenciales registradas en el backend para entrar al panel.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Correo</label>
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                placeholder="roberto@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Contrasena</label>
              <input
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                placeholder="********"
                required
              />
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'loading' ? 'Validando...' : 'Entrar al panel'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
