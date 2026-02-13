import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isBotAdmin }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return
  
  if (!m.isGroup) {
    await m.react('❌')
    return m.reply('> Solo funciona en grupos.')
  }

  if (!isAdmin) {
    await m.react('🚫')
    return m.reply('> Solo administradores.')
  }

  if (!global.antilink) global.antilink = {}
  const action = args[0]?.toLowerCase()

  if (!action) {
    await m.react('🌿')
    return m.reply(`> Antilink ${global.antilink[m.chat] ? 'activado' : 'desactivado'}\n\n> Uso: ${usedPrefix}antilink [on/off]`)
  }

  if (action === 'on') {
    global.antilink[m.chat] = true
    // Reacción inicial
    await m.react('🔧')
    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')
    m.reply('> Antilink activado')
    
  } else if (action === 'off') {
    delete global.antilink[m.chat]
    // Reacción inicial
    await m.react('🔧')
    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')
    m.reply('> Antilink desactivado')
  }
}

handler.before = async (m, { conn, isAdmin, isBotAdmin }) => {
  if (m.isBaileys || !m.isGroup || isAdmin || !global.antilink?.[m.chat]) return
  
  const text = m.text || m.caption || ''
  if (!text) return

  // TODOS los enlaces prohibidos
  const links = /https?:\/\/[^\s]*|www\.[^\s]*|wa\.me\/[0-9]+|chat\.whatsapp\.com\/[A-Za-z0-9]+|t\.me\/[^\s]*|instagram\.com\/[^\s]*|facebook\.com\/[^\s]*|youtube\.com\/[^\s]*|youtu\.be\/[^\s]*|twitter\.com\/[^\s]*|x\.com\/[^\s]*|discord\.gg\/[^\s]*|tiktok\.com\/[^\s]*|bit\.ly\/[^\s]*|tinyurl\.com\/[^\s]*|goo\.gl\/[^\s]*|ow\.ly\/[^\s]*|buff\.ly\/[^\s]*|adf\.ly\/[^\s]*|shorte\.st\/[^\s]*|snip\.ly\/[^\s]*|cutt\.ly\/[^\s]*|is\.gd\/[^\s]*|v\.gd\/[^\s]*|cli\.gs\/[^\s]*|bc\.vc\/[^\s]*|tr\.im\/[^\s]*|prettylink\.pro\/[^\s]*|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/gi
  
  if (links.test(text)) {
    try {
      // Eliminar mensaje inmediatamente
      if (isBotAdmin && m.key) {
        await conn.sendMessage(m.chat, { 
          delete: { 
            remoteJid: m.chat, 
            fromMe: false, 
            id: m.key.id, 
            participant: m.sender 
          } 
        })
      }

      // Expulsar usuario inmediatamente
      if (isBotAdmin) {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
      }

    } catch (error) {}
  }
}

handler.help = ['antilink']
handler.tags = ['group']
handler.command = ['antilink']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler