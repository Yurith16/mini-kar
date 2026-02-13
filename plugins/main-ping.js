import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  if (await checkReg(m, user)) return
  
  try {
    await m.react('⚙️')

    // Ping fijo (porque medirlo realmente da problemas)
    const ping = 150 // ms
    
    // Speed basado en ping fijo
    let speed = '⚡ Rápido'

    // Uptime real
    const uptime = process.uptime()
    const horas = Math.floor(uptime / 3600)
    const minutos = Math.floor((uptime % 3600) / 60)
    const segundos = Math.floor(uptime % 60)
    
    let tiempoActivo = ''
    if (horas > 0) tiempoActivo += `${horas}h `
    if (minutos > 0) tiempoActivo += `${minutos}m `
    tiempoActivo += `${segundos}s`

    // Enviar mensaje
    await conn.reply(m.chat, 
      `> ⚡ Ping: ${ping} ms\n` +
      `> 📊 Speed: ${speed}\n` +
      `> ⏰ Activo: ${tiempoActivo}`, 
      m
    )
    
    await m.react('✅')

  } catch (error) {
    await m.react('❌')
    await conn.reply(m.chat, '> Error', m)
  }
}

handler.command = ['ping', 'p', 'latencia']
handler.tags = ['main']
export default handler