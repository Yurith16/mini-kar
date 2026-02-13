let handler = async (m, { conn, participants, usedPrefix, command }) => {
  let mentionedJid = await m.mentionedJid
  let user = mentionedJid && mentionedJid.length ? mentionedJid[0] : m.quoted && await m.quoted.sender ? await m.quoted.sender : null
  
  if (!user) return

  try {
    const groupInfo = await conn.groupMetadata(m.chat)
    const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'

    if (user === conn.user.jid) return
    if (user === ownerGroup) return
    if (user === ownerBot) return

    await m.react('🕒')
    
    // Expulsar al usuario
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
    
    await m.react('✅')

  } catch (e) {
    await m.react('❌')
  }
}

handler.help = ['kick']
handler.tags = ['group']
handler.command = ['kick']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler