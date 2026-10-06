export function SettingsCard({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 rounded-3xl border border-border bg-card p-5 shadow-sm md:p-8"
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  )
}
