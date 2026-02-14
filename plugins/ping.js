const os = require('os')
const { performance } = require('perf_hooks')

const EMOJI_SEQUENCES = {
  REACCIÓN: ['🌿', '🍃', '🍀', '🌱', '🌼', '🌸', '🌺', '💮', '🥀', '🌻', '🌹', '🌷', '🏵️'],
  BULLET: ['🍃', '🌱', '🍀', '🌿', '🌼', '🌸', '🌺', '🌻', '🌹', '🌷', '☘️', '🥀', '💐']
}

let sequenceCounters = { reacción: 0, bullet: 0 }

function getNextEmoji(type) {
  const sequence = EMOJI_SEQUENCES[type]
  const counterKey = type.toLowerCase()
  const emoji = sequence[sequenceCounters[counterKey] % sequence.length]
  sequenceCounters[counterKey] = (sequenceCounters[counterKey] + 1) % sequence.length
  return emoji
}

function toElegantFont(text) {
  const mapping = {
    'P': '𝙿', 'I': '𝙸', 'N': '𝙽', 'G': '𝙶', 'S': '𝚂', 'T': '𝚃',
    'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵',
    'H': '𝙷', 'L': '𝙻', 'M': '𝙼', 'O': '𝙾', 'R': '𝚁', 'U': '𝚄',
    'V': '𝚅', 'Y': '𝚈', 'Z': '𝚉'
  }
  return text.split('').map((char) => mapping[char] || char).join('')
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  let d = Math.floor(ms / 86400000)
  
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function getPlatformInfo() {
  const platform = os.platform()
  const release = os.release()
  
  if (platform === 'linux') {
    // Detectar si es termux, ubuntu, etc.
    if (os.homedir().includes('/data/data/com.termux')) {
      return '📱 Termux'
    }
    return '🐧 Linux'
  }
  if (platform === 'android') return '📱 Android'
  if (platform === 'darwin') return '🍎 macOS'
  if (platform === 'win32') return '🪟 Windows'
  return '💻 Desconocido'
}

module.exports = {
  help: ['ping - Medir velocidad del bot'],
  tags: ['main'],
  command: ['ping', 'p', 'latencia'],
  handler: async (m, { conn, react, config }) => {
    try {
      const currentEmojis = {
        reacción: getNextEmoji('REACCIÓN'),
        bullet: getNextEmoji('BULLET')
      }

      await react(currentEmojis.reacción)
      
      const start = Date.now()
      const pingStart = performance.now()
      
      // Medir velocidad
      const ping = Date.now() - start
      const responseTime = (performance.now() - pingStart).toFixed(2)
      
      // Uptime del bot
      const uptime = clockString(process.uptime() * 1000)
      
      // RAM del sistema
      const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2)
      const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2)
      const usedRam = (totalRam - freeRam).toFixed(2)
      const ramPercent = ((usedRam / totalRam) * 100).toFixed(1)
      
      // CPU
      const cpus = os.cpus()
      const cpuModel = cpus[0].model
      const cpuCores = cpus.length
      const loadAvg = os.loadavg()[0].toFixed(2)
      
      // Plataforma
      const platform = getPlatformInfo()
      const hostname = os.hostname()
      
      // Versión de Baileys
      const baileysVersion = require('@whiskeysockets/baileys/package.json').version
      
      // Node.js
      const nodeVersion = process.version
      
      // Diseño elegante tipo menu
      let pingText = `╭━〔 ${toElegantFont('𝙿𝙸𝙽𝙶')} 〕━╮\n`
      pingText += `┃\n`
      pingText += `┃ ${currentEmojis.bullet} *velocidad*\n`
      pingText += `┃    ⋯ ${ping}ms (respuesta)\n`
      pingText += `┃    ⋯ ${responseTime}ms (proceso)\n`
      pingText += `┃\n`
      pingText += `┃ ${currentEmojis.bullet} *tiempo activo*\n`
      pingText += `┃    ⋯ ${uptime}\n`
      pingText += `┃\n`
      pingText += `┃ ${currentEmojis.bullet} *memoria RAM*\n`
      pingText += `┃    ⋯ ${usedRam}GB / ${totalRam}GB\n`
      pingText += `┃    ⋯ ${ramPercent}% usado\n`
      pingText += `┃\n`
      pingText += `┃ ${currentEmojis.bullet} *procesador*\n`
      pingText += `┃    ⋯ ${cpuCores} núcleos\n`
      pingText += `┃    ⋯ ${loadAvg} load\n`
      pingText += `┃\n`
      pingText += `┃ ${currentEmojis.bullet} *plataforma*\n`
      pingText += `┃    ⋯ ${platform}\n`
      pingText += `┃    ⋯ ${hostname}\n`
      pingText += `┃\n`
      pingText += `┃ ${currentEmojis.bullet} *versiones*\n`
      pingText += `┃    ⋯ Node ${nodeVersion}\n`
      pingText += `┃    ⋯ Baileys ${baileysVersion}\n`
      pingText += `┃\n`
      pingText += `╰━━━━━━━━━━━━━━━━━━╯\n`
      pingText += `${currentEmojis.bullet} _con cariño, kar_`

      await conn.sendMessage(m.chat, { 
        text: pingText,
        contextInfo: {
          externalAdReply: {
            title: '🌸 𝙥𝙞𝙣𝙜 𝙨𝙮𝙨𝙩𝙚𝙢 🌸',
            body: 'rendimiento',
            mediaType: 5,
            renderLargerThumbnail: false
          }
        }
      }, { quoted: m })
      
      await react('✅')
      
    } catch (error) {
      console.error('Error en ping:', error)
      await react('❌')
      await conn.sendMessage(m.chat, { text: '🩹 error al medir ping' }, { quoted: m })
    }
  }
}