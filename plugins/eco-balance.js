const db = require('../database/manager')
const { checkRegistration } = require('./registry')

module.exports = {
  help: ['balance - Ver tu balance completo'],
  tags: ['economy'],
  command: ['balance', 'bal', 'kryons'],
  register: true,
  group: true,
  handler: async (m, { conn, react }) => {
    try {
      if (!await checkRegistration(m, conn)) return
      
      await react('⚙️')
      
      const userId = m.sender.split('@')[0]
      const user = db.getUserData(userId)
      
      const kryons = user.kryons || 0
      const diamantes = user.diamantes || 0
      const banco = user.banco || 0
      const exp = user.exp || 0
      const nivel = user.nivel || 1
      
      const totalGeneral = kryons + diamantes + banco
      const totalCartera = kryons + diamantes
      
      const expBase = (nivel - 1) * 100
      const expSiguiente = nivel * 100
      const expNecesaria = expSiguiente - expBase
      const expProgreso = Math.max(0, exp - expBase)
      const progreso = Math.min(100, Math.floor((expProgreso / expNecesaria) * 100))
      
      let txt = `┌───「 *BALANCE* 」\n`
      txt += `▢ *👤 ${user.nombre}*\n`
      txt += `\n`
      txt += `▢ *💼 CARTERA*\n`
      txt += `  🪙 Kryons: ${kryons.toLocaleString()}\n`
      txt += `  💎 Diamantes: ${diamantes.toLocaleString()}\n`
      txt += `  💰 Total: ${totalCartera.toLocaleString()}\n`
      txt += `\n`
      txt += `▢ *🏦 BANCO*\n`
      txt += `  💳 Depositado: ${banco.toLocaleString()}\n`
      txt += `\n`
      txt += `▢ *📊 PROGRESO*\n`
      txt += `  🧬 Exp: ${exp.toLocaleString()}\n`
      txt += `  🆙 Nivel: ${nivel}\n`
      txt += `  📈 Progreso: ${progreso}%\n`
      txt += `\n`
      txt += `▢ *💰 PATRIMONIO*\n`
      txt += `  💵 Total: ${totalGeneral.toLocaleString()}\n`
      txt += `└──────────────\n`
      txt += `🩷 _con cariño, kar_`

      await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
      await react('✅')
      
    } catch (e) {
      console.error('Error en balance:', e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error al cargar balance*' }, { quoted: m })
    }
  }
}