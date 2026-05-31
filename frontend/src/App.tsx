import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import TrendsPage from './pages/TrendsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import PreferencesPage from './pages/PreferencesPage';
import FamilyPage from './pages/FamilyPage';
import HistoryPage from './pages/HistoryPage';
import RecordDetailPage from './pages/RecordDetailPage';
import DietPage from './pages/DietPage';
import DietInsightsPage from './pages/DietInsightsPage';
import RecordFlow from './features/record/RecordFlow';
import AlertListPage from './features/alert/AlertListPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/profile/notifications" element={<NotificationSettingsPage />} />
          <Route path="/profile/privacy" element={<PrivacySettingsPage />} />
          <Route path="/profile/preferences" element={<PreferencesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/records/:id" element={<RecordDetailPage />} />
          <Route path="/diet" element={<DietPage />} />
          <Route path="/diet/insights" element={<DietInsightsPage />} />
          <Route path="/alerts" element={<AlertListPage />} />
        </Route>
        <Route
          path="/record"
          element={
            <ProtectedRoute>
              <RecordFlow />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
