import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, user, isOwner }) => {
  // Verificar registro (opcional, depende del comando)
  // if (await checkReg(m, user)) return
  
  try {
    await m.react('⚙️')
    
    // Ping simulado
    const ping = 150
    const speed = ping < 200 ? '⚡ Rápido' : ping < 500 ? '⏱️ Normal' : '🐢 Lento'
    
    // Uptime
    const uptime = process.uptime()
    const horas = Math.floor(uptime / 3600)
    const minutos = Math.floor((uptime % 3600) / 60)
    const segundos = Math.floor(uptime % 60)
    
    let tiempo = ''
    if (horas > 0) tiempo += `${horas}h `
    if (minutos > 0) tiempo += `${minutos}m `
    tiempo += `${segundos}s`
    
    const txt = `> ⚡ *Ping:* ${ping}ms\n> 📊 *Speed:* ${speed}\n> ⏰ *Activo:* ${tiempo}`
    
    await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
    await m.react('✅')
    
  } catch (error) {
    await m.react('❌')
  }
}

handler.command = ['ping', 'p', 'latencia']
handler.tags = ['main']
handler.exp = 10

export default handler