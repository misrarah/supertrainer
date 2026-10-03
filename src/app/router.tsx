import { HashRouter, Route, Routes } from 'react-router'
import { NotFoundPage } from './not-found-page'
import { PlaceholderPage } from './placeholder-page'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PlaceholderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  )
}
