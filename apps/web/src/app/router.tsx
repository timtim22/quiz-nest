import { createBrowserRouter, Navigate } from 'react-router';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { JoinExamPage } from '@/pages/student/JoinExamPage';
import { DashboardPage } from '@/pages/teacher/DashboardPage';

/** Every page in the app. Paths follow the route list in the project spec. */
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/teacher',
        // TODO(QN-2): only let logged-in teachers in.
        element: <TeacherLayout />,
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
]);
