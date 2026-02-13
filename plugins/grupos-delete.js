import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, isGroup }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return

  if (!m.quoted) return

  try {
    const botJid = conn.decodeJid(conn.user.id)
    const senderJid = conn.decodeJid(m.sender)
    const quoted = m.quoted
    const quotedJid = conn.decodeJid(quoted.sender)

    const stanzaId = quoted.id
    const participant = quoted.participant || quotedJid

    if (!stanzaId || !participant) return

    // Reacción de procesamiento
    await m.react('🔧')

    if (quotedJid === botJid) {
      // Eliminar mensaje propio
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: true,
          id: stanzaId
        }
      })
    } else {
      if (isGroup) {
        const { participants } = await conn.groupMetadata(m.chat)
        const isAdmin = jid => participants.some(p => p.id === jid && /admin|superadmin/i.test(p.admin || ''))

        if (!isAdmin(senderJid)) {
          await m.react('🚫')
          return
        }

        if (!isAdmin(botJid)) {
          await m.react('❌')
          return
        }
      }
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: stanzaId,
          participant: participant
        }
      })
    }

    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')

  } catch (err) {
    await m.react('❌')
  }
}

handler.help = ['delete']
handler.tags = ['group']
handler.command = ['del', 'delete']
handler.botAdmin = true
handler.admin = true
handler.group = true

export default handler