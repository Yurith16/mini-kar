import { checkReg } from '../lib/checkReg.js'

const handler = async (m, { conn, participants, isAdmin, isBotAdmin }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  if (await checkReg(m, user)) return
  
  if (!m.isGroup) return
  
  if (!isBotAdmin) {
    await m.react('🌱')
    return
  }
  
  if (!isAdmin) {
    await m.react('🍀')
    return
  }

  let targetUser = m.quoted?.sender || (m.mentionedJid && m.mentionedJid[0])
  
  if (!targetUser) {
    await m.react('❓')
    return conn.reply(m.chat, '> Menciona a un admin.', m)
  }

  const userInGroup = participants.find(p => p.id === targetUser)
  if (!userInGroup) {
    await m.react('❌')
    return conn.reply(m.chat, '> No está en el grupo.', m)
  }

  if (userInGroup.admin === 'superadmin') {
    await m.react('⚠️')
    return conn.reply(m.chat, '> No puedo quitar admin al creador.', m)
  }

  if (userInGroup.admin !== 'admin') {
    await m.react('ℹ️')
    return conn.reply(m.chat, '> No es admin.', m)
  }

  await m.react('🔧')

  try {
    await conn.groupParticipantsUpdate(m.chat, [targetUser], 'demote')
    
    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')
    
    await conn.reply(m.chat, '> 🍃 Admin removido.', m)
    
  } catch (error) {
    await m.react('❌')
    await conn.reply(m.chat, '> Lo siento, hubo un error.', m)
  }
}

handler.help = ['demote']
handler.tags = ['group']
handler.command = /^(demote|quitaradmin)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler