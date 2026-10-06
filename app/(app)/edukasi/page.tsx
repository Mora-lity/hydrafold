import { Brain, Coins, Droplets, HeartPulse, Leaf, Recycle, Repeat, Sun, Timer, Utensils } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edukasi — HydraFold',
}

const WATER_TIPS = [
  { icon: Brain, title: 'Fokus lebih tajam', text: 'Kurang cairan sedikit saja bisa membuat sulit konsentrasi saat kuliah atau rapat.' },
  { icon: HeartPulse, title: 'Energi lebih stabil', text: 'Rasa lelah dan sakit kepala di siang hari sering muncul karena tubuh kurang minum.' },
  { icon: Sun, title: 'Mulai dari pagi', text: 'Minum satu gelas air setelah bangun tidur untuk mengganti cairan selama tidur.' },
  { icon: Timer, title: 'Sedikit tapi sering', text: 'Minum bertahap sepanjang hari lebih nyaman daripada sekaligus dalam jumlah besar.' },
  { icon: Utensils, title: 'Pasangkan dengan rutinitas', text: 'Biasakan minum sebelum makan, setelah ke toilet, atau saat jeda kelas.' },
  { icon: Droplets, title: 'Kenali tanda tubuh', text: 'Urine berwarna kuning pucat umumnya menandakan hidrasi yang cukup.' },
]

const PLASTIC_TIPS = [
  { icon: Repeat, title: 'Bawa botol isi ulang', text: 'Simpan botol di tas setiap hari agar tidak perlu membeli air kemasan.' },
  { icon: Droplets, title: 'Manfaatkan titik isi ulang', text: 'Banyak kampus, kantor, dan kafe menyediakan dispenser air minum gratis.' },
  { icon: Coins, title: 'Hemat pengeluaran', text: 'Membeli satu botol air kemasan per hari bisa menghabiskan ratusan ribu rupiah per bulan.' },
  { icon: Recycle, title: 'Kurangi sampah', text: 'Botol plastik sekali pakai butuh waktu sangat lama untuk terurai di alam.' },
  { icon: Leaf, title: 'Rawat botolmu', text: 'Cuci botol setiap hari dan keringkan agar tetap higienis dan awet.' },
]

export default function EdukasiPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Edukasi hidrasi</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tips sederhana agar kebiasaan minum air putih terasa ringan, sekaligus lebih ramah lingkungan.
        </p>
      </header>

      <TipGroup id="air-putih" title="Kenapa air putih penting?" tips={WATER_TIPS} />
      <TipGroup id="kurangi-plastik" title="Kurangi botol plastik sekali pakai" tips={PLASTIC_TIPS} />

      <aside className="rounded-3xl bg-primary p-6 text-primary-foreground md:p-8">
        <h2 className="text-lg font-semibold">Catatan penting</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-90">
          Target di HydraFold adalah perkiraan umum berdasarkan berat badan dan aktivitas. Kebutuhan tiap orang
          berbeda — konsultasikan dengan tenaga kesehatan bila Anda memiliki kondisi medis tertentu.
        </p>
      </aside>
    </div>
  )
}

function TipGroup({
  id,
  title,
  tips,
}: {
  id: string
  title: string
  tips: { icon: typeof Brain; title: string; text: string }[]
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map(({ icon: Icon, title: tipTitle, text }) => (
          <li key={tipTitle} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-foreground">{tipTitle}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
