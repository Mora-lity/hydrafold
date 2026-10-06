'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { resetAllData } from '@/lib/store'

export function DataSection() {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)} className="h-11 rounded-xl text-destructive">
        <Trash2 data-icon="inline-start" />
        Hapus semua data
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4" role="alertdialog" aria-labelledby="reset-title">
      <p id="reset-title" className="text-sm font-medium text-foreground">
        Hapus profil, pengaturan, dan seluruh riwayat minum? Tindakan ini tidak dapat dibatalkan.
      </p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          className="h-10 rounded-xl"
          onClick={() => {
            resetAllData()
            toast.success('Semua data telah dihapus')
            router.replace('/')
          }}
        >
          Ya, hapus
        </Button>
        <Button variant="ghost" className="h-10 rounded-xl" onClick={() => setConfirming(false)}>
          Batal
        </Button>
      </div>
    </div>
  )
}
