// Versión ultra simple para logging
export default async function (m, conn) {
  if (!m) return
  
  const time = new Date().toLocaleTimeString('it-IT', { hour12: false })
  const sender = m.sender?.split('@')[0] || 'unknown'
  const chat = m.chat?.split('@')[0] || 'unknown'
  const text = m.text?.slice(0, 50) || '(media)'
  
  console.log(`[${time}] ${sender} → ${chat}: ${text}`)
  
  if (m.text && m.text.length > 50) {
    console.log(m.text)
  }
}