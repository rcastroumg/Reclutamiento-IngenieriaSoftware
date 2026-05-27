import { useEffect, useState } from 'react'

import { pipelineApi } from '../api/client.js'
import { useAuth } from '../context/useAuth.jsx'

const emptyStage = { name: '', order_index: 1 }

export function PipelinesPage() {
  const { token, activeCompanyId } = useAuth()
  const [pipelines, setPipelines] = useState([])
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    is_default: false,
    stages: [{ ...emptyStage }],
  })

  useEffect(() => {
    if (!token || !activeCompanyId) {
      return
    }

    let active = true

    pipelineApi
      .list({ token, companyId: activeCompanyId })
      .then((data) => {
        if (active) {
          setPipelines(data)
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message)
        }
      })

    return () => {
      active = false
    }
  }, [token, activeCompanyId])

  const reloadPipelines = async () => {
    const data = await pipelineApi.list({ token, companyId: activeCompanyId })
    setPipelines(data)
    return data
  }

  const updateStage = (index, key, value) => {
    setForm((current) => ({
      ...current,
      stages: current.stages.map((stage, stageIndex) => (
        stageIndex === index ? { ...stage, [key]: value } : stage
      )),
    }))
  }

  const addStage = () => {
    setForm((current) => ({
      ...current,
      stages: [...current.stages, { name: '', order_index: current.stages.length + 1 }],
    }))
  }

  const removeStage = (index) => {
    setForm((current) => ({
      ...current,
      stages: current.stages
        .filter((_, stageIndex) => stageIndex !== index)
        .map((stage, stageIndex) => ({ ...stage, order_index: stageIndex + 1 })),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await pipelineApi.create({
        token,
        companyId: activeCompanyId,
        payload: {
          name: form.name,
          is_default: form.is_default,
          stages: form.stages.map((stage, index) => ({
            name: stage.name,
            order_index: index + 1,
          })),
        },
      })
      await reloadPipelines()
      setForm({ name: '', is_default: false, stages: [{ ...emptyStage }] })
      setMessage('Pipeline creado correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Pipelines</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Configuracion del proceso</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Define los pipelines y sus etapas antes de crear vacantes para que el flujo de reclutamiento nazca correctamente.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Nuevo pipeline</h3>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Requerido para vacantes</span>
          </div>

          <div className="mt-6 grid gap-4">
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white"
              placeholder="Nombre del pipeline"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(event) => setForm((current) => ({ ...current, is_default: event.target.checked }))}
              />
              Marcar como pipeline por defecto
            </label>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Etapas</h4>
              <button type="button" onClick={addStage} className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200">
                Agregar etapa
              </button>
            </div>

            {form.stages.map((stage, index) => (
              <div key={`${index}-${stage.order_index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:grid-cols-[1fr_110px_auto]">
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                  placeholder={`Etapa ${index + 1}`}
                  value={stage.name}
                  onChange={(event) => updateStage(index, 'name', event.target.value)}
                  required
                />
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white"
                  type="number"
                  min="1"
                  value={index + 1}
                  readOnly
                />
                <button
                  type="button"
                  disabled={form.stages.length === 1}
                  onClick={() => removeStage(index)}
                  className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-400"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <button type="submit" className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Guardar pipeline
          </button>
        </form>

        <section className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Pipelines disponibles</h3>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{pipelines.length} pipeline(s)</span>
          </div>

          {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}

          <div className="mt-6 space-y-4">
            {pipelines.length === 0 ? (
              <p className="text-sm text-slate-400">Todavia no hay pipelines registrados para la compania activa.</p>
            ) : (
              pipelines.map((pipeline) => (
                <article key={pipeline.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-lg font-semibold text-white">{pipeline.name}</h4>
                    {pipeline.is_default ? (
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">default</span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pipeline.stages
                      .slice()
                      .sort((left, right) => left.order_index - right.order_index)
                      .map((stage) => (
                        <span key={stage.id} className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
                          {stage.order_index}. {stage.name}
                        </span>
                      ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  )
}
