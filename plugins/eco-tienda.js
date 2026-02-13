import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🛒', '🛍️', '📦', '💰', '🏷️']

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

// CONFIGURACIÓN DE PRECIOS EQUILIBRADA
const PRECIO_DIAMANTE = 5000 
const PRECIO_HOTPASS_COIN = 80000
const PRECIO_HOTPASS_DMD = 30

let handler = async (m, { conn, usedPrefix, command, args }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  let h = getLeaf()
  let type = (args[0] || '').toLowerCase()

  if (!type || (type !== 'diamond' && type !== 'hotpass')) {
    let txt = `${h} *KARBOT STORE* ${h}\n\n`
    txt += `> 💎 1 Diamond : ${PRECIO_DIAMANTE.toLocaleString()} 🪙\n`
    txt += `> 🎫 1 HotPass : ${PRECIO_HOTPASS_COIN.toLocaleString()} 🪙\n`
    txt += `> 🎫 1 HotPass : ${PRECIO_HOTPASS_DMD} 💎\n\n`
    txt += `*USO*\n`
    txt += `> ${usedPrefix + command} diamond [cantidad/all]\n`
    txt += `> ${usedPrefix + command} hotpass [cantidad/all]\n`
    txt += `> ${usedPrefix + command} hotpass dmd [cantidad/all]`
    return m.reply(txt)
  }

  await m.react(getReact())

  // FUNCIÓN PARA COBRO AUTOMÁTICO (CARTERA + BANCO)
  const cobrar = (total) => {
    let totalDisponible = (user.coin || 0) + (user.bank || 0)
    if (totalDisponible < total) return false
    
    if (user.coin >= total) {
      user.coin -= total
    } else {
      let faltante = total - user.coin
      user.coin = 0
      user.bank -= faltante
    }
    return true
  }

  // --- COMPRA DE DIAMANTES ---
  if (type === 'diamond') {
    let totalCoinsDisponibles = (user.coin || 0) + (user.bank || 0)
    let all = Math.floor(totalCoinsDisponibles / PRECIO_DIAMANTE)
    let count = args[1] === 'all' ? all : parseInt(args[1])
    
    if (!count || isNaN(count) || count <= 0) return m.reply(`> ${h} Indica una cantidad válida.`)
    let totalCost = PRECIO_DIAMANTE * count
    
    if (!cobrar(totalCost)) return m.reply(`> ❌ Ni en cartera ni en banco tienes lo suficiente para tanto brillo.`)

    user.diamond = (user.diamond || 0) + count
    m.reply(`${h} *FACTURA DE COMPRA*\n\n> 💎 *Item:* Diamond\n> 📦 *Cant:* ${count.toLocaleString()}\n> 💰 *Gasto:* -${totalCost.toLocaleString()} 🪙\n\n_Firma: KarBot_ 🫦`)
  }

  // --- COMPRA DE HOTPASS ---
  if (type === 'hotpass') {
    let isDmd = args[1] === 'dmd' || args[1] === 'diamante'
    let countArg = isDmd ? args[2] : args[1]
    
    if (isDmd) {
      let all = Math.floor((user.diamond || 0) / PRECIO_HOTPASS_DMD)
      let count = countArg === 'all' ? all : parseInt(countArg)
      if (!count || isNaN(count) || count <= 0) return m.reply(`> ${h} Indica una cantidad válida.`)
      
      let totalCost = PRECIO_HOTPASS_DMD * count
      if ((user.diamond || 0) < totalCost) return m.reply(`> ❌ Te faltan diamantes para este placer.`)
      
      user.diamond -= totalCost
      user.hotpass = (user.hotpass || 0) + count
      m.reply(`${h} *FACTURA DE COMPRA*\n\n> 🎫 *Item:* HotPass\n> 📦 *Cant:* ${count.toLocaleString()}\n> 💎 *Gasto:* -${totalCost} 💎\n\n_Firma: KarBot_ 🫦`)
    } else {
      let totalCoinsDisponibles = (user.coin || 0) + (user.bank || 0)
      let all = Math.floor(totalCoinsDisponibles / PRECIO_HOTPASS_COIN)
      let count = countArg === 'all' ? all : parseInt(countArg)
      
      if (!count || isNaN(count) || count <= 0) return m.reply(`> ${h} Indica una cantidad válida.`)
      let totalCost = PRECIO_HOTPASS_COIN * count
      
      if (!cobrar(totalCost)) return m.reply(`> ❌ Tu fortuna total (banco y cartera) no alcanza para un HotPass.`)
      
      user.hotpass = (user.hotpass || 0) + count
      m.reply(`${h} *FACTURA DE COMPRA*\n\n> 🎫 *Item:* HotPass\n> 📦 *Cant:* ${count.toLocaleString()}\n> 💰 *Gasto:* -${totalCost.toLocaleString()} 🪙\n\n_Firma: KarBot_ 🫦`)
    }
  }
}

handler.help = ['buy']
handler.tags = ['economy']
handler.command = ['buy', 'comprar']
handler.register = true

export default handler