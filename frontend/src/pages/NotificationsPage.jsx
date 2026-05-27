import { useEffect, useState } from 'react'

import { applicationApi, positionApi } from '../api/client.js'
import { useAuth } from '../context/useAuth.jsx'

export function NotificationsPage() {
  const { token, activeCompanyId } = useAuth()
  const [positions, setPositions] = useState([])
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [applications, setApplications] = useState([])
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [notifications, setNotifications] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token || !activeCompanyId) return

    let active = true

    positionApi
      .list({ token, companyId: activeCompanyId })
      .then((data) => {
        if (!active) return
        setPositions(data)
        setSelectedPositionId((current) => current || String(data[0]?.id ?? ''))
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
    if (!token || !activeCompanyId || !selectedPositionId) return

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
    if (!token || !activeCompanyId || !selectedApplicationId) return

    let active = true

    applicationApi
      .listNotifications({ token, companyId: activeCompanyId, applicationId: selectedApplicationId })
      .then((data) => {
        if (!active) return
        setNotifications(data)
      })
      .catch((error) => {
        if (!active) return
        setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [token, activeCompanyId, selectedApplicationId])

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Notificaciones</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">Trazabilidad de correo por postulacion</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Consulta el historial de notificaciones enviadas o fallidas por cada candidatura para entender el estado operativo real.</p>
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

      <section className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Historial de notificaciones</h3>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{notifications.length} evento(s)</span>
        </div>

        <div className="mt-6 space-y-3">
          {selectedApplicationId && notifications.length === 0 ? (
            <p className="text-sm text-slate-400">Aun no hay notificaciones registradas para esta postulacion.</p>
          ) : null}

          {notifications.map((notification) => (
            <article key={notification.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">{notification.event_name}</h4>
                  <p className="mt-1 text-xs text-cyan-200">{notification.recipient}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${notification.status === 'sent' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-rose-400/10 text-rose-200'}`}>
                  {notification.status}
                </span>
              </div>
              {notification.error_message ? <p className="mt-3 text-sm text-rose-200">{notification.error_message}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
