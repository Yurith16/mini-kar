import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🌿', '🍃', '🍀', '🌱', '🌼', '🌸', '🌺', '💮', '🥀', '🌻', '🌹', '🌷', '🏵️']

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  let cooldown = 604800000 
  let time = (user.lastweekly || 0) + cooldown
  if (new Date() - (user.lastweekly || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Aún no ha pasado la semana. Vuelve en: **${msToTime(time - new Date())}**`)
  }

  let coinHasil = Math.floor(Math.random() * 7000) + 5000 
  let expHasil = Math.floor(Math.random() * 8000) + 4000
  let diamondHasil = Math.floor(Math.random() * 30) + 15
  let hotpassHasil = 100 // Recompensa fija solicitada
  
  await m.react(getReact())

  user.coin = (user.coin || 0) + coinHasil
  user.exp = (user.exp || 0) + expHasil
  user.diamond = (user.diamond || 0) + diamondHasil
  user.hotpass = (user.hotpass || 0) + hotpassHasil
  user.lastweekly = new Date() * 1
  
  let h = getLeaf()
  let txt = `${h} *RECOMPENSA SEMANAL*\n\n`
  txt += `> 🪙 Coin : +${coinHasil.toLocaleString()}\n`
  txt += `> ✨ Exp : +${expHasil.toLocaleString()}\n`
  txt += `> 💎 Diamond : +${diamondHasil}\n`
  txt += `> 🎫 HotPass : +${hotpassHasil}`

  m.reply(txt)
}
handler.help = ['weekly']
handler.tags = ['economy']
handler.command = ['weekly', 'semanal'] 
handler.register = true
export default handler

function msToTime(duration) {
    let days = Math.floor(duration / (1000 * 60 * 60 * 24))
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    return `${days}d ${hours}h`
}