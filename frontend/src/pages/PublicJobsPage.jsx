import { useEffect, useState } from 'react'

import { publicJobsApi } from '../api/client.js'

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  summary: '',
  notes: '',
}

export function PublicJobsPage() {
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    publicJobsApi
      .list()
      .then((data) => {
        if (!active) return
        setJobs(data)
        setSelectedJobId((current) => current || String(data[0]?.id ?? ''))
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      await publicJobsApi.apply({ positionId: selectedJobId, payload: form })
      setForm(emptyForm)
      setMessage('Postulacion enviada correctamente.')
      setStatus('idle')
    } catch (error) {
      setMessage(error.message)
      setStatus('idle')
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Portal publico</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Vacantes publicadas</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Consulta vacantes abiertas y registra una postulacion publica directamente contra el backend real.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Oportunidades abiertas</h3>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">{jobs.length} activa(s)</span>
          </div>

          <div className="mt-6 space-y-4">
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-400">Todavia no hay vacantes publicadas.</p>
            ) : (
              jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(String(job.id))}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                    String(job.id) === selectedJobId
                      ? 'border-cyan-400/40 bg-cyan-400/10'
                      : 'border-white/10 bg-slate-950/35 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <p className="text-lg font-semibold text-white">{job.title}</p>
                  <p className="mt-1 text-sm text-cyan-200">{job.location}</p>
                  <p className="mt-3 text-sm text-slate-300">{job.description}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold text-white">Postularme</h3>
          <p className="mt-2 text-sm text-slate-300">Completa el formulario para crear tu perfil global y tu postulacion a la vacante seleccionada.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Nombre completo" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} required />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Correo" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Telefono" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} required>
              <option value="">Selecciona una vacante</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          <textarea className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Resumen profesional" value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
          <textarea className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Nota adicional" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />

          {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}

          <button type="submit" disabled={status === 'loading' || !selectedJobId} className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
            {status === 'loading' ? 'Enviando...' : 'Enviar postulacion'}
          </button>
        </form>
      </section>
    </div>
  )
}
