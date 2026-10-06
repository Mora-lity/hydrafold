import type { Metadata } from 'next'
import { Logo } from '@/components/hydra/logo'
import { OnboardingForm } from '@/components/hydra/onboarding-form'
import { ThemeToggle } from '@/components/hydra/theme-toggle'

export const metadata: Metadata = {
  title: 'Isi Profil — HydraFold',
}

export default function ProfilPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-16">
        <p className="text-sm font-semibold text-primary">Langkah 1 dari 1</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance text-foreground">
          Kenalan dulu, yuk
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Data ini dipakai untuk menghitung target minum harian dan menyusun jadwal pengingat. Semua data hanya
          tersimpan di perangkat ini.
        </p>
        <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm md:p-8">
          <OnboardingForm />
        </div>
      </main>
    </div>
  )
}
