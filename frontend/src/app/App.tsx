import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthProvider, useAuth } from '../modules/auth/AuthContext';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { ProfilePage } from '../modules/auth/pages/ProfilePage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage';
import { ResetPasswordPage } from '../modules/auth/pages/ResetPasswordPage';
import { EditorPage } from '../modules/editor/pages/EditorPage';
import { LandingPage } from '../modules/landing/LandingPage';
import { ProjectsPage } from '../modules/projects/ProjectsPage';
import { PreferencesProvider } from '../modules/settings/PreferencesContext';
import { SettingsPage } from '../modules/settings/SettingsPage';

function HomeRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/projects" replace /> : <LandingPage />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/projects" replace /> : children;
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/editor/:projectId" element={<EditorPage />} />
              <Route path="/session/:sessionId" element={<EditorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </PreferencesProvider>
  );
}
