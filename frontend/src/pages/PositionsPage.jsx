import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { pipelineApi, positionApi } from '../api/client.js'
import { useAuth } from '../context/useAuth.jsx'

const emptyForm = {
  title: '',
  description: '',
  location: '',
  pipeline_id: '',
  status: 'draft',
}

export function PositionsPage() {
  const { token, activeCompanyId } = useAuth()
  const [positions, setPositions] = useState([])
  const [pipelines, setPipelines] = useState([])
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [applications, setApplications] = useState([])
  const [stageSelections, setStageSelections] = useState({})
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')

  const selectedPosition = positions.find((position) => String(position.id) === String(selectedPositionId))
  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === selectedPosition?.pipeline_id)
  const availableStages = selectedPipeline?.stages ?? []

  useEffect(() => {
    if (!token || !activeCompanyId) {
      return
    }

    let active = true

    Promise.all([
      positionApi.list({ token, companyId: activeCompanyId }),
      pipelineApi.list({ token, companyId: activeCompanyId }),
    ])
      .then(([positionData, pipelineData]) => {
        if (active) {
          const defaultPipeline = pipelineData.find((pipeline) => pipeline.is_default) ?? pipelineData[0]
          setPositions(positionData)
          setPipelines(pipelineData)
          setForm((current) => ({
            ...current,
            pipeline_id: current.pipeline_id || String(defaultPipeline?.id ?? ''),
          }))
          setSelectedPositionId((current) => current || String(positionData[0]?.id ?? ''))
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

  useEffect(() => {
    if (!token || !activeCompanyId || !selectedPositionId) {
      return
    }

    let active = true

    positionApi
      .listApplications({ token, companyId: activeCompanyId, positionId: selectedPositionId })
      .then((data) => {
        if (active) {
          setApplications(data)
          setStageSelections(
            data.reduce((accumulator, application) => {
              accumulator[application.id] = String(application.current_stage_id)
              return accumulator
            }, {}),
          )
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
  }, [token, activeCompanyId, selectedPositionId])

  const reloadPositions = async () => {
    const data = await positionApi.list({ token, companyId: activeCompanyId })
    setPositions(data)
    setSelectedPositionId((current) => current || String(data[0]?.id ?? ''))
    return data
  }

  const handleCreatePosition = async (event) => {
    event.preventDefault()
    try {
      const created = await positionApi.create({
        token,
        companyId: activeCompanyId,
        payload: {
          ...form,
          pipeline_id: Number(form.pipeline_id),
        },
      })
      setMessage('Vacante creada correctamente.')
      setForm((current) => ({ ...emptyForm, pipeline_id: current.pipeline_id }))
      const data = await reloadPositions()
      setSelectedPositionId(String(created.id ?? data[0]?.id ?? ''))
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handlePublish = async (positionId) => {
    try {
      await positionApi.publish({ token, companyId: activeCompanyId, positionId })
      setMessage('Vacante publicada correctamente.')
      await reloadPositions()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleMoveStage = async (applicationId) => {
    const stageId = stageSelections[applicationId]
    if (!stageId) {
      return
    }

    try {
      await positionApi.moveApplicationStage({
        token,
        companyId: activeCompanyId,
        applicationId,
        stageId: Number(stageId),
      })

      const data = await positionApi.listApplications({ token, companyId: activeCompanyId, positionId: selectedPositionId })
      setApplications(data)
      setStageSelections(
        data.reduce((accumulator, application) => {
          accumulator[application.id] = String(application.current_stage_id)
          return accumulator
        }, {}),
      )
      setMessage('Etapa actualizada correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Vacantes</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Operacion interna</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Consulta posiciones de la compania activa y publica las que ya esten listas para salir al portal.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleCreatePosition}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Nueva vacante</h3>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">UI conectada</span>
          </div>

          <div className="mt-6 grid gap-4">
            {pipelines.length === 0 ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
                No hay pipelines disponibles. Crea uno primero en{' '}
                <Link to="/pipelines" className="font-semibold underline">
                  Pipelines
                </Link>
                .
              </div>
            ) : null}
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Titulo" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Descripcion" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Ubicacion" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={form.pipeline_id} onChange={(event) => setForm((current) => ({ ...current, pipeline_id: event.target.value }))} required>
                <option value="">Selecciona un pipeline</option>
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                ))}
              </select>

              <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="draft">draft</option>
                <option value="open">open</option>
                <option value="closed">closed</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={pipelines.length === 0} className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
            Crear vacante
          </button>
        </form>

        <section className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Seguimiento por vacante</h3>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white" value={selectedPositionId} onChange={(event) => setSelectedPositionId(event.target.value)}>
              <option value="">Selecciona una vacante</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>{position.title}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-3">
            {selectedPositionId && applications.length === 0 ? (
              <p className="text-sm text-slate-400">Esta vacante aun no tiene postulaciones.</p>
            ) : null}

            {applications.map((application) => (
              <article key={application.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{application.candidate.full_name}</h4>
                    <p className="mt-1 text-sm text-cyan-200">{application.candidate.email}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    {application.current_stage.name}
                  </span>
                </div>
                {application.notes ? <p className="mt-3 text-sm text-slate-300">{application.notes}</p> : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <select
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
                    value={stageSelections[application.id] ?? String(application.current_stage_id)}
                    onChange={(event) => setStageSelections((current) => ({ ...current, [application.id]: event.target.value }))}
                  >
                    {availableStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleMoveStage(application.id)}
                    disabled={String(stageSelections[application.id] ?? application.current_stage_id) === String(application.current_stage_id)}
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-400"
                  >
                    Mover etapa
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Listado actual</h3>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{positions.length} vacante(s)</span>
        </div>

        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}

        <div className="mt-6 space-y-4">
          {positions.length === 0 ? (
            <p className="text-sm text-slate-400">No hay vacantes en la compania activa todavia.</p>
          ) : (
            positions.map((position) => (
              <article key={position.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">{position.status}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${position.is_public ? 'bg-emerald-400/10 text-emerald-200' : 'bg-slate-400/10 text-slate-300'}`}>
                        {position.is_public ? 'Publicada' : 'Interna'}
                      </span>
                    </div>
                    <h4 className="mt-3 text-xl font-semibold text-white">{position.title}</h4>
                    <p className="mt-1 text-sm text-cyan-200">{position.location}</p>
                    <p className="mt-3 text-sm text-slate-300">{position.description}</p>
                  </div>

                  <div className="lg:w-52">
                    <button
                      type="button"
                      disabled={position.is_public || position.status !== 'open'}
                      onClick={() => handlePublish(position.id)}
                      className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-400"
                    >
                      {position.is_public ? 'Ya publicada' : 'Publicar en portal'}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
