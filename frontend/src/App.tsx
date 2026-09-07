import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmMapPage } from './pages/FarmMapPage';
import { SoilHealthPage } from './pages/SoilHealthPage';
import { CropHealthPage } from './pages/CropHealthPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { EnvironmentalRiskPage } from './pages/EnvironmentalRiskPage';
import { RoverPage } from './pages/RoverPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/farm-map" element={<FarmMapPage />} />
              <Route path="/soil-health" element={<SoilHealthPage />} />
              <Route path="/crop-health" element={<CropHealthPage />} />
              <Route path="/ai-analysis" element={<AIAnalysisPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/environmental-risk" element={<EnvironmentalRiskPage />} />
              <Route path="/rover" element={<RoverPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
