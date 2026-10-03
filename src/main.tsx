import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing from index.html')

const configured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

if (configured) {
  // Imported lazily so a build without Supabase settings shows a message instead of a blank page.
  const [{ Providers }, { AppRouter }] = await Promise.all([
    import('./app/providers'),
    import('./app/router'),
  ])
  createRoot(root).render(
    <StrictMode>
      <Providers>
        <AppRouter />
      </Providers>
    </StrictMode>,
  )
} else {
  createRoot(root).render(
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">Supertrainer</h1>
      <p className="text-muted-foreground">
        The app isn’t connected to its database yet. Set VITE_SUPABASE_URL and
        VITE_SUPABASE_ANON_KEY (see the README).
      </p>
    </main>,
  )
}
