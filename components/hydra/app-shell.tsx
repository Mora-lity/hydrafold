'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { NAV_ITEMS } from '@/lib/nav'
import { useHydraState } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { ReminderWatcher } from './reminder-watcher'
import { SiteFooter } from './site-footer'
import { ThemeToggle } from './theme-toggle'

export function AppShell({ children }: { children: React.ReactNode }) {
  const state = useHydraState()
  const pathname = usePathname()
  const router = useRouter()
  const needsProfile = state !== null && !state.profile && pathname !== '/edukasi'

  useEffect(() => {
    if (needsProfile) router.replace('/profil')
  }, [needsProfile, router])

  const ready = state !== null && !needsProfile

  return (
    <div className="min-h-dvh md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Link href="/" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </Link>
        <nav aria-label="Navigasi utama" className="mt-10 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between rounded-xl border border-sidebar-border p-3">
          <span className="text-sm text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" aria-label="HydraFold, ke halaman sambutan">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-10">
          {ready ? children : <ShellSkeleton />}
        </main>
        <SiteFooter />
      </div>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      active && 'bg-accent',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {ready && state?.profile && <ReminderWatcher reminder={state.reminder} />}
    </div>
  )
}

function ShellSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat data">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
    </div>
  )
}
