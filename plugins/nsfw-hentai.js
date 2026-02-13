import fetch from 'node-fetch'
import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  let chat = global.db.data.chats[m.chat]
  let user = global.db.data.users[m.sender]

  if (await checkReg(m, user)) return

  if (!chat.nsfw) {
    await m.react('🔞')
    return m.reply(`> 🔞 *𝙽𝚂𝙵𝚆 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*`)
  }

  const v = verificarSaldoNSFW(m.sender, 'fuerte')
  if (!v.success) {
    await m.react('🎟️')
    return m.reply(v.mensajeError)
  }

  try {
    await m.react('🔥')

    const api = `https://api.vreden.my.id/api/v1/random/hentai`
    const response = await fetch(api)
    const res = await response.json()

    if (!res.status || !res.result || res.result.length === 0) {
      await m.react('❌')
      return
    }

    const item = res.result[Math.floor(Math.random() * res.result.length)]
    
    // Procesar pago (Nivel fuerte)
    procesarPagoNSFW(m.sender, 'fuerte')

    // Único texto permitido
    const caption = `🔥 𝙲𝚘𝚜𝚝𝚘: 5 HotPass`

    if (item.type === 'video/mp4') {
      await conn.sendMessage(m.chat, { 
        video: { url: item.video_1 }, 
        caption: caption,
        mimetype: 'video/mp4'
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, { 
        image: { url: item.video_1 },
        caption: caption
      }, { quoted: m })
    }

    await m.react('🔥')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    m.reply(`> 🥀 Falló la descarga. Tus pases están a salvo.`)
  }
}

handler.help = ['hentai']
handler.tags = ['NSFW'];
handler.command = ['sfm', 'hentai']
handler.register = true 
handler.nsfw = true 

export default handler