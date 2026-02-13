import getFacebookDownloadInfo from '../lib/fdownloader.js'
import { checkReg } from '../lib/checkReg.js'

const chooseDownloadable = (formats) =>
  formats.find((item) => item?.url && !item.requiresRender)

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  // Verificación de registro (Estilo KarBot)
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  const targetUrl = text?.trim() || args?.[0]
  if (!targetUrl) {
    return conn.reply(m.chat, `> Debe ingresar un enlace de Facebook.`, m)
  }

  // Secuencia de reacciones para mantener vivo el chat
  const reacciones = ['📥', '⏳', '📡']
  for (const reacc of reacciones) {
    await m.react(reacc)
  }

  try {
    const { formats } = await getFacebookDownloadInfo(targetUrl)

    const directFormats = formats.filter((item) => item?.url && !item.requiresRender)
    if (!directFormats.length) {
      await m.react('❌')
      return conn.reply(m.chat, '> Lo siento, no pude descargar el video', m)
    }

    const chosen = chooseDownloadable(directFormats)

    if (command === 'fbaudio') {
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: chosen.url },
          mimetype: 'audio/mpeg',
          fileName: 'facebook_audio.mp3',
          ptt: false
        },
        { quoted: m }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        {
          video: { url: chosen.url },
          caption: `> Video descargado en calidad: *${chosen.quality || chosen.label}*`
        },
        { quoted: m }
      )
    }

    // Al finalizar con éxito, el engranaje oficial
    await m.react('⚙️')

  } catch (error) {
    await m.react('❌')
    return conn.reply(m.chat, `> Lo siento, no pude descargar el video`, m)
  }
}

handler.help = ['fb + url (facebook)', "fbaudio + url (facebook)"]
handler.tags = ['downloader']
handler.command = ['fb', 'fbaudio']
handler.group = true

export default handler