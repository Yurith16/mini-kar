import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🎣', '⚓', '🌊', '🛶', '🐠', '🐳', '🐡', '🐙', '🐚']

const PECES = [
  { emoji: '🦐', nombre: 'Camarón', coins: 80 },
  { emoji: '🦀', nombre: 'Cangrejo', coins: 150 },
  { emoji: '🐠', nombre: 'Pez Tropical', coins: 200 },
  { emoji: '🐟', nombre: 'Pez Azul', coins: 250 },
  { emoji: '🐡', nombre: 'Pez Globo', coins: 400 },
  { emoji: '🦑', nombre: 'Calamar', coins: 550 },
  { emoji: '🐙', nombre: 'Pulpo', coins: 700 },
  { emoji: '🐢', nombre: 'Tortuga Marina', coins: 900 },
  { emoji: '🐬', nombre: 'Delfín', coins: 1500 },
  { emoji: '🦈', nombre: 'Tiburón Martillo', coins: 2200 },
  { emoji: '🐋', nombre: 'Ballena Jorobada', coins: 4500 },
  { emoji: '🐳', nombre: 'Ballena Azul', coins: 6000 },
  { emoji: '🧜‍♀️', nombre: 'Sirena Legendaria', coins: 10000 },
  { emoji: '🦞', nombre: 'Langosta', coins: 650 },
  { emoji: '🐚', nombre: 'Perla Negra', coins: 3000 },
  { emoji: '🔱', nombre: 'Tridente Oxidado', coins: 5000 },
  { emoji: '🪼', nombre: 'Medusa', coins: 300 },
  { emoji: '🦭', nombre: 'Foca', coins: 1200 },
  { emoji: '🐧', nombre: 'Pingüino', coins: 1000 },
  { emoji: '🚢', nombre: 'Tesoro Hundido', coins: 8000 }
]

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  // Cooldown de 10 minutos (600,000 ms) 🫦
  let cooldown = 600000 
  let time = (user.lastpesca || 0) + cooldown
  if (new Date() - (user.lastpesca || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Vuelve en: *${msToTime(time - new Date())}*`)
  }

  try {
    let cantidad = Math.floor(Math.random() * 4) + 1
    let capturas = []
    let totalCoins = 0
    let totalExp = 0

    for (let i = 0; i < cantidad; i++) {
      let pez = PECES[Math.floor(Math.random() * PECES.length)]
      let exp = Math.floor(Math.random() * 180) + 60
      capturas.push({ ...pez, exp })
      totalCoins += pez.coins
      totalExp += exp
    }
    
    await m.react(getReact())

    user.coin = (user.coin || 0) + totalCoins
    user.exp = (user.exp || 0) + totalExp
    user.lastpesca = new Date() * 1
    
    let h = getLeaf()
    let txt = `${h} DETALLES DE PESCA\n\n`
    capturas.forEach(p => { txt += `> *${p.emoji} ${p.nombre}* = ${p.coins} coins\n` })
    txt += `\n> 💰 Total Coins : +${totalCoins}\n`
    txt += `> ✨ Total Exp : +${totalExp}`

    m.reply(txt)
    await m.react('⚙️')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return m.reply(`> Hubo un drama en el océano. No perdiste nada, cielo. 🫦`)
  }
}

handler.help = ['pescar']
handler.tags = ['economy']
handler.command = ['pescar', 'pesca', 'fish'] 
handler.register = true
export default handler

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}m ${seconds}s`
}