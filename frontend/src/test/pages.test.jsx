import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CandidatesPage } from '../pages/CandidatesPage.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { EvaluationPage } from '../pages/EvaluationPage.jsx'
import { NotificationsPage } from '../pages/NotificationsPage.jsx'
import { PipelinesPage } from '../pages/PipelinesPage.jsx'
import { PositionsPage } from '../pages/PositionsPage.jsx'
import { PublicJobsPage } from '../pages/PublicJobsPage.jsx'
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

describe('frontend business pages', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads internal positions and allows publishing', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, title: 'Backend Developer', description: 'APIs', location: 'Guatemala', pipeline_id: 1, status: 'open', is_public: false }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, name: 'Pipeline General', is_default: true, stages: [{ id: 1, name: 'Aplicado', order_index: 1 }] }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, title: 'Backend Developer', description: 'APIs', location: 'Guatemala', pipeline_id: 1, status: 'open', is_public: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, title: 'Backend Developer', description: 'APIs', location: 'Guatemala', pipeline_id: 1, status: 'open', is_public: true }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <MemoryRouter>
          <PositionsPage />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Backend Developer' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Publicar en portal' }))

    await waitFor(() => {
      expect(screen.getByText('Vacante publicada correctamente.')).toBeInTheDocument()
    })
  })

  it('shows a warning in positions when no pipelines exist', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <MemoryRouter>
          <PositionsPage />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(await screen.findByText(/No hay pipelines disponibles/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear vacante' })).toBeDisabled()
  })

  it('creates and lists pipelines with ordered stages', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 50, name: 'Pipeline General', is_default: true, stages: [{ id: 1, name: 'Aplicado', order_index: 1 }, { id: 2, name: 'Entrevista', order_index: 2 }] }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 50, name: 'Pipeline General', is_default: true, stages: [{ id: 1, name: 'Aplicado', order_index: 1 }, { id: 2, name: 'Entrevista', order_index: 2 }] }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <PipelinesPage />
      </AuthProvider>,
    )

    await userEvent.type(screen.getByPlaceholderText('Nombre del pipeline'), 'Pipeline General')
    await userEvent.type(screen.getByPlaceholderText('Etapa 1'), 'Aplicado')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar etapa' }))
    await userEvent.type(screen.getByPlaceholderText('Etapa 2'), 'Entrevista')
    await userEvent.click(screen.getByLabelText('Marcar como pipeline por defecto'))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar pipeline' }))

    await waitFor(() => {
      expect(screen.getByText('Pipeline creado correctamente.')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Pipeline General' })).toBeInTheDocument()
      expect(screen.getByText('1. Aplicado')).toBeInTheDocument()
      expect(screen.getByText('2. Entrevista')).toBeInTheDocument()
      expect(screen.getByText('default')).toBeInTheDocument()
    })
  })

  it('clears the session when an authenticated request returns 401', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Invalid authentication token' }), { status: 401, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <PipelinesPage />
      </AuthProvider>,
    )

    await userEvent.type(screen.getByPlaceholderText('Nombre del pipeline'), 'Pipeline General')
    await userEvent.type(screen.getByPlaceholderText('Etapa 1'), 'Aplicado')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar pipeline' }))

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('recruitment-frontend-auth'))).toEqual({
        token: '',
        companies: [],
        activeCompanyId: '',
      })
    })
  })

  it('creates a new position and loads its applications panel', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 3, name: 'Pipeline Tech', is_default: true, stages: [{ id: 8, name: 'Aplicado', order_index: 1 }] }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 9, title: 'QA Engineer', description: 'Validar calidad en cada release.', location: 'Remoto', pipeline_id: 3, status: 'open', is_public: false }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 9, title: 'QA Engineer', description: 'Validar calidad en cada release.', location: 'Remoto', pipeline_id: 3, status: 'open', is_public: false }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 22, position_id: 9, candidate_id: 7, current_stage_id: 8, notes: 'CV recibido', candidate: { id: 7, full_name: 'Ana Perez', email: 'ana@example.com' }, current_stage: { id: 8, name: 'Aplicado', order_index: 1 } }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <MemoryRouter>
          <PositionsPage />
        </MemoryRouter>
      </AuthProvider>,
    )

    await userEvent.type(screen.getByPlaceholderText('Titulo'), 'QA Engineer')
    await userEvent.type(screen.getByPlaceholderText('Descripcion'), 'Validar calidad en cada release.')
    await userEvent.type(screen.getByPlaceholderText('Ubicacion'), 'Remoto')
    await userEvent.selectOptions(screen.getByDisplayValue('Pipeline Tech'), '3')
    await userEvent.selectOptions(screen.getByDisplayValue('draft'), 'open')
    await userEvent.click(screen.getByRole('button', { name: 'Crear vacante' }))

    await waitFor(() => {
      expect(screen.getByText('Vacante creada correctamente.')).toBeInTheDocument()
      expect(screen.getByText('Ana Perez')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Aplicado')).toBeInTheDocument()
    })
  })

  it('moves an application to another stage from the positions board', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 9, title: 'QA Engineer', description: 'Validar calidad.', location: 'Remoto', pipeline_id: 3, status: 'open', is_public: false }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 3, name: 'Pipeline Tech', is_default: true, stages: [{ id: 8, name: 'Aplicado', order_index: 1 }, { id: 9, name: 'Entrevista', order_index: 2 }] }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 22, position_id: 9, candidate_id: 7, current_stage_id: 8, notes: 'CV recibido', candidate: { id: 7, full_name: 'Ana Perez', email: 'ana@example.com' }, current_stage: { id: 8, name: 'Aplicado', order_index: 1 } }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 22, current_stage_id: 9 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 22, position_id: 9, candidate_id: 7, current_stage_id: 9, notes: 'CV recibido', candidate: { id: 7, full_name: 'Ana Perez', email: 'ana@example.com' }, current_stage: { id: 9, name: 'Entrevista', order_index: 2 } }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <MemoryRouter>
          <PositionsPage />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(await screen.findByText('Ana Perez')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByDisplayValue('Aplicado'), '9')
    await userEvent.click(screen.getByRole('button', { name: 'Mover etapa' }))

    await waitFor(() => {
      expect(screen.getByText('Etapa actualizada correctamente.')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Entrevista')).toBeInTheDocument()
    })
  })

  it('loads public jobs and submits an application', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 7, title: 'Fullstack Developer', description: 'Portal y backend', location: 'Remoto' }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 99 }), { status: 201, headers: { 'Content-Type': 'application/json' } }))

    render(<PublicJobsPage />)

    expect(await screen.findByRole('button', { name: /fullstack developer/i })).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Nombre completo'), 'Paula Diaz')
    await userEvent.type(screen.getByPlaceholderText('Correo'), 'paula@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar postulacion' }))

    await waitFor(() => {
      expect(screen.getByText('Postulacion enviada correctamente.')).toBeInTheDocument()
    })
  })

  it('creates a candidate and associates it to an internal position', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 5, full_name: 'Luis Gomez', email: 'luis@example.com', phone: null, summary: null }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 11, title: 'Backend Developer', description: 'APIs', location: 'Guatemala', pipeline_id: 1, status: 'open', is_public: false }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 9, full_name: 'Paula Diaz', email: 'paula@example.com', phone: '5555-1212', summary: 'Backend engineer' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 5, full_name: 'Luis Gomez', email: 'luis@example.com', phone: null, summary: null }, { id: 9, full_name: 'Paula Diaz', email: 'paula@example.com', phone: '5555-1212', summary: 'Backend engineer' }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 31, current_stage_id: 1 }), { status: 201, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <CandidatesPage />
      </AuthProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Luis Gomez' })).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Nombre completo'), 'Paula Diaz')
    await userEvent.type(screen.getByPlaceholderText('Correo'), 'paula@example.com')
    await userEvent.type(screen.getByPlaceholderText('Telefono'), '5555-1212')
    await userEvent.type(screen.getByPlaceholderText('Resumen profesional'), 'Backend engineer')
    await userEvent.click(screen.getByRole('button', { name: 'Crear candidato' }))

    await waitFor(() => {
      expect(screen.getByText('Candidato creado correctamente.')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Paula Diaz' })).toBeInTheDocument()
    })

    const candidateSelect = screen.getAllByRole('combobox').find((element) => element.value === '9')
    const positionSelect = screen.getAllByRole('combobox').find((element) => element.value === '11')

    await userEvent.selectOptions(candidateSelect, '9')
    await userEvent.selectOptions(positionSelect, '11')
    await userEvent.type(screen.getByPlaceholderText('Notas de la postulacion'), 'Ingreso manual desde panel')
    await userEvent.click(screen.getByRole('button', { name: 'Crear postulacion interna' }))

    await waitFor(() => {
      expect(screen.getByText('Postulacion interna creada correctamente.')).toBeInTheDocument()
    })
  })

  it('shows candidate applications and uploads documents for the selected application', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 5, full_name: 'Luis Gomez', email: 'luis@example.com', phone: '5555-0000', summary: 'QA profile' }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 11, title: 'Backend Developer', description: 'APIs', location: 'Guatemala', pipeline_id: 1, status: 'open', is_public: false }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 31, company_id: 10, position_id: 11, candidate_id: 5, current_stage_id: 1, notes: 'Proceso interno', position: { id: 11, title: 'Backend Developer', location: 'Guatemala', status: 'open' }, current_stage: { id: 1, name: 'Aplicado', order_index: 1 } }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 77, application_id: 31, company_id: 10, external_file_id: 'cv-1', original_filename: 'cv.pdf', content_type: 'application/pdf', uploaded_by_user_id: 1 }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 88, application_id: 31, company_id: 10, external_file_id: 'cover-letter', original_filename: 'cover-letter.txt', content_type: 'text/plain', uploaded_by_user_id: 1 }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: 77, application_id: 31, company_id: 10, external_file_id: 'cv-1', original_filename: 'cv.pdf', content_type: 'application/pdf', uploaded_by_user_id: 1 },
        { id: 88, application_id: 31, company_id: 10, external_file_id: 'cover-letter', original_filename: 'cover-letter.txt', content_type: 'text/plain', uploaded_by_user_id: 1 },
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <CandidatesPage />
      </AuthProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Luis Gomez' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /backend developer/i })).toBeInTheDocument()
    expect(await screen.findByText('cv.pdf')).toBeInTheDocument()

    const fileInput = document.querySelector('input[type="file"]')
    const file = new File(['cover letter'], 'cover-letter.txt', { type: 'text/plain' })
    await userEvent.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Documento cargado correctamente.')).toBeInTheDocument()
      expect(screen.getByText('cover-letter.txt')).toBeInTheDocument()
    })
  })

  it('creates evaluation assets and applies them to a candidate application', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 11, title: 'Backend Developer', description: 'APIs', location: 'Guatemala', pipeline_id: 1, status: 'open', is_public: false }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 31, position_id: 11, candidate_id: 5, current_stage_id: 1, notes: 'Proceso activo', candidate: { id: 5, full_name: 'Luis Gomez', email: 'luis@example.com' }, current_stage: { id: 1, name: 'Aplicado', order_index: 1 } }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 41, name: 'Filtro Tecnico', questions: [{ id: 1, prompt: 'Pregunta', order_index: 1 }] }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 41, name: 'Filtro Tecnico', questions: [{ id: 1, prompt: 'Pregunta', order_index: 1 }] }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 51, name: 'Entrevista Tecnica', criteria: [{ id: 71, name: 'Arquitectura', order_index: 1 }] }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 51, name: 'Entrevista Tecnica', criteria: [{ id: 71, name: 'Arquitectura', order_index: 1 }] }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 61, application_id: 31, questionnaire_id: 41, status: 'pending' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 61, application_id: 31, questionnaire_id: 41, status: 'pending' }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 81, application_id: 31, scorecard_template_id: 51, submitted_by_user_id: 1, items: [{ id: 91, criterion_id: 71, score: 4, comment: 'Buen criterio' }] }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 81, application_id: 31, scorecard_template_id: 51, submitted_by_user_id: 1, items: [{ id: 91, criterion_id: 71, score: 4, comment: 'Buen criterio' }] }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <EvaluationPage />
      </AuthProvider>,
    )

    expect(await screen.findByDisplayValue('Backend Developer')).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Nombre del cuestionario'), 'Filtro Tecnico')
    await userEvent.type(screen.getByPlaceholderText('Pregunta base'), 'Pregunta')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuestionario' }))

    await waitFor(() => {
      expect(screen.getByText('Cuestionario creado correctamente.')).toBeInTheDocument()
    })

    await userEvent.type(screen.getByPlaceholderText('Nombre de la plantilla'), 'Entrevista Tecnica')
    await userEvent.type(screen.getByPlaceholderText('Criterio inicial'), 'Arquitectura')
    await userEvent.click(screen.getByRole('button', { name: 'Crear plantilla' }))

    await waitFor(() => {
      expect(screen.getByText('Plantilla de scorecard creada correctamente.')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Asignar a postulacion' }))

    await waitFor(() => {
      expect(screen.getByText('Cuestionario asignado correctamente.')).toBeInTheDocument()
    })

    await userEvent.selectOptions(screen.getByDisplayValue('3'), '4')
    await userEvent.type(screen.getByPlaceholderText('Comentario'), 'Buen criterio')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar scorecard' }))

    await waitFor(() => {
      expect(screen.getByText('Scorecard registrado correctamente.')).toBeInTheDocument()
      expect(screen.getByText('Scorecard #81')).toBeInTheDocument()
    })
  })

  it('creates a company from the dashboard and refreshes the active context', async () => {
    seedSession()
    window.localStorage.setItem(
      'recruitment-frontend-auth',
      JSON.stringify({
        token: 'token-demo',
        activeCompanyId: '',
        companies: [],
      }),
    )

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 44, name: 'Recruitment Solutions', slug: 'recruitment-solutions', is_active: true }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ company: { id: 44, name: 'Recruitment Solutions', slug: 'recruitment-solutions', is_active: true }, role: 'admin' }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>,
    )

    await userEvent.type(screen.getByPlaceholderText('Nombre de la compania'), 'Recruitment Solutions')
    await userEvent.type(screen.getByPlaceholderText('Slug'), 'recruitment-solutions')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar compania' }))

    await waitFor(() => {
      expect(screen.getByText('Compania creada correctamente.')).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { name: 'Recruitment Solutions' }).length).toBeGreaterThan(0)
    })
  })

  it('shows notification history for a selected application', async () => {
    seedSession()
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 11, title: 'Backend Developer', description: 'APIs', location: 'Guatemala', pipeline_id: 1, status: 'open', is_public: false }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 31, position_id: 11, candidate_id: 5, current_stage_id: 2, notes: 'Proceso activo', candidate: { id: 5, full_name: 'Luis Gomez', email: 'luis@example.com' }, current_stage: { id: 2, name: 'Entrevista', order_index: 2 } }]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: 71, application_id: 31, company_id: 10, channel: 'email', event_name: 'application_stage_changed', recipient: 'luis@example.com', status: 'sent', error_message: null },
        { id: 72, application_id: 31, company_id: 10, channel: 'email', event_name: 'application_stage_changed', recipient: 'luis@example.com', status: 'failed', error_message: 'Stub mail provider failure' },
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    render(
      <AuthProvider>
        <NotificationsPage />
      </AuthProvider>,
    )

    expect(await screen.findByDisplayValue('Backend Developer')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Luis Gomez')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText('application_stage_changed').length).toBe(2)
      expect(screen.getByText('Stub mail provider failure')).toBeInTheDocument()
    })
  })
})
