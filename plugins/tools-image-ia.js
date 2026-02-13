import fetch from 'node-fetch'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // 1. Verificación de registro (Estilo KarBot) 🌿
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  // 2. Validación de texto
  if (!text) {
    return conn.reply(m.chat, `> ¿Qué maravilla quieres que cree para ti hoy, cielo? 🫦\n> *Ejemplo:* \`${usedPrefix + command} cat gris\``, m)
  }

  // 3. Secuencia de reacciones de creación ✨🌿🍀🎨
  const reacciones = ['✨', '🌿', '🍀', '🎨']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    // Usamos la API de Dorratz con el ratio 9:19 solicitado 🫦
    const apiUrl = `https://api.dorratz.com/v3/ai-image?prompt=${encodeURIComponent(text)}&ratio=9:19`
    
    // Al ser un método GET que devuelve la imagen o un JSON, lo manejamos con cuidado
    const res = await fetch(apiUrl)
    
    // Si la API devuelve error de Captcha, esto saltará al catch
    if (!res.ok) throw new Error('Error en la API')

    // Intentamos verificar si es un JSON (por si manda el error de la docu)
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const json = await res.json()
      if (json.data && json.data.status === 'error') {
        throw new Error(json.data.message)
      }
    }

    // --- DISEÑO DE RESPUESTA KARBOT ---
    await conn.sendMessage(m.chat, {
      image: { url: apiUrl },
      caption: `> Aquí tienes tu creación en formato vertical (9:19). ✨\n> *Prompt:* ${text}`
    }, { quoted: m })

    // Sello de ingeniería final ⚙️
    await m.react('⚙️')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    
    // Si sale error de captcha, devolvemos los coins si tuvieras sistema de economía 💋
    return conn.reply(m.chat, `> Hubo un drama con la verificación de la IA (Captcha). Por favor, intenta más tarde o avísale a Hernandez. 🫦`, m)
  }
}

handler.help = ['imagine +texto']
handler.tags = ['ai']
handler.command = /^(imagine|iaimg|draw|crear)$/i
handler.group = true

export default handler