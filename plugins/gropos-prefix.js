import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isOwner, groupMetadata }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return
  
  if (!m.isGroup) {
    await m.react('❌')
    return conn.reply(m.chat, '> Solo funciona en grupos.', m)
  }

  const chat = global.db.data.chats[m.chat]

  // Verificar si es admin
  const participants = await conn.groupMetadata(m.chat).catch(() => ({ participants: [] }))
  const userParticipant = participants.participants.find(p => p.id === m.sender)
  const isUserAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin')

  if (!isUserAdmin && !isOwner) {
    await m.react('🚫')
    return conn.reply(m.chat, '> Solo administradores.', m)
  }

  const args = text.split(' ')
  const subcmd = args[0]?.toLowerCase()

  if (command === 'setprefix') {
    if (!subcmd) {
      // Reacción de información
      await m.react('🌿')
      
      const currentPrefix = chat.prefix || 'Prefijo global'
      
      let mensaje = `> Prefijo actual: ${currentPrefix}\n\n`
      mensaje += `> Uso: ${usedPrefix}setprefix [prefijo]\n`
      mensaje += `> Ejemplo: ${usedPrefix}setprefix !`
      
      return conn.reply(m.chat, mensaje, m)
    }

    const newPrefix = args[0]

    // Validaciones
    if (newPrefix.length > 3) {
      await m.react('❌')
      return conn.reply(m.chat, '> Máximo 3 caracteres.', m)
    }

    if (newPrefix.includes(' ')) {
      await m.react('❌')
      return conn.reply(m.chat, '> Sin espacios.', m)
    }

    // Reacción de procesamiento
    await m.react('🔧')

    // Guardar el prefijo
    chat.prefix = newPrefix

    // Si no existe el array de prefijos, crearlo
    if (!chat.prefixes) chat.prefixes = []

    // Agregar a la lista de prefijos personalizados si no existe
    if (!chat.prefixes.includes(newPrefix)) {
      chat.prefixes.push(newPrefix)
    }

    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')

    return conn.reply(m.chat, `> Prefijo cambiado a: ${newPrefix}`, m)

  } else if (command === 'delprefix') {
    // Reacción de procesamiento
    await m.react('🔧')
    
    // Quitar prefijo personalizado
    if (chat.prefix) {
      const oldPrefix = chat.prefix
      chat.prefix = null

      // Remover de la lista de prefijos personalizados
      if (chat.prefixes) {
        const index = chat.prefixes.indexOf(oldPrefix)
        if (index > -1) {
          chat.prefixes.splice(index, 1)
        }
      }

      // El engranaje final de KarBot ⚙️
      await m.react('⚙️')

      return conn.reply(m.chat, '> Prefijo eliminado.', m)
    } else {
      await m.react('ℹ️')
      return conn.reply(m.chat, '> Ya usa prefijos globales.', m)
    }
  }
}

handler.help = ['setprefix', 'delprefix']
handler.tags = ['group']
handler.command = ['setprefix', 'delprefix']
handler.group = true

export default handler