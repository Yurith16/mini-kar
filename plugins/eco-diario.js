const db = require('../database/manager')
const { checkRegistration } = require('./registry')

module.exports = {
  help: ['daily - Recompensa diaria'],
  tags: ['economy'],
  command: ['daily', 'diario'],
  register: true,
  group: true,
  handler: async (m, { conn, react }) => {
    try {
      if (!await checkRegistration(m, conn)) return
      
      await react('⚙️')
      
      const userId = m.sender.split('@')[0]
      const user = db.getUserData(userId)
      
      const hoy = new Date().toDateString()
      const ultimoDaily = user.ultimoDaily || ''
      
      if (ultimoDaily === hoy) {
        await react('🩷')
        return conn.sendMessage(m.chat, { 
          text: '🩷 *ya reclamaste hoy*\nvuelve mañana' 
        }, { quoted: m })
      }
      
      // Recompensa base
      const kryonsBase = 50
      const diamantesBase = 2
      const expBase = 15
      
      // Bonus por racha (si implementamos después)
      db.incrementUserField(userId, 'kryons', kryonsBase)
      db.incrementUserField(userId, 'diamantes', diamantesBase)
      db.incrementUserField(userId, 'exp', expBase)
      db.updateUserField(userId, 'ultimoDaily', hoy)
      
      await conn.sendMessage(m.chat, { 
        text: `🌸 *recompensa diaria*\n\n` +
          `🪙 *kryons:* +${kryonsBase}\n` +
          `💎 *diamantes:* +${diamantesBase}\n` +
          `🧬 *experiencia:* +${expBase}\n\n` +
          `🩷 _vuelve mañana_` 
      }, { quoted: m })
      
      await react('✅')
      
    } catch (e) {
      console.error(e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error*' }, { quoted: m })
    }
  }
}