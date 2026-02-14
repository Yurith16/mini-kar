const db = require('../database/manager')
const { checkRegistration } = require('./registry')

module.exports = {
  help: ['minar2 - Minar diamantes (nivel 10+, cada 10 min)'],
  tags: ['economy'],
  command: ['minar2', 'mine2'],
  register: true,
  group: true,
  handler: async (m, { conn, react }) => {
    try {
      if (!await checkRegistration(m, conn)) return
      
      await react('⚙️')
      
      const userId = m.sender.split('@')[0]
      const user = db.getUserData(userId)
      
      if (user.nivel < 10) {
        await react('🌱')
        return conn.sendMessage(m.chat, { 
          text: '🌱 *necesitas nivel 10*\npara usar minar2' 
        }, { quoted: m })
      }
      
      const ahora = Date.now()
      const ultimoMinar2 = user.ultimoMinar2 || 0
      const tiempoRestante = 10 * 60 * 1000 - (ahora - ultimoMinar2)
      
      if (tiempoRestante > 0) {
        const minutos = Math.floor(tiempoRestante / 60000)
        const segundos = Math.floor((tiempoRestante % 60000) / 1000)
        await react('⏳')
        return conn.sendMessage(m.chat, { 
          text: `⏳ *espera ${minutos}m ${segundos}s*\npara minar again` 
        }, { quoted: m })
      }
      
      const kryonsGanados = Math.floor(Math.random() * 60) + 40
      const diamantesGanados = Math.floor(Math.random() * 3) + 1
      const expGanada = 15
      
      db.incrementUserField(userId, 'kryons', kryonsGanados)
      db.incrementUserField(userId, 'diamantes', diamantesGanados)
      db.incrementUserField(userId, 'exp', expGanada)
      db.updateUserField(userId, 'ultimoMinar2', ahora)
      
      await conn.sendMessage(m.chat, { 
        text: `💎 *minería profunda*\n\n` +
          `🪙 *kryons:* +${kryonsGanados}\n` +
          `💎 *diamantes:* +${diamantesGanados}\n` +
          `🧬 *exp:* +${expGanada}\n\n` +
          `🩷 _vuelve en 10 minutos_` 
      }, { quoted: m })
      
      await react('✅')
      
    } catch (e) {
      console.error(e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error*' }, { quoted: m })
    }
  }
}