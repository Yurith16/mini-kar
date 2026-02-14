const db = require('../database/manager')
const { checkRegistration } = require('./registry')

module.exports = {
  help: ['perfil - Ver tu perfil'],
  tags: ['main'],
  command: ['perfil', 'profile', 'me'],
  register: true,
  group: true,
  handler: async (m, { conn, react }) => {
    try {
      if (!await checkRegistration(m, conn)) return
      
      await react('⚙️')
      
      let who = m.quoted ? m.quoted.sender : 
                m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : 
                m.sender
      
      const userId = who.split('@')[0]
      let user = db.getUserData(userId)
      
      if (!user) {
        await react('🌸')
        return conn.sendMessage(m.chat, { 
          text: `🌸 *@${userId} no está registrado*`,
          mentions: [who]
        }, { quoted: m })
      }

      const expActual = user.exp || 0
      const nivelActual = user.nivel || 1
      const expBase = (nivelActual - 1) * 100
      const expSiguiente = nivelActual * 100
      const expNecesaria = expSiguiente - expBase
      const expProgreso = Math.max(0, expActual - expBase)
      const progreso = Math.min(100, Math.floor((expProgreso / expNecesaria) * 100))

      let txt = `┌───「 *PERFIL* 」\n`
      txt += `▢ *👤 Nombre:* ${user.nombre}\n`
      txt += `▢ *📱 Número:* ${userId}\n`
      txt += `▢ *📍 Edad:* ${user.edad} años\n`
      txt += `\n`
      txt += `▢ *🪙 Kryons:* ${(user.kryons || 0).toLocaleString()}\n`
      txt += `▢ *💎 Diamantes:* ${(user.diamantes || 0).toLocaleString()}\n`
      txt += `▢ *💰 Total:* ${((user.kryons || 0) + (user.diamantes || 0)).toLocaleString()}\n`
      txt += `\n`
      txt += `▢ *🧬 Experiencia:* ${user.exp || 0}\n`
      txt += `▢ *🆙 Nivel:* ${user.nivel || 0}\n`
      txt += `▢ *📊 Progreso:* ${progreso}%\n`
      txt += `└──────────────\n`
      txt += `🩷 _con cariño, kar_`

      await conn.sendMessage(m.chat, { 
        text: txt,
        mentions: who !== m.sender ? [who] : []
      }, { quoted: m })
      
      await react('✅')
      
    } catch (e) {
      console.error(e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error*' }, { quoted: m })
    }
  }
}