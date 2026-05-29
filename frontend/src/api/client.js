const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function buildHeaders({ token, companyId, contentType = 'application/json', extraHeaders = {} } = {}) {
  const headers = { ...extraHeaders }

  if (contentType) {
    headers['Content-Type'] = contentType
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (companyId) {
    headers['X-Company-Id'] = String(companyId)
  }

  return headers
}

export async function apiRequest(path, { method = 'GET', body, token, companyId, contentType, extraHeaders } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders({ token, companyId, contentType, extraHeaders }),
    body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
  })

  if (response.status === 204) {
    return null
  }

  const payload = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.detail ? payload.detail : 'Request failed'
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail: { path, method } }))
    }
    throw new ApiError(message, response.status)
  }

  return payload
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
}

export const companyApi = {
  listMine: (token) => apiRequest('/companies/mine', { token }),
  create: ({ token, payload }) => apiRequest('/companies', { token, method: 'POST', body: payload }),
}

export const candidateApi = {
  list: ({ token }) => apiRequest('/candidates', { token, method: 'GET' }),
  create: ({ token, payload }) => apiRequest('/candidates', { token, method: 'POST', body: payload }),
  listApplications: ({ token, candidateId }) => apiRequest(`/candidates/${candidateId}/applications`, { token, method: 'GET' }),
}

export const positionApi = {
  list: ({ token, companyId }) => apiRequest('/positions', { token, companyId, method: 'GET' }),
  create: ({ token, companyId, payload }) => apiRequest('/positions', { token, companyId, method: 'POST', body: payload }),
  update: ({ token, companyId, positionId, payload }) => apiRequest(`/positions/${positionId}`, { token, companyId, method: 'PATCH', body: payload }),
  delete: ({ token, companyId, positionId }) => apiRequest(`/positions/${positionId}`, { token, companyId, method: 'DELETE' }),
  publish: ({ token, companyId, positionId }) => apiRequest(`/positions/${positionId}/publish`, { token, companyId, method: 'POST' }),
  listApplications: ({ token, companyId, positionId }) => apiRequest(`/positions/${positionId}/applications`, { token, companyId, method: 'GET' }),
  moveApplicationStage: ({ token, companyId, applicationId, stageId }) => apiRequest(`/applications/${applicationId}/move-stage`, { token, companyId, method: 'POST', body: { stage_id: stageId } }),
}

export const pipelineApi = {
  list: ({ token, companyId }) => apiRequest('/pipelines', { token, companyId, method: 'GET' }),
  create: ({ token, companyId, payload }) => apiRequest('/pipelines', { token, companyId, method: 'POST', body: payload }),
}

export const questionnaireApi = {
  list: ({ token, companyId }) => apiRequest('/questionnaires', { token, companyId, method: 'GET' }),
  create: ({ token, companyId, payload }) => apiRequest('/questionnaires', { token, companyId, method: 'POST', body: payload }),
  assign: ({ token, companyId, payload }) => apiRequest('/questionnaire-assignments', { token, companyId, method: 'POST', body: payload }),
  listAssignments: ({ token, companyId, applicationId }) => apiRequest(`/applications/${applicationId}/questionnaire-assignments`, { token, companyId, method: 'GET' }),
}

export const scorecardApi = {
  listTemplates: ({ token, companyId }) => apiRequest('/scorecards/templates', { token, companyId, method: 'GET' }),
  createTemplate: ({ token, companyId, payload }) => apiRequest('/scorecards/templates', { token, companyId, method: 'POST', body: payload }),
  submit: ({ token, companyId, payload }) => apiRequest('/scorecards', { token, companyId, method: 'POST', body: payload }),
  listByApplication: ({ token, companyId, applicationId }) => apiRequest(`/applications/${applicationId}/scorecards`, { token, companyId, method: 'GET' }),
}

export const publicJobsApi = {
  list: () => apiRequest('/public/jobs'),
  apply: ({ positionId, payload }) => apiRequest(`/public/jobs/${positionId}/apply`, { method: 'POST', body: payload }),
}

export const applicationApi = {
  create: ({ token, companyId, payload }) => apiRequest('/applications', { token, companyId, method: 'POST', body: payload }),
  listDocuments: ({ token, companyId, applicationId }) => apiRequest(`/applications/${applicationId}/documents`, { token, companyId, method: 'GET' }),
  listNotifications: ({ token, companyId, applicationId }) => apiRequest(`/applications/${applicationId}/notifications`, { token, companyId, method: 'GET' }),
  uploadDocument: ({ token, companyId, applicationId, file }) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest(`/applications/${applicationId}/documents`, {
      token,
      companyId,
      method: 'POST',
      body: formData,
      contentType: null,
    })
  },
}
