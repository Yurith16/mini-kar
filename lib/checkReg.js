/**
 * Verifica si un usuario está registrado.
 * @param {Object} m - El objeto del mensaje.
 * @param {Object} user - El objeto del usuario de la base de datos.
 * @returns {Boolean} - Retorna true si NO está registrado (para cortar la ejecución).
 */
export const checkReg = async (m, user) => {
  if (!user || !user.registered) {
    await m.react('🚫')
    m.reply(`> 🎀 *Registrate primero para usar mis funciones bb. Usa .reg*`)
    return true // Indica que falta el registro
  }
  return false // Está registrado
}