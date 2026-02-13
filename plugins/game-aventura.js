import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🌋', '🏰', '🗿', '🎭', '💎', '🕯️', '🗺️', '🧗']

// 30 Lugares icónicos y reales 🫦
const LUGARES = [
  'las Pirámides de Giza 🇪🇬', 'Machu Picchu 🇵🇪', 'Angkor Wat 🇰🇭', 'la Ciudad de Petra 🇯🇴',
  'el Stonehenge 🇬🇧', 'el Coliseo Romano 🇮🇹', 'la Gran Muralla 🇨🇳', 'Chichén Itzá 🇲🇽',
  'el Partenón de Atenas 🇬🇷', 'las Ruinas de Copán 🇭🇳', 'el Monte Everest 🇳🇵', 'la Isla de Pascua 🇨🇱',
  'el Templo de Lúxor 🇪🇬', 'el Taj Mahal 🇮🇳', 'el Monte Fuji 🇯🇵', 'las Catacumbas de París 🇫🇷',
  'el Salar de Uyuni 🇧🇴', 'la Selva del Amazonas 🇧🇷', 'el Templo de Borobudur 🇮🇩', 'Petra 🇯🇴',
  'el Monte Olimpo 🇬🇷', 'la Ciudad Perdida 🇨🇴', 'el Cráter del Ngorongoro 🇹🇿', 'Sigiriya 🇱🇰',
  'el Valle de los Reyes 🇪🇬', 'Stonehenge 🇬🇧', 'Abu Simbel 🇪🇬', 'Tulum 🇲🇽', 'Tikal 🇬🇹', 'Knossos 🇬🇷'
]

// Acciones narrativas cortas 🫦
const ACCIONES = [
  'Escalaste los muros de', 'Exploraste las sombras de', 'Te adentraste en las ruinas de',
  'Caminaste por los pasillos de', 'Descubriste un altar en', 'Desenterraste un secreto en',
  'Cruzaste los umbrales de', 'Investigaste los rincones de', 'Saqueaste una cámara en',
  'Encontraste un cofre en', 'Rastreaste una pista en', 'Abriste un sarcófago en'
]

const RELIQUIAS = [
  { emoji: '🏺', nombre: 'Jarrón Antiguo', coins: 1500 },
  { emoji: '📜', nombre: 'Pergamino Sagrado', coins: 2000 },
  { emoji: '👑', nombre: 'Corona de Espinas', coins: 5000 },
  { emoji: '🛡️', nombre: 'Escudo de Platino', coins: 3500 },
  { emoji: '💎', nombre: 'Diamante en Bruto', diamonds: 2 },
  { emoji: '💍', nombre: 'Anillo de la Eternidad', diamonds: 5 },
  { emoji: '🗝️', nombre: 'Llave del Paraíso', coins: 8000 }
]

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  let cooldown = 600000 
  let time = (user.lastaventura || 0) + cooldown
  if (new Date() - (user.lastaventura || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Estás agotado, cielo. Vuelve en: *${msToTime(time - new Date())}*`)
  }

  try {
    let lugar = LUGARES[Math.floor(Math.random() * LUGARES.length)]
    let accion = ACCIONES[Math.floor(Math.random() * ACCIONES.length)]
    let cantidadReliquias = Math.floor(Math.random() * 2) + 1
    let hallazgos = []
    let totalCoins = 0
    let totalDiamonds = 0
    let totalExp = Math.floor(Math.random() * 500) + 200

    for (let i = 0; i < cantidadReliquias; i++) {
      let reliquia = RELIQUIAS[Math.floor(Math.random() * RELIQUIAS.length)]
      hallazgos.push(reliquia)
      if (reliquia.coins) totalCoins += reliquia.coins
      if (reliquia.diamonds) totalDiamonds += reliquia.diamonds
    }
    
    await m.react(getReact())

    user.coin = (user.coin || 0) + totalCoins
    user.diamond = (user.diamond || 0) + totalDiamonds
    user.exp = (user.exp || 0) + totalExp
    user.lastaventura = new Date() * 1
    
    let h = getLeaf()
    let txt = `${h} DETALLES DE AVENTURA\n\n`
    
    // Narrativa viva en una sola línea 🫦
    txt += `> ✨ ${accion} *${lugar}* y encontraste:\n\n`
    
    hallazgos.forEach(p => {
      txt += `> *${p.emoji} ${p.nombre}* = ${p.coins ? p.coins + ' coins' : p.diamonds + ' diamonds'}\n`
    })
    
    txt += `\n> 💰 Total Coins : +${totalCoins}\n`
    if (totalDiamonds > 0) txt += `> 💎 Total Diamond : +${totalDiamonds}\n`
    txt += `> ✨ Total Exp : +${totalExp}`

    m.reply(txt)
    await m.react('⚙️')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return m.reply(`> El camino colapsó y tuviste que huir. No perdiste nada, mi vida. 🫦`)
  }
}

handler.help = ['aventura']
handler.tags = ['economy']
handler.command = ['aventura', 'adventure', 'explorar'] 
handler.register = true

export default handler

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}m ${seconds}s`
}