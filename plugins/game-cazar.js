import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🏹', '🦊', '🦅', '🐗', '🦁', '🐅', '🐊', '🦈', '🐍', '🐘']

// Biblioteca de fauna salvaje 🫦
const ANIMALES = [
  { emoji: '🐁', nombre: 'Ratón', coins: 50 },
  { emoji: '🐇', nombre: 'Conejo', coins: 120 },
  { emoji: '🐿️', nombre: 'Ardilla', coins: 150 },
  { emoji: '🦆', nombre: 'Pato', coins: 200 },
  { emoji: '🐍', nombre: 'Serpiente', coins: 350 },
  { emoji: '🦊', nombre: 'Zorro', coins: 400 },
  { emoji: '🦌', nombre: 'Ciervo', coins: 500 },
  { emoji: '🐗', nombre: 'Jabalí', coins: 600 },
  { emoji: '🐺', nombre: 'Lobo', coins: 750 },
  { emoji: '🦅', nombre: 'Águila', coins: 850 },
  { emoji: '🦍', nombre: 'Gorila', coins: 1000 },
  { emoji: '🐆', nombre: 'Leopardo', coins: 1200 },
  { emoji: '🐅', nombre: 'Tigre', coins: 1500 },
  { emoji: '🦁', nombre: 'León', coins: 1800 },
  { emoji: '🐊', nombre: 'Cocodrilo', coins: 2100 },
  { emoji: '🐃', nombre: 'Búfalo', coins: 2300 },
  { emoji: '🐘', nombre: 'Elefante', coins: 2800 },
  { emoji: '🦏', nombre: 'Rinoceronte', coins: 3200 },
  { emoji: '🦈', nombre: 'Tiburón', coins: 3500 },
  { emoji: '🐋', nombre: 'Ballena', coins: 5000 },
  { emoji: '🦓', nombre: 'Zebra', coins: 450 },
  { emoji: '🦒', nombre: 'Jirafa', coins: 1300 },
  { emoji: '🦛', nombre: 'Hipopótamo', coins: 2400 },
  { emoji: '🐻', nombre: 'Oso', coins: 1100 },
  { emoji: '🐼', nombre: 'Panda', coins: 900 },
  { emoji: '🦘', nombre: 'Canguro', coins: 550 },
  { emoji: ' sloth', nombre: 'Perezoso', coins: 100 }
]

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getReact() { return REACCIONES[Math.floor(Math.random() * REACCIONES.length)] }

let handler = async (m, { conn }) => {
  let user = global.db.data.users[m.sender]
  if (await checkReg(m, user)) return

  // Cooldown de 10 minutos (600,000 ms) 🫦
  let cooldown = 600000 
  let time = (user.lastcaza || 0) + cooldown
  if (new Date() - (user.lastcaza || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ Vuelve en: *${msToTime(time - new Date())}* para otra expedición. ✨`)
  }

  try {
    // Caza de 1 a 4 animales por turno
    let cantidad = Math.floor(Math.random() * 4) + 1
    let presasCazadas = []
    let totalCoins = 0
    let totalExp = 0

    for (let i = 0; i < cantidad; i++) {
      let animal = ANIMALES[Math.floor(Math.random() * ANIMALES.length)]
      let exp = Math.floor(Math.random() * 150) + 50
      presasCazadas.push({ ...animal, exp })
      totalCoins += animal.coins
      totalExp += exp
    }
    
    await m.react(getReact())

    user.coin = (user.coin || 0) + totalCoins
    user.exp = (user.exp || 0) + totalExp
    user.lastcaza = new Date() * 1
    
    let h = getLeaf()
    let txt = `${h} DETALLES DE CACERÍA\n\n`
    
    presasCazadas.forEach(p => {
      txt += `> *${p.emoji} ${p.nombre}* = ${p.coins} coins\n`
    })
    
    txt += `\n> 💰 Total Coins : +${totalCoins}\n`
    txt += `> ✨ Total Exp : +${totalExp}`

    m.reply(txt)
    await m.react('⚙️')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return m.reply(`> Hubo un drama en la jungla y las presas escaparon. No perdiste nada, cielo. 🫦`)
  }
}

handler.help = ['cazar']
handler.tags = ['economy']
handler.command = ['cazar', 'caza', 'hunt'] 
handler.register = true

export default handler

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}m ${seconds}s`
}