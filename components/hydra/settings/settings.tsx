'use client'

import { toast } from 'sonner'
import { recommendedGoal } from '@/lib/hydration'
import { saveProfile, useHydraState } from '@/lib/store'
import { ProfileForm } from '../profile-form'
import { DataSection } from './data-section'
import { GoalSection } from './goal-section'
import { ReminderSection } from './reminder-section'
import { SettingsCard } from './settings-card'
import { ThemeSection } from './theme-section'

const SECTIONS = [
  { id: 'profil', label: 'Profil' },
  { id: 'target', label: 'Target' },
  { id: 'pengingat', label: 'Pengingat' },
  { id: 'tampilan', label: 'Tampilan' },
  { id: 'data', label: 'Data' },
]

export function Settings() {
  const state = useHydraState()
  if (!state?.profile) return null

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sesuaikan profil, target, jadwal pengingat, dan tema.</p>
      </header>

      <nav aria-label="Bagian pengaturan" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm font-medium whitespace-nowrap text-foreground transition-colors hover:border-primary/40"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <SettingsCard id="profil" title="Profil" description="Nama, berat badan, aktivitas, dan kapasitas botol.">
        <ProfileForm
          initial={state.profile}
          submitLabel="Simpan profil"
          onSubmit={(profile) => {
            saveProfile(profile)
            toast.success('Profil diperbarui')
          }}
        />
      </SettingsCard>

      <SettingsCard id="target" title="Target minum" description="Gunakan rekomendasi otomatis atau tentukan sendiri.">
        <GoalSection
          key={state.customGoalMl ?? 'auto'}
          customGoal={state.customGoalMl}
          recommended={recommendedGoal(state.profile)}
        />
      </SettingsCard>

      <SettingsCard id="pengingat" title="Jadwal pengingat" description="Atur kapan HydraFold mengingatkan Anda minum.">
        <ReminderSection key={JSON.stringify(state.reminder)} reminder={state.reminder} />
      </SettingsCard>

      <SettingsCard id="tampilan" title="Tampilan" description="Pilihan tema disimpan di perangkat ini.">
        <ThemeSection />
      </SettingsCard>

      <SettingsCard id="data" title="Data" description="Semua data tersimpan lokal di browser ini.">
        <DataSection />
      </SettingsCard>
    </div>
  )
}
