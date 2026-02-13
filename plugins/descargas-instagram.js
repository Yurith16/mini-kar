import fetch from 'node-fetch'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, args, command }) => {
  // Verificación de registro (Estilo KarBot)
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  if (!args[0]) {
    return conn.reply(m.chat, `> Debe proporcionar un enlace de Instagram.`, m)
  }

  const url = args[0]
  if (!url.match(/instagram\.com/)) {
    return conn.reply(m.chat, `> El enlace no parece ser de Instagram.`, m)
  }

  // Secuencia de reacciones con plantas y tréboles para dar vida al chat 🍃
  const reacciones = ['🔍', '🌿', '🍀', '📥']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl)
    
    if (!res.ok) throw new Error()
    const json = await res.json()

    if (!json.status || !json.data || json.data.length === 0) throw new Error()

    const media = json.data[0]
    const mediaUrl = media.url
    const isVideo = media.type === 'video'
    const isAudioCommand = command.toLowerCase().includes('audio')

    if (isAudioCommand) {
      await conn.sendMessage(m.chat, {
        audio: { url: mediaUrl },
        mimetype: 'audio/mpeg',
        fileName: `audio_instagram.mp3`,
        ptt: false
      }, { quoted: m })
    } else if (isVideo) {
      await conn.sendMessage(m.chat, {
        video: { url: mediaUrl },
        caption: `> Video descargado en calidad: *Original*`
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, {
        image: { url: mediaUrl },
        caption: `> Imagen descargada en calidad: *Original*`
      }, { quoted: m })
    }

    // El engranaje final, el sello de nuestra ingeniería ⚙️
    await m.react('⚙️')

  } catch (error) {
    await m.react('❌')
    return conn.reply(m.chat, `> Lo siento, no pude descargar el video`, m)
  }
}

handler.help = ['ig +url (instagram)', "igaudio + url(instagram)"]
handler.tags = ['downloader']
handler.command = ['ig','instagram', 'igaudio']
handler.group = true

export default handler