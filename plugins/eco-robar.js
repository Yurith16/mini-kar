import { checkReg } from '../lib/checkReg.js'

// Estética KarBot
const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🌿', '🍃', '🍀', '🌱', '🌼', '🌸', '🌺', '💮', '🥀', '🌻', '🌹', '🌷', '🏵️']

const FRASES = [
  "Trabajaste como barman en un club de lujo",
  "Limpiaste los servidores de KarBot con éxito",
  "Hiciste de guardaespalda para un político corrupto",
  "Vendiste fotos de tus pies en internet",
  "Fuiste mercenario en una guerra lejana",
  "Ayudaste a una anciana a cruzar la calle (y le robaste)",
  "Trabajaste turnos extra en una cafetería",
  "Hackeaste una cuenta bancaria pequeña",
  "Fuiste repartidor de comida bajo la lluvia",
  "Diste clases particulares de programación",
  "Trabajaste como extra en una película de drama",
  "Recogiste basura en la playa"
]

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }
function getWork() { return FRASES[Math.floor(Math.random() * FRASES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  // Cooldown de 5 minutos
  let cooldown = 300000 
  let time = (user.lastwork || 0) + cooldown
  if (new Date() - (user.lastwork || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Estás cansado. Vuelve en: **${msToTime(time - new Date())}**`)
  }

  // Recompensas de trabajo
  let coinHasil = Math.floor(Math.random() * 800) + 300
  let expHasil = Math.floor(Math.random() * 700) + 200
  
  await m.react(getReact())

  user.coin = (user.coin || 0) + coinHasil
  user.exp = (user.exp || 0) + expHasil
  user.lastwork = new Date() * 1
  
  let h = getLeaf()
  let txt = `${h} *TRABAJO COMPLETADO*\n\n`
  txt += `> ${getWork()}\n\n`
  txt += `> 🪙 Coin : +${coinHasil}\n`
  txt += `> ✨ Exp : +${expHasil}`

  m.reply(txt)
}

handler.help = ['work']
handler.tags = ['economy']
handler.command = ['work', 'trabajar', 'chamba'] 
handler.register = true

export default handler

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}