import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AppShell } from '../components/AppShell.jsx'
import { ProtectedRoute } from '../components/ProtectedRoute.jsx'
import { CandidatesPage } from '../pages/CandidatesPage.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { EvaluationPage } from '../pages/EvaluationPage.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { NotificationsPage } from '../pages/NotificationsPage.jsx'
import { PipelinesPage } from '../pages/PipelinesPage.jsx'
import { PositionsPage } from '../pages/PositionsPage.jsx'
import { PublicJobsPage } from '../pages/PublicJobsPage.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/jobs',
    element: <PublicJobsPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/pipelines', element: <PipelinesPage /> },
      { path: '/candidates', element: <CandidatesPage /> },
      { path: '/evaluation', element: <EvaluationPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/positions', element: <PositionsPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
