import axios from 'axios'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // 1. Verificación de registro (Estilo KarBot) 🌿
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  // 2. Validación de texto
  if (!text) {
    return conn.reply(m.chat, `> ¿Qué desea consultar con mi inteligencia rápida, cielo?`, m)
  }

  // 3. Secuencia de reacciones de agilidad 🔍🌿🍀⚡
  const reacciones = ['🔍', '🌿', '🍀', '⚡']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    // Implementación del POST con la API Concise 🫦
    const { data } = await axios({
      method: 'post',
      url: 'https://api.ananta.qzz.io/api/conciseai',
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "antebryxivz14"
      },
      data: {
        text: text
      }
    })

    // Corregido: Según tu doc esta API devuelve 'status' y 'text' directamente
    if (!data.status || !data.text) throw new Error()

    // --- DISEÑO DE RESPUESTA KARBOT ---
    await m.reply(`> ${data.text}`)

    // El sello final de nuestra ingeniería ⚙️
    await m.react('⚙️')

  } catch (error) {
    await m.react('❌')
    return conn.reply(m.chat, `> Lo siento, no pude obtener una respuesta concisa en este momento.`, m)
  }
}

handler.help = ['concise +texto', 'cai +texto']
handler.tags = ['ai']
handler.command = /^(concise|cai|rapido|fastia)$/i
handler.group = true

export default handler