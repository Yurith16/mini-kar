import { checkReg } from '../lib/checkReg.js'

const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin, usedPrefix, command }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return
  
  if (!m.isGroup) {
    await m.react('❌')
    return conn.reply(m.chat, '> Solo funciona en grupos.', m)
  }

  if (!isBotAdmin) {
    await m.react('🌱')
    return conn.reply(m.chat, '> Necesito ser admin.', m)
  }

  if (!isAdmin) {
    await m.react('🍀')
    return conn.reply(m.chat, '> Solo administradores.', m)
  }

  try {
    let targetUser = null
    
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetUser = m.mentionedJid[0]
    } else if (m.quoted) {
      targetUser = m.quoted.sender
    }

    if (!targetUser) {
      await m.react('❓')
      return conn.reply(m.chat, '> Menciona o responde a un usuario.', m)
    }

    const userInGroup = participants.find(p => 
      p.id === targetUser || 
      p.jid === targetUser
    )

    if (!userInGroup) {
      await m.react('❌')
      return conn.reply(m.chat, '> El usuario no está en el grupo.', m)
    }

    if (userInGroup.admin === 'admin' || userInGroup.admin === 'superadmin') {
      await m.react('ℹ️')
      return conn.reply(m.chat, '> El usuario ya es administrador.', m)
    }

    // Reacción de procesamiento con hojita
    await m.react('🍃')
    
    await conn.groupParticipantsUpdate(m.chat, [targetUser], 'promote')
    
    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')
    
    await conn.reply(m.chat, '> 🍃 Usuario promovido a administrador.', m)

  } catch (error) {
    await m.react('❌')
    
    if (error.message?.includes('not authorized')) {
      return conn.reply(m.chat, '> Sin permisos suficientes para esta acción.', m)
    } else if (error.message?.includes('not in group')) {
      return conn.reply(m.chat, '> El usuario no está en el grupo.', m)
    } else {
      return conn.reply(m.chat, '> Lo siento, hubo un error.', m)
    }
  }
}

handler.help = ['promote']
handler.tags = ['group']
handler.command = /^(promote)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler