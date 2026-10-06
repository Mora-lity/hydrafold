import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { CONTACT, instagramUrl, whatsappUrl } from '@/lib/contact'
import { Logo } from './logo'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3.5 20.5 4.8 16.7A8.5 8.5 0 1 1 7.6 19.3Z" />
      <path
        d="M9.2 8.4c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .5-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.2.4-.2.6-.1l1.5.6c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.6.4-1.4.5-2.2.2a8.2 8.2 0 0 1-4.6-4.6c-.3-.8-.2-1.6.2-2.2Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

type ContactCardProps = {
  icon: ReactNode
  iconClassName: string
  label: string
  value: string
  href: string
  cta: string
}

function ContactCard({ icon, iconClassName, label, value, href, cta }: ContactCardProps) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${iconClassName}`}>
          {icon}
        </span>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-base font-semibold text-foreground">{value}</span>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {cta}
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </a>
    </li>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <section aria-labelledby="contact-heading" className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
        <div className="flex flex-col gap-2">
          <h2 id="contact-heading" className="text-xl font-semibold text-foreground text-balance">
            Hubungi Kami
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
            Punya pertanyaan atau ingin mengetahui lebih lanjut tentang HydraFold? Hubungi kami melalui WhatsApp atau
            Instagram.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          <ContactCard
            icon={<WhatsAppIcon className="size-6" />}
            iconClassName="bg-[#25D366]"
            label="WhatsApp"
            value={CONTACT.whatsappDisplay}
            href={whatsappUrl}
            cta="Chat via WhatsApp"
          />
          <ContactCard
            icon={<InstagramIcon className="size-6" />}
            iconClassName="bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
            label="Instagram"
            value={`@${CONTACT.instagramHandle}`}
            href={instagramUrl}
            cta="Follow Instagram"
          />
        </ul>
      </section>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-between md:px-8">
          <Logo />
          <p className="text-center text-xs text-muted-foreground">
            {'© '}
            {new Date().getFullYear()} HydraFold. Data tersimpan hanya di perangkat Anda.
          </p>
        </div>
      </div>
    </footer>
  )
}
