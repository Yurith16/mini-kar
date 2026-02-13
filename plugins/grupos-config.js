import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command, isAdmin, isBotAdmin }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return
  
  // Verificar si es admin
  if (!isAdmin) {
    await m.react('🚫')
    return conn.reply(m.chat, '> Solo administradores.', m)
  }
  
  // Verificar si el bot es admin
  if (!isBotAdmin) {
    await m.react('❌')
    return conn.reply(m.chat, '> Necesito ser admin.', m)
  }

  try {
    // Reacción de procesamiento
    await m.react('🔧')
    
    // Determinar acción según el comando
    if (command === 'abrir') {
      await conn.groupSettingUpdate(m.chat, 'not_announcement')
      await m.react('⚙️')
      await conn.reply(m.chat, '> Grupo abierto', m)
      
    } else if (command === 'cerrar') {
      await conn.groupSettingUpdate(m.chat, 'announcement')
      await m.react('⚙️')
      await conn.reply(m.chat, '> Grupo cerrado', m)
    }

  } catch (error) {
    await m.react('❌')
    await conn.reply(m.chat, '> Lo siento, hubo un error.', m)
  }
}

handler.help = ['abrir',"cerrar"]
handler.tags = ['group']
handler.command = ['abrir', 'cerrar']
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler