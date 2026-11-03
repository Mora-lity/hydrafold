self.addEventListener('push', (event) => {
  let data = { title: 'Waktunya minum air', body: 'Ambil botolmu dan minum beberapa teguk.', url: '/dashboard', tag: 'hydrafold-reminder' }
  try {
    if (event.data) {
      const payload = event.data.json()
      if (payload && typeof payload === 'object') data = { ...data, ...payload }
    }
  } catch {
    // Ignore malformed provider payloads and show the safe default notification.
  }
  event.waitUntil(self.registration.showNotification(String(data.title), {
    body: String(data.body),
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: String(data.tag),
    renotify: false,
    data: { url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/dashboard' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => 'focus' in client)
      if (existing) {
        existing.navigate(url)
        return existing.focus()
      }
      return clients.openWindow(url)
    }),
  )
})
