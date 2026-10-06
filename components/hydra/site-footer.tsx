import { MessageCircle } from 'lucide-react'
import { CONTACT, instagramUrl, whatsappUrl } from '@/lib/contact'
import { Logo } from './logo'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Teman kecil untuk kebiasaan minum air yang lebih baik setiap hari.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Hubungi kami</h2>
          <ul className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <li>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <InstagramIcon className="size-4" />@{CONTACT.instagramHandle}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        {'© '}
        {new Date().getFullYear()} HydraFold. Data tersimpan hanya di perangkat Anda.
      </p>
    </footer>
  )
}
