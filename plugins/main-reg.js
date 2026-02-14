const db = require('../database/manager')

module.exports = {
  help: ['reg <nombre> <edad> - Registrarse en el sistema'],
  tags: ['main'],
  command: ['reg', 'registrar', 'register'],
  group: true,
  handler: async (m, { conn, args, react }) => {
    try {
      const userId = m.sender.split('@')[0]
      
      if (db.userExists(userId)) {
        await react('🩷')
        return conn.sendMessage(m.chat, { 
          text: '🩷 *ya estás registrado en mi sistema*' 
        }, { quoted: m })
      }
      
      if (args.length < 2) {
        await react('🌸')
        return conn.sendMessage(m.chat, { 
          text: `🌸 *uso correcto:*\n.reg <nombre> <edad>\n\n✨ *ejemplo:*\n.reg Ana 18` 
        }, { quoted: m })
      }
      
      await react('⚙️')
      
      const nombre = args[0]
      const edad = parseInt(args[1])
      
      if (isNaN(edad) || edad < 5 || edad > 100) {
        await react('🫧')
        return conn.sendMessage(m.chat, { 
          text: '🫧 *ingresa una edad válida (5-100)*' 
        }, { quoted: m })
      }
      
      if (db.registerUser(userId, nombre, edad)) {
        await conn.sendMessage(m.chat, { 
          text: `🩷 *registro exitoso* 🩷\n\n` +
            `✨ *nombre:* ${nombre}\n` +
            `✨ *edad:* ${edad} años\n` +
            `🪙 *kryons:* 100 (bienvenida)\n` +
            `🧬 *experiencia:* 0\n\n` +
            `🫧 _ya puedes usar comandos de economía_` 
        }, { quoted: m })
        await react('✅')
      }
      
    } catch (e) {
      console.error(e)
      await react('❌')
      conn.sendMessage(m.chat, { text: '🩹 *error en el registro*' }, { quoted: m })
    }
  }
}