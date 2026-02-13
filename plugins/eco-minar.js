import { checkReg } from '../lib/checkReg.js'

// Secuencia de hojitas y reacciones para el estilo KarBot
const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🌿', '🍃', '🍀', '🌱', '🌼', '🌸', '🌺', '💮', '🥀', '🌻', '🌹', '🌷', '🏵️']

function getLeaf() {
    return HOJITAS[Math.floor(Math.random() * HOJITAS.length)]
}

function getReact() {
    return REACCIONES[Math.floor(Math.random() * REACCIONES.length)]
}

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]

  // Verificación de registro
  if (await checkReg(m, user)) return

  // Cooldown de 5 minutos (300,000 ms)
  let cooldown = 300000 
  let time = (user.lastmiming || 0) + cooldown
  if (new Date() - (user.lastmiming || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Vuelve en: **${msToTime(time - new Date())}**`)
  }

  // Recompensas
  let coinHasil = Math.floor(Math.random() * 500)
  let expHasil = Math.floor(Math.random() * 600)
  let diamondHasil = Math.floor(Math.random() * 3)
  
  // Reacción aleatoria de KarBot
  await m.react(getReact())

  // Actualización de datos
  user.coin = (user.coin || 0) + coinHasil
  user.exp = (user.exp || 0) + expHasil
  user.diamond = (user.diamond || 0) + diamondHasil
  user.lastmiming = new Date() * 1
  
  let h = getLeaf()
  let txt = `${h} *MINERÍA COMPLETADA*\n\n`
  txt += `> 🪙 Coin : +${coinHasil}\n`
  txt += `> ✨ Exp : +${expHasil}\n`
  txt += `> 💎 Diamond : +${diamondHasil}`

  m.reply(txt)
}

handler.help = ['mine']
handler.tags = ['economy']
handler.command = ['minar', 'mine', 'miming'] 
handler.register = true

export default handler

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}