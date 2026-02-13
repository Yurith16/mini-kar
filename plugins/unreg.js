import { saveDatabase } from '../lib/db.js'

let handler = async (m, { conn, usedPrefix }) => {
  let who = m.sender
  let user = global.db.data.users[who]

  if (!user || !user.registered) {
    await m.react('🥀')
    return m.reply(`> 🎀 *Aviso:* No tienes un registro activo para eliminar.`)
  }

  // Restricción de 7 días
  let sieteDias = 7 * 24 * 60 * 60 * 1000
  if (new Date() - user.lastUnreg < sieteDias) {
    let faltan = Math.ceil((sieteDias - (new Date() - user.lastUnreg)) / (1000 * 60 * 60 * 24))
    return m.reply(`> 🥀 *Aviso:* Podrás anular tu registro nuevamente en **${faltan} días**.`)
  }

  user.registered = false
  user.registeredName = ""
  user.age = 0
  user.genre = ""
  user.colorFav = ""
  user.animalFav = ""
  user.cumple = ""
  user.lastUnreg = new Date() * 1 

  await m.react('💔')

  let txt = `> 🥀 *𝚁𝙴𝙶𝙸𝚂𝚃𝚁𝙾 𝙰𝙽𝚄𝙻𝙰𝙳𝙾*\n`
  txt += `> Tus datos de identidad han sido eliminados del sistema.\n`
  txt += `> Puedes registrarte de nuevo usando *${usedPrefix}reg*.\n`
  txt += `> _Se han conservado tus monedas y nivel._`

  await conn.sendMessage(m.chat, { 
    text: txt,
    contextInfo: {
      externalAdReply: {
        title: '💔 VÍNCULO ELIMINADO',
        body: 'KarBot System',
        thumbnailUrl: 'https://i.postimg.cc/63HSmCvV/1757985995273.png',
        mediaType: 1
      }
    }
  }, { quoted: m })

  await saveDatabase()
}

handler.help = ['unreg']
handler.tags = ['main']
handler.command = /^(unreg|anular)$/i

export default handler