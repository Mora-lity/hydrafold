// Ganti placeholder di bawah dengan nomor WhatsApp dan akun Instagram asli.
export const CONTACT = {
  whatsappNumber: '6281234567890',
  whatsappMessage: 'Halo HydraFold, saya ingin bertanya.',
  instagramHandle: 'hydrafold.id',
}

export const whatsappUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`
export const instagramUrl = `https://instagram.com/${CONTACT.instagramHandle}`
