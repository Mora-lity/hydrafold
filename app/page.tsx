import { BellRing, ChartColumn, Target } from 'lucide-react'
import { Logo } from '@/components/hydra/logo'
import { SiteFooter } from '@/components/hydra/site-footer'
import { ThemeToggle } from '@/components/hydra/theme-toggle'
import { WaterDrop } from '@/components/hydra/water-drop'
import { WelcomeActions } from '@/components/hydra/welcome-actions'

const HIGHLIGHTS = [
  { icon: Target, title: 'Target personal', text: 'Dihitung dari berat badan dan aktivitas Anda.' },
  { icon: BellRing, title: 'Jadwal pengingat', text: 'Atur jam, interval, dan hari aktif sesuai rutinitas.' },
  { icon: ChartColumn, title: 'Riwayat jelas', text: 'Pantau konsumsi harian dan mingguan lewat grafik.' },
]

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 md:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-12 px-4 pt-6 pb-16 md:flex-row md:gap-16 md:px-8 md:pt-12">
        <div className="relative flex w-full max-w-xs shrink-0 items-center justify-center md:order-2 md:max-w-sm">
          <div aria-hidden="true" className="absolute inset-6 rounded-full bg-primary/15 blur-3xl" />
          <WaterDrop className="animate-float relative w-44 md:w-64" />
        </div>

        <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Untuk mahasiswa & pekerja muda
          </span>
          <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight text-balance text-foreground md:text-5xl">
            Minum cukup, jalani hari dengan lebih baik
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            HydraFold membantu Anda menetapkan target minum harian, mencatat setiap tegukan dengan satu
            ketukan, dan membangun kebiasaan hidrasi yang konsisten.
          </p>
          <WelcomeActions />

          <ul className="mt-10 grid w-full gap-3 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-border bg-card p-4 text-left">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-semibold text-foreground">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
