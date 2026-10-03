import { DumbbellIcon, HomeIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useMyProfile } from '@/features/auth/use-my-profile'
import { cn } from '@/lib/utils'
import { homePath } from './route-decision'

/** Header and navigation for signed-in pages: a top bar on wide screens, a tab bar on phones. */
export function AppLayout() {
  const profile = useMyProfile()
  const role = profile.data?.role
  const links = [
    ...(role
      ? [
          { to: homePath(role), label: 'Home', icon: HomeIcon, end: true },
          { to: `${homePath(role)}/exercises`, label: 'Exercises', icon: DumbbellIcon, end: false },
        ]
      : []),
    { to: '/trainers', label: 'Trainers', icon: UsersIcon, end: false },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
  ]

  return (
    <div className="min-h-svh">
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <span className="font-semibold">Supertrainer</span>
          <nav aria-label="Main" className="hidden sm:block">
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

      <main className="mx-auto max-w-3xl p-4 pb-24 sm:pb-16">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="bg-background/95 fixed inset-x-0 bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, 1fr)` }}>
          {links.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
