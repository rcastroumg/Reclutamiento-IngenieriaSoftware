import { useEffect, useState } from 'react'

import { applicationApi, candidateApi, positionApi } from '../api/client.js'
import { useAuth } from '../context/useAuth.jsx'

const emptyCandidateForm = {
  full_name: '',
  email: '',
  phone: '',
  summary: '',
}

const emptyApplicationForm = {
  candidate_id: '',
  position_id: '',
  notes: '',
}

export function CandidatesPage() {
  const { token, activeCompanyId } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [positions, setPositions] = useState([])
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [candidateApplications, setCandidateApplications] = useState([])
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [documents, setDocuments] = useState([])
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm)
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token || !activeCompanyId) {
      return
    }

    let active = true

    Promise.all([
      candidateApi.list({ token }),
      positionApi.list({ token, companyId: activeCompanyId }),
    ])
      .then(([candidateData, positionData]) => {
        if (!active) return
        setCandidates(candidateData)
        setPositions(positionData)
        setSelectedCandidateId((current) => current || String(candidateData[0]?.id ?? ''))
        setApplicationForm((current) => ({
          ...current,
          candidate_id: current.candidate_id || String(candidateData[0]?.id ?? ''),
          position_id: current.position_id || String(positionData[0]?.id ?? ''),
        }))
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [token, activeCompanyId])

  useEffect(() => {
    if (!token || !selectedCandidateId) {
      return
    }

    let active = true

    candidateApi
      .listApplications({ token, candidateId: selectedCandidateId })
      .then((data) => {
        if (!active) return
        setCandidateApplications(data)
        setSelectedApplicationId((current) => current || String(data[0]?.id ?? ''))
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [token, selectedCandidateId])

  useEffect(() => {
    if (!token || !activeCompanyId || !selectedApplicationId) {
      return
    }

    let active = true

    applicationApi
      .listDocuments({ token, companyId: activeCompanyId, applicationId: selectedApplicationId })
      .then((data) => {
        if (!active) return
        setDocuments(data)
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [token, activeCompanyId, selectedApplicationId])

  const reloadCandidates = async () => {
    const data = await candidateApi.list({ token })
    setCandidates(data)
    return data
  }

  const handleCreateCandidate = async (event) => {
    event.preventDefault()
    try {
      const created = await candidateApi.create({ token, payload: candidateForm })
      const data = await reloadCandidates()
      setCandidateForm(emptyCandidateForm)
      setSelectedCandidateId(String(created.id ?? data[0]?.id ?? ''))
      setApplicationForm((current) => ({
        ...current,
        candidate_id: String(created.id ?? data[0]?.id ?? ''),
      }))
      setMessage('Candidato creado correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleCreateApplication = async (event) => {
    event.preventDefault()
    try {
      await applicationApi.create({
        token,
        companyId: activeCompanyId,
        payload: {
          candidate_id: Number(applicationForm.candidate_id),
          position_id: Number(applicationForm.position_id),
          notes: applicationForm.notes,
        },
      })
      setApplicationForm((current) => ({ ...current, notes: '' }))
      setMessage('Postulacion interna creada correctamente.')
      setSelectedCandidateId(applicationForm.candidate_id)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleUploadDocument = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedApplicationId) {
      return
    }

    try {
      await applicationApi.uploadDocument({
        token,
        companyId: activeCompanyId,
        applicationId: selectedApplicationId,
        file,
      })
      const data = await applicationApi.listDocuments({ token, companyId: activeCompanyId, applicationId: selectedApplicationId })
      setDocuments(data)
      setMessage('Documento cargado correctamente.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Candidatos</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Base global y postulacion interna</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Gestiona candidatos reutilizables en todo el sistema y asocialos manualmente a vacantes sin depender
          del portal publico.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleCreateCandidate}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Nuevo candidato</h3>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">Global</span>
          </div>

          <div className="mt-6 grid gap-4">
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Nombre completo" value={candidateForm.full_name} onChange={(event) => setCandidateForm((current) => ({ ...current, full_name: event.target.value }))} required />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Correo" type="email" value={candidateForm.email} onChange={(event) => setCandidateForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Telefono" value={candidateForm.phone} onChange={(event) => setCandidateForm((current) => ({ ...current, phone: event.target.value }))} />
            <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Resumen profesional" value={candidateForm.summary} onChange={(event) => setCandidateForm((current) => ({ ...current, summary: event.target.value }))} />
          </div>

          <button type="submit" className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Crear candidato
          </button>
        </form>

        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleCreateApplication}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Asociar a vacante</h3>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Operacion interna</span>
          </div>

          <div className="mt-6 grid gap-4">
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={applicationForm.candidate_id} onChange={(event) => setApplicationForm((current) => ({ ...current, candidate_id: event.target.value }))} required>
              <option value="">Selecciona un candidato</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
              ))}
            </select>

            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={applicationForm.position_id} onChange={(event) => setApplicationForm((current) => ({ ...current, position_id: event.target.value }))} required>
              <option value="">Selecciona una vacante</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>{position.title}</option>
              ))}
            </select>

            <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Notas de la postulacion" value={applicationForm.notes} onChange={(event) => setApplicationForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>

          <button type="submit" className="mt-6 w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300">
            Crear postulacion interna
          </button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Detalle de candidato</h3>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white" value={selectedCandidateId} onChange={(event) => setSelectedCandidateId(event.target.value)}>
              <option value="">Selecciona un candidato</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-3">
            {candidateApplications.length === 0 && selectedCandidateId ? (
              <p className="text-sm text-slate-400">Este candidato aun no tiene postulaciones registradas.</p>
            ) : null}

            {candidateApplications.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => setSelectedApplicationId(String(application.id))}
                className={`block w-full rounded-2xl border p-4 text-left transition ${
                  String(application.id) === String(selectedApplicationId)
                    ? 'border-cyan-400/40 bg-cyan-400/10'
                    : 'border-white/10 bg-slate-950/35 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{application.position.title}</h4>
                    <p className="mt-1 text-sm text-cyan-200">{application.position.location}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">{application.current_stage.name}</span>
                </div>
                {application.notes ? <p className="mt-3 text-sm text-slate-300">{application.notes}</p> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Documentos de la postulacion</h3>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{documents.length} archivo(s)</span>
          </div>

          <label className="mt-6 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-4 py-6 text-sm text-cyan-200 transition hover:bg-cyan-400/10">
            <input type="file" className="hidden" onChange={handleUploadDocument} />
            Cargar documento para la postulacion seleccionada
          </label>

          <div className="mt-6 space-y-3">
            {selectedApplicationId && documents.length === 0 ? (
              <p className="text-sm text-slate-400">Aun no hay documentos cargados para esta postulacion.</p>
            ) : null}

            {documents.map((document) => (
              <article key={document.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <h4 className="text-sm font-semibold text-white">{document.original_filename}</h4>
                <p className="mt-2 text-xs text-cyan-200">{document.content_type}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Candidatos globales</h3>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{candidates.length} candidato(s)</span>
        </div>

        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {candidates.length === 0 ? (
            <p className="text-sm text-slate-400">Todavia no hay candidatos registrados.</p>
          ) : (
            candidates.map((candidate) => (
              <article key={candidate.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <h4 className="text-lg font-semibold text-white">{candidate.full_name}</h4>
                <p className="mt-2 text-sm text-cyan-200">{candidate.email}</p>
                <p className="mt-2 text-sm text-slate-300">{candidate.phone || 'Sin telefono registrado'}</p>
                {candidate.summary ? <p className="mt-3 text-sm text-slate-300">{candidate.summary}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
