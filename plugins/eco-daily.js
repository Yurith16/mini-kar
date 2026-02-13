import { checkReg } from '../lib/checkReg.js'

// Secuencia de hojitas y reacciones estilo KarBot
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

  // Cooldown de 24 horas (86,400,000 ms)
  let cooldown = 86400000 
  let time = (user.lastclaim || 0) + cooldown
  if (new Date() - (user.lastclaim || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Ya has reclamado tu regalo. Vuelve en: **${msToTime(time - new Date())}**`)
  }

  // Recompensas Considerables
  let coinHasil = Math.floor(Math.random() * 2500) + 1000 // 1000 - 3500
  let expHasil = Math.floor(Math.random() * 3000) + 1500 // 1500 - 4500
  let diamondHasil = Math.floor(Math.random() * 10) + 5   // 5 - 15
  
  // Reacción aleatoria de KarBot
  await m.react(getReact())

  // Actualización de datos
  user.coin = (user.coin || 0) + coinHasil
  user.exp = (user.exp || 0) + expHasil
  user.diamond = (user.diamond || 0) + diamondHasil
  user.lastclaim = new Date() * 1
  
  let h = getLeaf()
  let txt = `${h} *RECOMPENSA DIARIA*\n\n`
  txt += `> 🪙 Coin : +${coinHasil}\n`
  txt += `> ✨ Exp : +${expHasil}\n`
  txt += `> 💎 Diamond : +${diamondHasil}`

  m.reply(txt)
}

handler.help = ['daily']
handler.tags = ['economy']
handler.command = ['daily', 'diario', 'recompensa'] 
handler.register = true

export default handler

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

    hours = (hours < 10) ? "0" + hours : hours
    minutes = (minutes < 10) ? "0" + minutes : minutes
    seconds = (seconds < 10) ? "0" + seconds : seconds

    return `${hours}h ${minutes}m ${seconds}s`
}