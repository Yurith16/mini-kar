const db = require('../database/manager')
const { checkRegistration } = require('./registry')

module.exports = {
  help: ['minar - Minar kryons (cada 5 minutos)'],
  tags: ['economy'],
  command: ['minar', 'mine'],
  register: true,
  group: true,
  handler: async (m, { conn, react }) => {
    try {
      if (!await checkRegistration(m, conn)) return
      
      await react('⚙️')
      
      const userId = m.sender.split('@')[0]
      const user = db.getUserData(userId)
      
      const ahora = Date.now()
      const ultimoMinar = user.ultimoMinar || 0
      const tiempoRestante = 5 * 60 * 1000 - (ahora - ultimoMinar)
      
      if (tiempoRestante > 0) {
        const minutos = Math.floor(tiempoRestante / 60000)
        const segundos = Math.floor((tiempoRestante % 60000) / 1000)
        await react('⏳')
        return conn.sendMessage(m.chat, { 
          text: `⏳ *espera ${minutos}m ${segundos}s*\npara minar again` 
        }, { quoted: m })
      }
      
      const kryonsGanados = Math.floor(Math.random() * 30) + 20
      const diamantesRaros = Math.random() < 0.3 ? 1 : 0
      const expGanada = 8
      
      db.incrementUserField(userId, 'kryons', kryonsGanados)
      if (diamantesRaros > 0) db.incrementUserField(userId, 'diamantes', diamantesRaros)
      db.incrementUserField(userId, 'exp', expGanada)
      db.updateUserField(userId, 'ultimoMinar', ahora)
      
      let mensaje = `⛏️ *minería exitosa*\n\n` +
        `🪙 *kryons:* +${kryonsGanados}\n` +
        `🧬 *exp:* +${expGanada}\n`
      
      if (diamantesRaros > 0) {
        mensaje += `💎 *diamante:* +${diamantesRaros} ✨\n`
      }
      
      mensaje += `\n🩷 _vuelve en 5 minutos_`
      
      await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m })
      await react('✅')
      
    } catch (e) {
      console.error(e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error*' }, { quoted: m })
    }
  }
}