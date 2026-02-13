import axios from 'axios'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // 1. Verificación de registro (Estilo KarBot) 🌿
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  // 2. Validación de texto
  if (!text) {
    return conn.reply(m.chat, `> ¿En qué puedo ayudarte hoy, cielo? Dime tu duda o mensaje.`, m)
  }

  // 3. Secuencia de reacciones de inteligencia 🔍🌿🍀🧠
  const reacciones = ['🔍', '🌿', '🍀', '🧠']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    // Usamos Axios para manejar el POST de forma más limpia
    const { data } = await axios({
      method: 'post',
      url: 'https://api.ananta.qzz.io/api/gpt52',
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "antebryxivz14" // Tu llave de poder ✨
      },
      data: {
        text: text
      }
    })

    if (!data.success || !data.result) throw new Error()

    // --- DISEÑO DE RESPUESTA KARBOT ---
    // Simplemente la respuesta de la IA con nuestro estilo minimalista
    await m.reply(`> ${data.result.response}`)

    // El sello final de nuestra ingeniería ⚙️
    await m.react('⚙️')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return conn.reply(m.chat, `> Lo siento, hubo un drama interno y no pude procesar tu consulta.`, m)
  }
}

handler.help = ['kar +texto']
handler.tags = ['ai']
handler.command = /^(gpt5|karbot|ia|ask)$/i
handler.group = true

export default handler