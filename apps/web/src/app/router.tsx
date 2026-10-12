import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { GuestOnly, RequireAuth } from '@/features/auth/route-guards';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { JoinExamPage } from '@/pages/student/JoinExamPage';
import { DashboardPage } from '@/pages/teacher/DashboardPage';

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
            <TeacherLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
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
