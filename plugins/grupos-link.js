import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, isBotAdmin }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return
  
  if (!m.isGroup) return
  if (!isBotAdmin) return

  try {
    // Reacción inicial con planta
    await m.react('🌱')
    
    const groupCode = await conn.groupInviteCode(m.chat)
    const inviteLink = `https://chat.whatsapp.com/${groupCode}`
    
    // Mensaje minimalista con estilo KarBot
    await conn.reply(m.chat, 
`> 🌿 *Enlace del grupo*

> ${inviteLink}

> 🍀 Comparte con quien desees.`, m)
    
    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')

  } catch (error) {
    await m.react('❌')
  }
}

handler.help = ['link']
handler.tags = ['group']
handler.command = ['link']
handler.group = true
handler.botAdmin = true

export default handler