import fetch from 'node-fetch'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // 1. Verificación de registro (Estilo KarBot) 🌿
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  // 2. Lógica de texto (Por defecto a español para mayor comodidad)
  let targetText = text
  if (!targetText && m.quoted && m.quoted.text) targetText = m.quoted.text

  if (!targetText) {
    return conn.reply(m.chat, `> ¿Qué texto deseas que traduzca al español, cielo?`, m)
  }

  // 3. Secuencia de reacciones 🔍🌿🍀🌍
  const reacciones = ['🔍', '🌿', '🍀', '🌍']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    // Forzamos el idioma a 'es' (español) en la API
    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/search/translate?text=${encodeURIComponent(targetText)}&lang=es`
    const res = await fetch(apiUrl)
    
    if (!res.ok) throw new Error()
    const json = await res.json()

    if (!json.status || !json.result) throw new Error()

    // --- DISEÑO DE RESPUESTA SOLICITADO ---
    await m.reply(`> Traducido al español:\n\n${json.result}`)

    // Sello final de ingeniería ⚙️
    await m.react('⚙️')

  } catch (error) {
    await m.react('❌')
    return conn.reply(m.chat, `> Lo siento, no pude realizar la traducción`, m)
  }
}

handler.help = ['translate + texto']
handler.tags = ['tools']
handler.command = /^(translate|tr|traductor)$/i
handler.group = true

export default handler