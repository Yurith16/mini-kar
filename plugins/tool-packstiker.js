import fetch from 'node-fetch'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // 1. Verificación de registro (Estilo KarBot) 🌿
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  // 2. Validación de búsqueda
  if (!text) {
    return conn.reply(m.chat, `> ¿Qué stickers deseas buscar hoy, cielo? 🫦`, m)
  }

  // 3. Secuencia de reacciones de agilidad 🔍🌿🍀📦
  const reacciones = ['🔍', '🌿', '🍀', '📦']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    const apiUrl = `https://api.dorratz.com/v3/stickerly?query=${encodeURIComponent(text)}`
    const res = await fetch(apiUrl)
    const json = await res.json()

    if (!json.success || !json.data || json.data.length === 0) throw new Error()

    // Tomamos hasta 10 packs para la lluvia de stickers 🫦
    const packs = json.data.slice(0, 10)

    for (let pack of packs) {
      // Creamos el sticker con la etiqueta exclusiva YJ-EspinoX
      const sticker = new Sticker(pack.thumbnailUrl, {
        pack: 'KarBot 🌿', 
        author: 'YJ-EspinoX', // Tu marca personal 💋
        type: StickerTypes.FULL,
        quality: 60 // Un poco menos de calidad para que carguen rápido los 10
      })

      const buffer = await sticker.toBuffer()

      // Enviamos el sticker puro, sin textos innecesarios
      await conn.sendMessage(m.chat, { 
        sticker: buffer 
      }, { quoted: m })
    }

    // Sello de ingeniería final ⚙️
    await m.react('⚙️')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return conn.reply(m.chat, `> Lo siento, cielo, no encontré esos stickers.`, m)
  }
}

handler.help = ['stickerly +query']
handler.tags = ['search', 'sticker']
handler.command = /^(stickerly|stly)$/i
handler.group = true

export default handler