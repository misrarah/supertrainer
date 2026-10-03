import { HashRouter, Route, Routes } from 'react-router'
import { LoginPage } from '@/features/auth/login-page'
import { UserHomePage } from '@/features/logging/user-home-page'
import { OnboardingPage } from '@/features/onboarding/onboarding-page'
import { PrivacyPage } from '@/features/privacy/privacy-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { TrainerHomePage } from '@/features/trainer-dashboard/trainer-home-page'
import { TrainersPage } from '@/features/trainers/trainers-page'
import { AppLayout } from './app-layout'
import { NotFoundPage } from './not-found-page'
import { RouteGuard } from './route-guard'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<RouteGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            {/* The guard always redirects from / to the right home page. */}
            <Route path="/" element={null} />
            <Route path="/t" element={<TrainerHomePage />} />
            <Route path="/u" element={<UserHomePage />} />
            <Route path="/trainers" element={<TrainersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
