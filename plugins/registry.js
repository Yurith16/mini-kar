const db = require('../database/manager')

/**
 * Middleware para verificar si el usuario está registrado
 * @param {Object} m - Mensaje
 * @param {Object} conn - Conexión
 * @returns {Boolean} - true si está registrado, false si no
 */
async function checkRegistration(m, conn) {
  const userId = m.sender.split('@')[0]
  const user = db.getUserData(userId)
  
  if (!user) {
    await conn.sendMessage(m.chat, { 
      text: '🌸 *regístrate primero*\n.usar .reg <nombre> <edad>' 
    }, { quoted: m })
    await conn.sendMessage(m.chat, { 
      react: { text: '🌸', key: m.key } 
    })
    return false
  }
  
  return true
}

module.exports = {
  checkRegistration
}