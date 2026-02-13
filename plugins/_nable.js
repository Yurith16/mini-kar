import fetch from "node-fetch"
import { saveDatabase } from "../lib/db.js"

let handler = async (m, { conn, usedPrefix, command, args }) => {
  await m.react('⚙️')

  let isEnable = /true|enable|(turn)?on|1|activar|on/i.test(command)
  let type = (args[0] || '').toLowerCase()
  let chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  let settings = global.db.data.settings || (global.db.data.settings = {})
  let bot = settings[conn.user.jid] || (settings[conn.user.jid] = {})

  const imageUrl = "https://image2url.com/r2/default/images/1768346184993-24cd2f90-2aa6-4ebd-8adf-067a4cdf67a0.jpeg"
  
  const listMessage = {
    image: { url: imageUrl },
    caption: `*${global.botname}*

*Uso del comando:*
*Ejemplo:* ${usedPrefix}on welcome
*Descripción:* Activa o desactiva funciones del bot.

*Funciones disponibles:*
• *antifake*
• *antibot*
• *welcome*
• *public*
• *chatbot*
• *nsfw*
• *autosticker*
• *antidelete*
• *autolevelup*
• *detect*
• *antiviewonce*
• *antisticker*
• *modoadmin*

Usa *${usedPrefix}on* o *${usedPrefix}off* seguido de la opción.`
  }

  if (!args[0]) return conn.sendMessage(m.chat, listMessage, { quoted: m })

  let isAll = false
  const isOwner = m.fromMe || global.owner.map(v => v[0]).includes(m.sender.split('@')[0])
  const isAdmin = m.isAdmin

  switch (type) {
    case 'welcome':
    case 'bienvenida':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.welcome = isEnable
      break
    case 'public':
      isAll = true
      if (!isOwner) return global.dfail('rowner', m, conn)
      bot.public = isEnable
      break
    case 'nsfw':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.nsfw = isEnable
      break
    case 'antidelete':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.delete = isEnable
      break
    case 'chatbot':
      chat.chatbot = isEnable
      break
    case 'modoadmin':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.modoadmin = isEnable
      break
    case 'antifake':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.antifake = isEnable
      break
    case 'autolevelup':
      chat.autolevelup = isEnable
      break
    case 'detect':
      chat.detect = isEnable
      break
    case 'antiviewonce':
      chat.antiviewonce = isEnable
      break
    case 'antisticker':
      if (m.isGroup && !(isAdmin || isOwner)) return global.dfail('admin', m, conn)
      chat.antiSticker = isEnable
      break
    default:
      return conn.sendMessage(m.chat, listMessage, { quoted: m })
  }

  try { await saveDatabase() } catch {}

  m.reply(`*${type}* ha sido ${isEnable ? '*on*' : '*off*'} con exito.`)
}

handler.help = ['en', 'dis']
handler.tags = ['owner']
handler.command = /^((en|dis)able|(tru|fals)e|(turn)?o(n|ff)|[01])$/i

export default handler