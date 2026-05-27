import { useEffect, useMemo, useState } from 'react'

import { positionApi, questionnaireApi, scorecardApi } from '../api/client.js'
import { useAuth } from '../context/useAuth.jsx'

const emptyQuestionnaireForm = {
  name: '',
  question: '',
}

const emptyTemplateForm = {
  name: '',
  criterion: '',
}

function buildScores(template) {
  return (template?.criteria ?? []).reduce((accumulator, criterion) => {
    accumulator[criterion.id] = { score: 3, comment: '' }
    return accumulator
  }, {})
}

export function EvaluationPage() {
  const { token, activeCompanyId } = useAuth()
  const [positions, setPositions] = useState([])
  const [questionnaires, setQuestionnaires] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [applications, setApplications] = useState([])
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [scorecards, setScorecards] = useState([])
  const [questionnaireForm, setQuestionnaireForm] = useState(emptyQuestionnaireForm)
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm)
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [scores, setScores] = useState({})
  const [message, setMessage] = useState('')

  const selectedTemplate = useMemo(
    () => templates.find((template) => String(template.id) === String(selectedTemplateId)),
    [templates, selectedTemplateId],
  )

  useEffect(() => {
    if (!token || !activeCompanyId) {
      return
    }

    let active = true

    Promise.all([
      positionApi.list({ token, companyId: activeCompanyId }),
      questionnaireApi.list({ token, companyId: activeCompanyId }),
      scorecardApi.listTemplates({ token, companyId: activeCompanyId }),
    ])
      .then(([positionData, questionnaireData, templateData]) => {
        if (!active) return
        setPositions(positionData)
        setQuestionnaires(questionnaireData)
        setTemplates(templateData)
        setSelectedPositionId((current) => current || String(positionData[0]?.id ?? ''))
        setSelectedQuestionnaireId((current) => current || String(questionnaireData[0]?.id ?? ''))
        setSelectedTemplateId((current) => current || String(templateData[0]?.id ?? ''))
        setScores(buildScores(templateData[0]))
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
    if (!token || !activeCompanyId || !selectedPositionId) {
      return
    }

    let active = true

    positionApi
      .listApplications({ token, companyId: activeCompanyId, positionId: selectedPositionId })
      .then((data) => {
        if (!active) return
        setApplications(data)
        setSelectedApplicationId((current) => current || String(data[0]?.id ?? ''))
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [token, activeCompanyId, selectedPositionId])

  useEffect(() => {
    if (!token || !activeCompanyId || !selectedApplicationId) {
      return
    }

    let active = true

    Promise.all([
      questionnaireApi.listAssignments({ token, companyId: activeCompanyId, applicationId: selectedApplicationId }),
      scorecardApi.listByApplication({ token, companyId: activeCompanyId, applicationId: selectedApplicationId }),
    ])
      .then(([assignmentData, scorecardData]) => {
        if (!active) return
        setAssignments(assignmentData)
        setScorecards(scorecardData)
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [token, activeCompanyId, selectedApplicationId])

  const handleCreateQuestionnaire = async (event) => {
    event.preventDefault()
    try {
      const created = await questionnaireApi.create({
        token,
        companyId: activeCompanyId,
        payload: {
          name: questionnaireForm.name,
          questions: [{ prompt: questionnaireForm.question, order_index: 1 }],
        },
      })
      const data = await questionnaireApi.list({ token, companyId: activeCompanyId })
      setQuestionnaires(data)
      setQuestionnaireForm(emptyQuestionnaireForm)
      setSelectedQuestionnaireId(String(created.id ?? data[0]?.id ?? ''))
      setMessage('Cuestionario creado correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleCreateTemplate = async (event) => {
    event.preventDefault()
    try {
      const created = await scorecardApi.createTemplate({
        token,
        companyId: activeCompanyId,
        payload: {
          name: templateForm.name,
          criteria: [{ name: templateForm.criterion, order_index: 1 }],
        },
      })
      const data = await scorecardApi.listTemplates({ token, companyId: activeCompanyId })
      setTemplates(data)
      setTemplateForm(emptyTemplateForm)
      setSelectedTemplateId(String(created.id ?? data[0]?.id ?? ''))
      setScores(buildScores(created))
      setMessage('Plantilla de scorecard creada correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleAssignQuestionnaire = async () => {
    try {
      await questionnaireApi.assign({
        token,
        companyId: activeCompanyId,
        payload: {
          application_id: Number(selectedApplicationId),
          questionnaire_id: Number(selectedQuestionnaireId),
        },
      })
      const data = await questionnaireApi.listAssignments({ token, companyId: activeCompanyId, applicationId: selectedApplicationId })
      setAssignments(data)
      setMessage('Cuestionario asignado correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleSubmitScorecard = async () => {
    try {
      await scorecardApi.submit({
        token,
        companyId: activeCompanyId,
        payload: {
          application_id: Number(selectedApplicationId),
          scorecard_template_id: Number(selectedTemplateId),
          items: Object.entries(scores).map(([criterionId, value]) => ({
            criterion_id: Number(criterionId),
            score: Number(value.score),
            comment: value.comment,
          })),
        },
      })
      const data = await scorecardApi.listByApplication({ token, companyId: activeCompanyId, applicationId: selectedApplicationId })
      setScorecards(data)
      setMessage('Scorecard registrado correctamente.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Evaluacion</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Cuestionarios y scorecards</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Configura instrumentos de evaluacion y aplicalos a postulaciones reales desde una sola pantalla.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleCreateQuestionnaire}>
          <h3 className="text-xl font-semibold text-white">Nuevo cuestionario</h3>
          <div className="mt-6 grid gap-4">
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Nombre del cuestionario" value={questionnaireForm.name} onChange={(event) => setQuestionnaireForm((current) => ({ ...current, name: event.target.value }))} required />
            <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Pregunta base" value={questionnaireForm.question} onChange={(event) => setQuestionnaireForm((current) => ({ ...current, question: event.target.value }))} required />
          </div>
          <button type="submit" className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Crear cuestionario</button>
        </form>

        <form className="glass-panel rounded-3xl border border-white/10 p-6" onSubmit={handleCreateTemplate}>
          <h3 className="text-xl font-semibold text-white">Nueva plantilla de scorecard</h3>
          <div className="mt-6 grid gap-4">
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Nombre de la plantilla" value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} required />
            <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Criterio inicial" value={templateForm.criterion} onChange={(event) => setTemplateForm((current) => ({ ...current, criterion: event.target.value }))} required />
          </div>
          <button type="submit" className="mt-6 w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300">Crear plantilla</button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={selectedPositionId} onChange={(event) => setSelectedPositionId(event.target.value)}>
            <option value="">Selecciona una vacante</option>
            {positions.map((position) => <option key={position.id} value={position.id}>{position.title}</option>)}
          </select>
          <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={selectedApplicationId} onChange={(event) => setSelectedApplicationId(event.target.value)}>
            <option value="">Selecciona una postulacion</option>
            {applications.map((application) => <option key={application.id} value={application.id}>{application.candidate.full_name}</option>)}
          </select>
          {message ? <p className="flex items-center text-sm text-cyan-200">{message}</p> : <div />}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Asignar cuestionario</h3>
            <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white" value={selectedQuestionnaireId} onChange={(event) => setSelectedQuestionnaireId(event.target.value)}>
              <option value="">Selecciona un cuestionario</option>
              {questionnaires.map((questionnaire) => <option key={questionnaire.id} value={questionnaire.id}>{questionnaire.name}</option>)}
            </select>
          </div>
          <button type="button" onClick={handleAssignQuestionnaire} disabled={!selectedApplicationId || !selectedQuestionnaireId} className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">Asignar a postulacion</button>
          <div className="mt-6 space-y-3">
            {assignments.map((assignment) => (
              <article key={assignment.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">Asignacion #{assignment.id}</p>
                <p className="mt-2 text-xs text-cyan-200">Cuestionario: {assignment.questionnaire_id}</p>
                <p className="mt-1 text-xs text-slate-300">Estado: {assignment.status}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Registrar scorecard</h3>
            <select
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
              value={selectedTemplateId}
              onChange={(event) => {
                const nextTemplateId = event.target.value
                setSelectedTemplateId(nextTemplateId)
                setScores(buildScores(templates.find((template) => String(template.id) === String(nextTemplateId))))
              }}
            >
              <option value="">Selecciona una plantilla</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {(selectedTemplate?.criteria ?? []).map((criterion) => (
              <div key={criterion.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">{criterion.name}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
                  <select className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" value={scores[criterion.id]?.score ?? 3} onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: { ...current[criterion.id], score: Number(event.target.value) } }))}>
                    {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <input className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white" placeholder="Comentario" value={scores[criterion.id]?.comment ?? ''} onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: { ...current[criterion.id], comment: event.target.value } }))} />
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleSubmitScorecard} disabled={!selectedApplicationId || !selectedTemplateId} className="mt-6 w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">Guardar scorecard</button>

          <div className="mt-6 space-y-3">
            {scorecards.map((scorecard) => (
              <article key={scorecard.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-sm font-semibold text-white">Scorecard #{scorecard.id}</p>
                <p className="mt-2 text-xs text-cyan-200">Plantilla: {scorecard.scorecard_template_id}</p>
                <p className="mt-1 text-xs text-slate-300">Items: {scorecard.items.length}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
