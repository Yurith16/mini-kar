import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES_EXITO = ['🏛️', '💰', '🏦', '💹', '💳', '✨']
const REACCIONES_ADVERTENCIA = ['🔥', '⚡', '🌪️', '🤨', '🤌', '💨']

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact(type) { 
  const array = type === 'success' ? REACCIONES_EXITO : REACCIONES_ADVERTENCIA
  return array[Math.floor(Math.random() * array.length)] 
}

let handler = async (m, { conn, args }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  let amount = args[0] === 'all' ? user.coin : parseInt(args[0])

  if (!amount || isNaN(amount) || amount <= 0) {
    await m.react(getReact('warn'))
    return m.reply(`> ${getLeaf()} *Vaya drama... ingresa una cantidad real.*\n> Ejemplo: *.dep 100* o *.dep all*`)
  }

  if (user.coin < amount) {
    await m.react(getReact('warn'))
    return m.reply(`> ⚡ *Cariño, no tienes tanto dinero en la cartera.*`)
  }

  // Éxito absoluto
  await m.react(getReact('success'))

  let interest = Math.floor(amount * 0.05)
  let amountToBank = amount - interest

  user.coin -= amount
  user.bank = (user.bank || 0) + amountToBank

  let h = getLeaf()
  let txt = `${h} *DEPÓSITO BANCARIO* ${h}\n\n`
  txt += `> 🏛️ Depositado : ${amount.toLocaleString()} 🪙\n`
  txt += `> 💸 Interés (5%) : -${interest.toLocaleString()} 🪙\n`
  txt += `> 💳 En cuenta : ${user.bank.toLocaleString()} 🪙\n`
  txt += `> 💰 Cartera : ${user.coin.toLocaleString()} 🪙`

  m.reply(txt)
}

handler.help = ['dep', 'deposit']
handler.tags = ['economy']
handler.command = ['dep', 'deposit']
handler.register = true

export default handler