import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🏛️', '💰', '🏦', '💹', '💳']

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn, args }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  let amount
  if (args[0] === 'all') {
    amount = user.bank
  } else {
    amount = parseInt(args[0])
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return m.reply(`> ${getLeaf()} *Ingresa una cantidad válida para retirar.*\n> Ejemplo: *.wd 100* o *.wd all*`)
  }

  if ((user.bank || 0) < amount) {
    return m.reply(`> ❌ No tienes suficientes *Coins* en el banco para retirar esa cantidad.`)
  }

  await m.react(getReact())

  user.bank -= amount
  user.coin = (user.coin || 0) + amount

  let h = getLeaf()
  let txt = `${h} *RETIRO BANCARIO* ${h}\n\n`
  txt += `> 🏛️ Retirado : ${amount.toLocaleString()} 🪙\n`
  txt += `> 💳 En cuenta : ${user.bank.toLocaleString()} 🪙\n`
  txt += `> 💰 Cartera : ${user.coin.toLocaleString()} 🪙`

  m.reply(txt)
}

handler.help = ['retirar']
handler.tags = ['economy']
handler.command = ['wd', 'with', 'retirar', 'retall']
handler.register = true

export default handler