import fetch from 'node-fetch'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, args, command }) => {
  // 1. Verificación de registro (Estilo KarBot) 🌿
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  // 2. Validación de entrada
  if (!args[0]) {
    return conn.reply(m.chat, `> Debe proporcionar un enlace de Twitter/X.`, m)
  }

  const url = args[0]
  if (!url.match(/(twitter\.com|x\.com)/)) {
    return conn.reply(m.chat, `> El enlace no parece ser de Twitter o X.`, m)
  }

  // 3. Secuencia de reacciones con plantas y tréboles 🔍🌿🍀📥
  const reacciones = ['🔍', '🌿', '🍀', '📥']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/twiter?url=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl)
    
    if (!res.ok) throw new Error()
    const json = await res.json()

    if (!json.status || !json.data) throw new Error()

    const { HD, SD } = json.data
    const videoUrl = HD || SD

    // --- DISEÑO SIMPLIFICADO KARBOT ---
    await conn.sendMessage(m.chat, {
      video: { url: videoUrl },
      caption: `> Video descargado en calidad: *Original*`
    }, { quoted: m })

    // Sello de ingeniería KarBot ⚙️
    await m.react('⚙️')

  } catch (error) {
    await m.react('❌')
    return conn.reply(m.chat, `> Lo siento, no pude descargar el video`, m)
  }
}

handler.help = ['twitter + url']
handler.tags = ['downloader']
handler.command = /^(twitter|tw|twdl|x)$/i
handler.group = true

export default handler