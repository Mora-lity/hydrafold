'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { saveProfile, useHydraState } from '@/lib/store'
import { ProfileForm } from './profile-form'

export function OnboardingForm() {
  const state = useHydraState()
  const router = useRouter()

  if (!state) return <div className="h-[560px] animate-pulse rounded-2xl bg-muted" aria-hidden="true" />

  return (
    <ProfileForm
      key={state.profile ? 'edit' : 'new'}
      initial={state.profile}
      submitLabel={state.profile ? 'Simpan & ke Dashboard' : 'Simpan & Mulai'}
      onSubmit={(profile) => {
        saveProfile(profile)
        toast.success(`Profil tersimpan. Semangat, ${profile.name}!`)
        router.push('/dashboard')
      }}
    />
  )
}
