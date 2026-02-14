const db = require('../database/manager')
const { checkRegistration } = require('./registry')

module.exports = {
  help: ['with <cantidad> - Retirar kryons del banco'],
  tags: ['economy'],
  command: ['with', 'retirar'],
  register: true,
  group: true,
  handler: async (m, { conn, args, react }) => {
    try {
      if (!await checkRegistration(m, conn)) return
      
      await react('⚙️')
      
      if (args.length < 1) {
        await react('🌸')
        return conn.sendMessage(m.chat, { 
          text: '🌸 *uso:* .with <cantidad>\n.ej: .with 100' 
        }, { quoted: m })
      }
      
      const userId = m.sender.split('@')[0]
      const user = db.getUserData(userId)
      
      let cantidad = args[0].toLowerCase()
      
      if (cantidad === 'all' || cantidad === 'todo') {
        cantidad = user.banco
      } else {
        cantidad = parseInt(cantidad)
      }
      
      if (isNaN(cantidad) || cantidad <= 0) {
        await react('🫧')
        return conn.sendMessage(m.chat, { 
          text: '🫧 *cantidad inválida*' 
        }, { quoted: m })
      }
      
      if (user.banco < cantidad) {
        await react('🩹')
        return conn.sendMessage(m.chat, { 
          text: `🩹 *no tienes suficientes kryons en el banco*\nbanco: ${user.banco}` 
        }, { quoted: m })
      }
      
      db.decrementUserField(userId, 'banco', cantidad)
      db.incrementUserField(userId, 'kryons', cantidad)
      db.incrementUserField(userId, 'exp', 3)
      
      await conn.sendMessage(m.chat, { 
        text: `🏦 *retiro exitoso*\n\n` +
          `└ ✦ *cantidad:* ${cantidad.toLocaleString()} kryons\n` +
          `└ ✦ *banco restante:* ${(user.banco - cantidad).toLocaleString()}\n` +
          `└ ✦ *cartera:* ${(user.kryons + cantidad).toLocaleString()}\n` +
          `🧬 *experiencia:* +3\n` +
          `🩷 _con cariño, kar_` 
      }, { quoted: m })
      
      await react('✅')
      
    } catch (e) {
      console.error('Error en with:', e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error*' }, { quoted: m })
    }
  }
}