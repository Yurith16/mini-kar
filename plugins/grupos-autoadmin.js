import { checkReg } from '../lib/checkReg.js'

let autoadminGlobal = global.autoadminGlobal ?? true
global.autoadminGlobal = autoadminGlobal

const handler = async (m, { conn, isAdmin, isBotAdmin, isROwner, usedPrefix, command, args }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return
  
  // 🔒 RESTRICCIÓN TOTAL: Solo el Owner puede usar este comando
  if (!isROwner) {
    await conn.sendMessage(m.chat, { react: { text: '🚫', key: m.key } })
    return m.reply(`> 🔒 *Lo siento, cielo, pero este comando es de uso exclusivo para mi creador.*`)
  }

  // Si el comando está desactivado globalmente (aunque seas owner, por si quieres probar el switch)
  if (!global.autoadminGlobal) {
    return conn.reply(m.chat, '> 🌪️ *Vaya drama... El sistema de autoadmin está desactivado globalmente.*', m)
  }

  // Si el bot no es admin (Sin esto no podemos dar poder)
  if (!isBotAdmin) {
    return conn.reply(m.chat, '> ⚙️ *No puedo darte admin si yo misma no lo soy, corazón.*', m)
  }

  // Si ya eres admin
  if (isAdmin) {
    return conn.reply(m.chat, '> *Pero si ya tienes el mando aquí, cielo. Ya eres admin.*', m)
  }

  try {
    // Reacción de proceso
    await m.react('🔧')
    
    // Promover al Owner
    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote')
    
    // Reacción de éxito
    await m.react('⚙️')
    
    await conn.reply(m.chat, '> ✅ *Privilegios concedidos. Ahora tienes el control total, mi Owner.*', m)

  } catch (error) {
    console.error(error)
    await m.react('❌')
    await conn.reply(m.chat, '> 🌪️ *Hubo un fallo técnico al intentar darte el rango.*', m)
  }
}

handler.help = ['autoadmin']
handler.tags = ['owner']
handler.command = ['autoadmin']
handler.group = true
handler.owner = true // Esto refuerza que solo tú puedas verlo en el menú

export default handler