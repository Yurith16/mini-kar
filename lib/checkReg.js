/**
 * Verifica si un usuario está registrado
 * @param {Object} m - Mensaje
 * @param {Object} user - Usuario de DB
 * @returns {Boolean} - true si NO está registrado
 */
export async function checkReg(m, user) {
  if (!user?.registered) {
    await m.reply(`> *REGISTRATE PRIMERO*\n\nUsa: .reg nombre.edad\nEjemplo: .reg Kar.20`)
    return true
  }
  return false
}