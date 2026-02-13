import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  if (await checkReg(m, user)) return
  
  try {
    await m.react('🍃')
    
    // Enviar imagen con mensaje breve
    await conn.sendMessage(m.chat, {
      image: { url: "https://image2url.com/images/1765485895849-14e8c32d-ea3e-4b5b-9faf-67f5c8c97757.jpg" },
      caption: '> https://wa.me/50496926150\n\n> Para consultas.'
    }, { quoted: m })
    
    await m.react('⚙️')
    
  } catch (e) {
    await m.react('❌')
  }
}

handler.command = ["owner", "creador"]
handler.tags = ["info"]

export default handler