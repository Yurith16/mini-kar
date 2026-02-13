import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🎭', '🔫', '💣', '💵', '🧤', '🚨', '⛓️']

// 30 Acciones de crimen directo y crudo 🫦
const CRIMENES = [
  'Asaltaste el museo nacional', 'Entraste a robar al banco central', 'Secuestraste a un empresario millonario',
  'Raptaste a una niña en el parque', 'Violaste a una anciana en su domicilio', 'Abusaste de una mujer en un callejón',
  'Le robaste el auto a un civil a punta de pistola', 'Extorsionaste a un dueño de negocio local', 'Asaltaste un camión de caudales',
  'Secuestraste a un político corrupto', 'Entraste a una mansión y robaste todo', 'Raptaste a un heredero por rescate',
  'Violaste a una joven que caminaba sola', 'Le arrebataste la bolsa a una mujer con violencia', 'Asaltaste una joyería de lujo',
  'Secuestraste a un periodista importante', 'Abusaste de un inocente en la oscuridad', 'Entraste a robar a una tienda de armas',
  'Raptaste a la hija de un oficial', 'Violaste la seguridad de un bunker privado', 'Le robaste la cartera a un anciano',
  'Extorsionaste a una familia adinerada', 'Asaltaste un casino clandestino', 'Secuestraste a un modelo famoso',
  'Abusaste de tu poder para robar a un civil', 'Entraste a una iglesia y robaste las ofrendas', 'Raptaste a un niño para pedir oro',
  'Violaste la privacidad de una mujer y la robaste', 'Asaltaste una gasolinera a medianoche', 'Secuestraste a un rival de la mafia'
]

const BOTIN = [
  { emoji: '💰', nombre: 'Bolsas de Dinero', coins: 4000 },
  { emoji: '💎', nombre: 'Diamante Azul', diamonds: 3 },
  { emoji: '💵', nombre: 'Fajos de Billetes', coins: 5500 },
  { emoji: '👑', nombre: 'Reliquia de Oro', coins: 7000 },
  { emoji: '🎫', nombre: 'HotPass', hotpass: 1 },
  { emoji: '💍', nombre: 'Anillo de Diamante', diamonds: 5 }
]

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  // Cooldown de 5 minutos (300,000 ms) 🫦
  let cooldown = 300000 
  let time = (user.lastcrime || 0) + cooldown
  if (new Date() - (user.lastcrime || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ La policía aún te busca, cielo. Escóndete por: *${msToTime(time - new Date())}*`)
  }

  try {
    // 60% de probabilidad de éxito 🫦
    let exito = Math.random() > 0.4
    await m.react(getReact())

    if (exito) {
      let accion = CRIMENES[Math.floor(Math.random() * CRIMENES.length)]
      let cantidadBotin = Math.floor(Math.random() * 2) + 1
      let hallazgos = []
      let totalCoins = 0
      let totalDiamonds = 0
      let totalHotpass = 0
      let totalExp = Math.floor(Math.random() * 800) + 400

      for (let i = 0; i < cantidadBotin; i++) {
        let objeto = BOTIN[Math.floor(Math.random() * BOTIN.length)]
        hallazgos.push(objeto)
        if (objeto.coins) totalCoins += objeto.coins
        if (objeto.diamonds) totalDiamonds += objeto.diamonds
        if (objeto.hotpass) totalHotpass += objeto.hotpass
      }

      user.coin = (user.coin || 0) + totalCoins
      user.diamond = (user.diamond || 0) + totalDiamonds
      user.hotpass = (user.hotpass || 0) + totalHotpass
      user.exp = (user.exp || 0) + totalExp
      user.lastcrime = new Date() * 1

      let h = getLeaf()
      let txt = `${h} DETALLES DEL CRIMEN\n\n`
      txt += `> ✨ *${accion}* y lograste llevarte:\n\n`

      hallazgos.forEach(p => {
        txt += `> *${p.emoji} ${p.nombre}* = ${p.coins ? p.coins + ' coins' : p.diamonds ? p.diamonds + ' diamonds' : p.hotpass + ' hotpass'}\n`
      })

      txt += `\n> 💰 Total Coins : +${totalCoins}\n`
      if (totalDiamonds > 0) txt += `> 💎 Total Diamond : +${totalDiamonds}\n`
      if (totalHotpass > 0) txt += `> 🎫 Total HotPass : +${totalHotpass}\n`
      txt += `> ✨ Total Exp : +${totalExp}`

      m.reply(txt)
      await m.react('⚙️')
    } else {
      let perdida = Math.floor(Math.random() * 1500) + 800
      user.coin = Math.max(0, (user.coin || 0) - perdida)
      user.lastcrime = new Date() * 1
      await m.react('🚨')
      m.reply(`> 🚨 *¡Te atraparon, mi vida!* El plan falló y pagaste una fianza de *${perdida} coins*. 🫦`)
    }

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return m.reply(`> Hubo un drama técnico en el asalto. Nadie fue arrestado, cielo. 🫦`)
  }
}

handler.help = ['crime']
handler.tags = ['economy']
handler.command = ['crime', 'crimen', 'robar'] 
handler.register = true

export default handler

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}m ${seconds}s`
}