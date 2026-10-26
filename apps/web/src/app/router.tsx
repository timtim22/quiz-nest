import { UserRole } from '@quiz-nest/shared';
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { GuestOnly, RequireAuth, RequireRole } from '@/features/auth/route-guards';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { JoinExamPage } from '@/pages/student/JoinExamPage';
import { DashboardPage } from '@/pages/teacher/DashboardPage';
import { SubjectDetailPage } from '@/pages/teacher/SubjectDetailPage';
import { SubjectsPage } from '@/pages/teacher/SubjectsPage';

/** Every page in the app. Paths follow the route list in the project spec. */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/login',
        element: (
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        ),
      },
      {
        path: '/register',
        element: (
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        ),
      },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      {
        path: '/teacher',
        // Everything under /teacher needs a logged-in teacher.
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'subjects', element: <SubjectsPage /> },
          { path: 'subjects/:subjectId', element: <SubjectDetailPage /> },
        ],
      },
      {
        path: '/admin',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          {
            // Admins only. Teachers see a "no access" page (and the API refuses them too).
            element: (
              <RequireRole role={UserRole.ADMIN}>
                <Outlet />
              </RequireRole>
            ),
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboardPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'audit-log', element: <AuditLogPage /> },
            ],
          },
        ],
      },
      {
        path: '/student',
        element: <StudentLayout />,
        children: [
          { index: true, element: <Navigate to="join" replace /> },
          { path: 'join', element: <JoinExamPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
