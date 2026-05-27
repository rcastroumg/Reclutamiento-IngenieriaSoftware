import { useState } from 'react'

import { useAuth } from '../context/useAuth.jsx'

export function DashboardPage() {
  const { companies, activeCompanyId, createCompany } = useAuth()
  const activeCompany = companies.find((item) => String(item.company.id) === String(activeCompanyId))
  const [form, setForm] = useState({ name: '', slug: '' })
  const [message, setMessage] = useState('')

  const handleCreateCompany = async (event) => {
    event.preventDefault()

    try {
      await createCompany(form)
      setForm({ name: '', slug: '' })
      setMessage('Compania creada correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Resumen</p>
        <h2 className="mt-4 text-4xl font-semibold text-white">{activeCompany?.company.name ?? 'Sin compania activa'}</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Este panel ya esta conectado al backend real. Desde aqui iremos expandiendo vacantes, candidatos,
          evaluaciones y operacion publica sin rehacer la arquitectura base.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleCreateCompany}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Crear compania</h3>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Paso inicial</span>
          </div>

          <p className="mt-3 text-sm text-slate-300">Antes de operar vacantes, pipelines y evaluaciones, registra al menos una compania.</p>

          <div className="mt-6 grid gap-4">
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white"
              placeholder="Nombre de la compania"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white"
              placeholder="Slug"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              required
            />
          </div>

          <button type="submit" className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Guardar compania
          </button>
        </form>

        <section className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Companias disponibles</h3>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{companies.length} compania(s)</span>
          </div>

          {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}

          <div className="mt-6 space-y-3">
            {companies.length === 0 ? (
              <p className="text-sm text-slate-400">Todavia no has creado ninguna compania.</p>
            ) : (
              companies.map((membership) => (
                <article key={membership.company.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <h4 className="text-lg font-semibold text-white">{membership.company.name}</h4>
                  <p className="mt-2 text-sm text-cyan-200">{membership.company.slug}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">Rol: {membership.role}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Multiempresa', `${companies.length} compania(s) cargadas`],
          ['Seguridad', 'JWT y compania activa listos'],
          ['Portal publico', 'Vacantes publicadas conectables'],
        ].map(([title, value]) => (
          <article key={title} className="glass-panel rounded-3xl border border-white/10 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{title}</p>
            <p className="mt-3 text-xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
