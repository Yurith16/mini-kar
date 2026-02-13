import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🌿', '🍃', '🍀', '🌱', '🌼', '🌸', '🌺', '💮', '🥀', '🌻', '🌹', '🌷', '🏵️']

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  let cooldown = 2592000000 
  let time = (user.lastmonthly || 0) + cooldown
  if (new Date() - (user.lastmonthly || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Solo puedes reclamar esto una vez al mes. Vuelve en: **${msToTime(time - new Date())}**`)
  }

  let coinHasil = Math.floor(Math.random() * 25000) + 15000 
  let expHasil = Math.floor(Math.random() * 30000) + 10000
  let diamondHasil = Math.floor(Math.random() * 100) + 50
  let hotpassHasil = 500 // Recompensa fija solicitada
  
  await m.react(getReact())

  user.coin = (user.coin || 0) + coinHasil
  user.exp = (user.exp || 0) + expHasil
  user.diamond = (user.diamond || 0) + diamondHasil
  user.hotpass = (user.hotpass || 0) + hotpassHasil
  user.lastmonthly = new Date() * 1
  
  let h = getLeaf()
  let txt = `${h} *RECOMPENSA MENSUAL*\n\n`
  txt += `> 🪙 Coin : +${coinHasil.toLocaleString()}\n`
  txt += `> ✨ Exp : +${expHasil.toLocaleString()}\n`
  txt += `> 💎 Diamond : +${diamondHasil}\n`
  txt += `> 🎫 HotPass : +${hotpassHasil}`

  m.reply(txt)
}
handler.help = ['monthly']
handler.tags = ['economy']
handler.command = ['monthly', 'mensual'] 
handler.register = true
export default handler

function msToTime(duration) {
    let days = Math.floor(duration / (1000 * 60 * 60 * 24))
    return `${days} días`
}