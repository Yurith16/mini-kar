const db = require('../database/manager')
const { checkRegistration } = require('./registry')

const trabajos = [
  { nombre: 'mesero', pago: 25 },
  { nombre: 'repartidor', pago: 30 },
  { nombre: 'cajero', pago: 28 },
  { nombre: 'profesor', pago: 35 },
  { nombre: 'mecánico', pago: 32 },
  { nombre: 'pintor', pago: 27 },
  { nombre: 'jardinero', pago: 22 },
  { nombre: 'taxista', pago: 33 },
  { nombre: 'cocinero', pago: 29 },
  { nombre: 'masajista', pago: 40 },
  { nombre: 'programador', pago: 45 },
  { nombre: 'diseñador', pago: 38 }
]

module.exports = {
  help: ['work - Trabajar para ganar kryons (cada 15 min)'],
  tags: ['economy'],
  command: ['work', 'trabajar'],
  register: true,
  group: true,
  handler: async (m, { conn, react }) => {
    try {
      if (!await checkRegistration(m, conn)) return
      
      await react('⚙️')
      
      const userId = m.sender.split('@')[0]
      const user = db.getUserData(userId)
      
      const ahora = Date.now()
      const ultimoWork = user.ultimoWork || 0
      const tiempoRestante = 15 * 60 * 1000 - (ahora - ultimoWork)
      
      if (tiempoRestante > 0) {
        const minutos = Math.floor(tiempoRestante / 60000)
        const segundos = Math.floor((tiempoRestante % 60000) / 1000)
        await react('⏳')
        return conn.sendMessage(m.chat, { 
          text: `⏳ *descansa ${minutos}m ${segundos}s*\npara trabajar again` 
        }, { quoted: m })
      }
      
      const trabajo = trabajos[Math.floor(Math.random() * trabajos.length)]
      const bonusNivel = Math.floor(user.nivel / 2)
      const pagoTotal = trabajo.pago + bonusNivel
      const encuentraDiamante = Math.random() < 0.05
      
      db.incrementUserField(userId, 'kryons', pagoTotal)
      if (encuentraDiamante) db.incrementUserField(userId, 'diamantes', 1)
      db.incrementUserField(userId, 'exp', 12)
      db.updateUserField(userId, 'ultimoWork', ahora)
      
      let mensaje = `💼 *trabajo completado*\n\n` +
        `🧑‍💻 *trabajaste como:* ${trabajo.nombre}\n` +
        `🪙 *pago:* ${pagoTotal} kryons\n` +
        `🧬 *exp:* +12\n`
      
      if (encuentraDiamante) {
        mensaje += `💎 *hallazgo:* +1 diamante ✨\n`
      }
      
      mensaje += `\n🩷 _vuelve en 15 minutos_`
      
      await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m })
      await react('✅')
      
    } catch (e) {
      console.error(e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error*' }, { quoted: m })
    }
  }
}