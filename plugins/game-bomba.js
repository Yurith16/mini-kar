import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const FUENTE = {
  15: "1️⃣5️⃣", 14: "1️⃣4️⃣", 13: "1️⃣3️⃣", 12: "1️⃣2️⃣", 11: "1️⃣1️⃣", 10: "1️⃣0️⃣", 
  9: "0️⃣9️⃣", 8: "0️⃣8️⃣", 7: "0️⃣7️⃣", 6: "0️⃣6️⃣", 5: "0️⃣5️⃣", 4: "0️⃣4️⃣", 3: "0️⃣3️⃣", 2: "0️⃣2️⃣", 1: "0️⃣1️⃣", 0: "💥"
}

const DESAFIOS = [
  { tipo: 'stickerMessage', nombre: 'STICKER' },
  { tipo: 'imageMessage', nombre: 'IMAGEN' },
  { tipo: 'audioMessage', nombre: 'AUDIO' },
  { tipo: 'videoMessage', nombre: 'VIDEO' }
]

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }

let handler = async (m, { conn }) => {
  conn.bombagame = conn.bombagame ? conn.bombagame : {}
  let id = m.sender
  let user = global.db.data.users[m.sender]

  if (await checkReg(m, user)) return

  // Cooldown de 5 minutos por usuario
  let cooldown = 300000 
  let time = (user.lastbomba || 0) + cooldown
  if (new Date() - (user.lastbomba || 0) < cooldown) {
      await m.react('⏳')
      return m.reply(`> ⏳ *SISTEMA EN ENFRIAMIENTO*\n\n> Espere: *${msToTime(time - new Date())}* para otra sesión.`)
  }

  if (conn.bombagame[id]) return m.reply(`> ⚠️ Ya existe una sesión activa. Complete el desafío.`)

  user.lastbomba = new Date() * 1
  await m.react('💣')

  let desafio = DESAFIOS[Math.floor(Math.random() * DESAFIOS.length)]
  let count = 15
  let h = getLeaf()
  
  let txt = `${h} *BOMBA DE ALTO RIESGO* ${h}\n\n`
  txt += `> ⚠️ *DESAFÍO:* ENVIAR UN ${desafio.nombre}\n`
  txt += `> ⏳ *ESTADO:* ${FUENTE[count]} SEGUNDOS\n\n`
  txt += `> _Si el dispositivo detona, habrá daños colaterales._`

  let msg = await m.reply(txt)

  conn.bombagame[id] = {
    msg,
    count,
    desafio: desafio.tipo,
    timer: setInterval(async () => {
      if (!conn.bombagame[id]) return clearInterval(this)
      conn.bombagame[id].count--
      let currentCount = conn.bombagame[id].count
      
      if (currentCount <= 0) {
        clearInterval(conn.bombagame[id].timer)
        await conn.sendMessage(m.chat, { delete: msg.key }).catch(e => {})
        
        let loss = Math.floor(Math.random() * 5000) + 3000
        user.coin = Math.max(0, (user.coin || 0) - loss)
        
        let ondaExpansiva = Math.random() < 0.20 
        let extraTxt = ""
        
        if (ondaExpansiva) {
          let users = Object.keys(global.db.data.users)
          let penalty = 500
          users.forEach(u => {
            if (global.db.data.users[u].coin > penalty) {
              global.db.data.users[u].coin -= penalty
            }
          })
          extraTxt = `\n> 🌊 *ONDA EXPANSIVA:* Se registraron pérdidas grupales de ${penalty} 🪙.`
        }

        await m.react('💥')
        m.reply(`> 💥 *DETONACIÓN CONFIRMADA*\n\n> El tiempo se ha agotado.\n> 💀 Penalización : -${loss.toLocaleString()} 🪙${extraTxt}`)
        delete conn.bombagame[id]
      } else {
        let editTxt = `${h} *BOMBA DE ALTO RIESGO* ${h}\n\n`
        editTxt += `> ⚠️ *DESAFÍO:* ENVIAR UN ${desafio.nombre}\n`
        editTxt += `> ⏳ *ESTADO:* ${FUENTE[currentCount]} SEGUNDOS\n\n`
        editTxt += `> _Si el dispositivo detona, habrá daños colaterales._`
        
        await conn.relayMessage(m.chat, {
          protocolMessage: {
            key: msg.key,
            type: 14,
            editedMessage: { conversation: editTxt }
          }
        }, {}).catch(e => {})
      }
    }, 1000)
  }
}

handler.before = async (m, { conn }) => {
  conn.bombagame = conn.bombagame ? conn.bombagame : {}
  let id = m.sender
  if (!conn.bombagame[id] || m.isBaileys) return false

  let game = conn.bombagame[id]
  let user = global.db.data.users[m.sender]

  if (m.mtype === game.desafio) {
    clearInterval(game.timer)
    
    let reward = Math.floor(Math.random() * 4000) + 1000
    user.coin = (user.coin || 0) + reward
    
    await conn.sendMessage(m.chat, { delete: game.msg.key }).catch(e => {})
    await m.react('✅')
    
    m.reply(`> ✅ *BOMBA DESACTIVADA*\n\n> El dispositivo ha sido neutralizado.\n> ✨ Recompensa : +${reward.toLocaleString()} 🪙`)
    
    delete conn.bombagame[id]
    return true
  }
  return false
}

handler.help = ['bomba']
handler.tags = ['game']
handler.command = ['bomba', 'bomb']
handler.register = true

export default handler

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}m ${seconds}s`
}