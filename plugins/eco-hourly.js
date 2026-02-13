import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🌿', '🍃', '🍀', '🌱', '🌼', '🌸', '🌺', '💮', '🥀', '🌻', '🌹', '🌷', '🏵️']

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  let cooldown = 3600000 
  let time = (user.lasthourly || 0) + cooldown
  if (new Date() - (user.lasthourly || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Vuelve en: **${msToTime(time - new Date())}**`)
  }

  let coinHasil = Math.floor(Math.random() * 600) + 200
  let expHasil = Math.floor(Math.random() * 500) + 100
  let diamondHasil = Math.floor(Math.random() * 2)
  
  await m.react(getReact())

  user.coin = (user.coin || 0) + coinHasil
  user.exp = (user.exp || 0) + expHasil
  user.diamond = (user.diamond || 0) + diamondHasil
  user.lasthourly = new Date() * 1
  
  let h = getLeaf()
  let txt = `${h} *RECOMPENSA POR HORA*\n\n`
  txt += `> 🪙 Coin : +${coinHasil}\n`
  txt += `> ✨ Exp : +${expHasil}\n`
  txt += `> 💎 Diamond : +${diamondHasil}`

  m.reply(txt)
}
handler.help = ['hourly']
handler.tags = ['economy']
handler.command = ['hourly', 'hora'] 
handler.register = true
export default handler

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}m ${seconds}s`
}