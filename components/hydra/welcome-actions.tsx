'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { useHydraState } from '@/lib/store'
import { cn } from '@/lib/utils'

export function WelcomeActions() {
  const state = useHydraState()
  const hasProfile = Boolean(state?.profile)

  return (
    <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      <Link
        href={hasProfile ? '/dashboard' : '/profil'}
        className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-full px-6 text-base')}
      >
        {hasProfile ? `Lanjutkan, ${state?.profile?.name}` : 'Mulai Sekarang'}
        <ArrowRight data-icon="inline-end" />
      </Link>
      <Link
        href="/edukasi"
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 rounded-full px-6 text-base')}
      >
        Pelajari manfaatnya
      </Link>
    </div>
  )
}
