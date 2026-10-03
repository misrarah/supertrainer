import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { useMyProfile } from '@/features/auth/use-my-profile'
import { homePath } from './route-decision'

/** Header and navigation for signed-in pages. */
export function AppLayout() {
  const profile = useMyProfile()
  const role = profile.data?.role
  const links = [
    ...(role ? [{ to: homePath(role), label: 'Home', end: true }] : []),
    { to: '/trainers', label: 'Trainers', end: false },
    { to: '/settings', label: 'Settings', end: false },
  ]

  return (
    <div className="min-h-svh">
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <span className="font-semibold">Supertrainer</span>
          <nav aria-label="Main">
            <ul className="flex gap-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex h-10 items-center rounded-md px-3 text-sm',
                        isActive
                          ? 'bg-muted font-medium'
                          : 'text-muted-foreground hover:text-foreground',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 pb-16">
        <Outlet />
      </main>
    </div>
  )
}
