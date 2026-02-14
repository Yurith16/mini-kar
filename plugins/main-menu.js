const { existsSync, readFileSync } = require('fs')
const { join } = require('path')
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys')

const KARBOT_CONFIG = {
  BOT_NAME: "MINI-KAR",
  OWNER_NUMBER: "50496926150"
}

const EMOJI_SEQUENCES = {
  REACCIÓN: ['🌿', '🍃', '🍀', '🌱', '🌼', '🌸', '🌺', '💮', '🥀', '🌻', '🌹', '🌷', '🏵️'],
  BULLET: ['🍃', '🌱', '🍀', '🌿', '🌼', '🌸', '🌺', '🌻', '🌹', '🌷', '☘️', '🥀', '💐'],
  BOT_TITLE: ['🔥', '🌟', '✨', '⭐', '💫', '⚡', '💥', '🌪️', '🌊'],
  INFO_TITLE: ['ℹ️', '📊', '📈', '📉', '📋', '📌', '📍', '🔖', '🏷️', '📎', '📄', '🗂️']
}

let sequenceCounters = { reacción: 0, bullet: 0, bot_title: 0, info_title: 0 }

function getNextEmoji(type) {
  const sequence = EMOJI_SEQUENCES[type]
  const counterKey = type.toLowerCase()
  const emoji = sequence[sequenceCounters[counterKey] % sequence.length]
  sequenceCounters[counterKey] = (sequenceCounters[counterKey] + 1) % sequence.length
  return emoji
}

function getMenuImage() {
  const path = join(process.cwd(), 'media', 'menu', 'menu.jpeg')
  if (existsSync(path)) return readFileSync(path)
  return null
}

function toBoldMono(text) {
  const mapping = {
    A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
    a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝗅", y: "𝘆", z: "𝘇",
    0: "𝟬", 1: "𝟭", 2: "𝟮", 3: "𝟯", 4: "𝟰", 5: "𝟱", 6: "𝟲", 7: "𝟳", 8: "𝟴", 9: "𝟵"
  };
  return text.split("").map((char) => mapping[char] || char).join("");
}

function toElegantFont(text) {
  const mapping = {
    'M': '𝙼', 'I': '𝙸', 'N': '𝙽', 'K': '𝙺', 'A': '𝙰', 'R': '𝚁',
    'S': '𝚂', 'Y': '𝚈', 'T': '𝚃', 'E': '𝙴', 'C': '𝙲', 'D': '𝙳',
    'O': '𝙾', 'P': '𝙿', 'G': '𝙶', 'U': '𝚄', 'V': '𝚅', 'H': '𝙷',
    'L': '𝙻', 'B': '𝙱', 'F': '𝙵', 'W': '𝚆', 'X': '𝚇', 'Z': '𝚉'
  };
  return text.split("").map((char) => mapping[char] || char).join("");
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, 0)).join(":");
}

// Obtener hora de Honduras y saludo
function getHondurasInfo() {
  const hora = new Date().toLocaleString('es-US', { 
    timeZone: 'America/Tegucigalpa',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  const horaNum = parseInt(new Date().toLocaleString('es-US', { 
    timeZone: 'America/Tegucigalpa',
    hour: 'numeric',
    hour12: false 
  }))
  
  let saludo = ''
  if (horaNum >= 5 && horaNum < 12) saludo = 'Buenos días'
  else if (horaNum >= 12 && horaNum < 18) saludo = 'Buenas tardes'
  else saludo = 'Buenas noches'
  
  const fecha = new Date().toLocaleDateString('es-US', {
    timeZone: 'America/Tegucigalpa',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  return { hora, saludo, fecha }
}

module.exports = {
  help: ['menu'],
  tags: ['main'],
  command: ['menu', 'help', 'ayuda'],
  handler: async (m, { conn, usedPrefix: _p, config }) => {
    try {
      const currentEmojis = {
        reacción: getNextEmoji('REACCIÓN'),
        bullet: getNextEmoji('BULLET'),
        botTitle: getNextEmoji('BOT_TITLE'),
        infoTitle: getNextEmoji('INFO_TITLE')
      }

      await conn.sendMessage(m.chat, { react: { text: currentEmojis.reacción, key: m.key } })

      let help = Object.values(global.plugins).filter(p => !p.disabled).map(p => ({
        help: Array.isArray(p.help) ? p.help : p.help ? [p.help] : [],
        tags: Array.isArray(p.tags) ? p.tags : p.tags ? [p.tags] : [],
      }))

      const categories = {
        '𝙿𝚁𝙸𝙽𝙲𝙸𝙿𝙰𝙻': ['main', 'info'],
        '𝙴𝙲𝙾𝙽𝙾𝙼𝙸́𝙰': ['economy'],  // ← NUEVA CATEGORÍA
        '𝙿𝚁𝙴𝙼𝙸𝚄𝙼': ['premium'],
        '𝙶𝚁𝚄𝙿𝙾𝚂': ['group'],
        '𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝚂': ['downloader'],
        '𝙾𝚆𝙽𝙴𝚁': ['owner'],
        '𝙷𝙴𝚁𝚁𝙰𝙼𝙸𝙴𝙽𝚃𝙰𝚂': ['tools']
      }

      const { hora, saludo, fecha } = getHondurasInfo()
      const username = m.pushName || 'amor'
      const uptime = clockString(process.uptime() * 1000)
      
      let menuSections = []

      // Primera sección con saludo en burbujas
      menuSections.push(`╭━〔 ${currentEmojis.botTitle} ${toElegantFont('𝙼𝙸𝙽𝙸-𝙺𝙰𝚁')} ${currentEmojis.botTitle} 〕━╮\n┃\n┃ 🫧 _${saludo}, ${username}_ 🫧\n┃ ${currentEmojis.bullet} ${fecha}\n┃ ${currentEmojis.bullet} ${hora} (HN)\n┃\n╰━━━━━━━━━━━━━━━━━━╯`)
      
      // Segunda sección con info
      menuSections.push(`╭━━〔 ${currentEmojis.infoTitle} ${toElegantFont('𝙸𝙽𝙵𝙾')} ${currentEmojis.infoTitle} 〕━━╮\n┃\n┃ ${currentEmojis.bullet} Creador: ${config.owner[0]}\n┃ ${currentEmojis.bullet} Activo: ${uptime}\n┃ ${currentEmojis.bullet} Prefijo: ${_p}\n┃\n╰━━━━━━━━━━━━━━━━━━╯`)

      // Secciones de comandos
      for (let catName in categories) {
        let comandos = help.filter(menu => menu.tags.some(tag => categories[catName].includes(tag)))
        if (comandos.length) {
          let section = `╭━━〔 ${toElegantFont(catName)} 〕━━╮\n┃\n`
          let uniqueCommands = [...new Set(comandos.flatMap(menu => menu.help))]
          for (let cmd of uniqueCommands) {
            if (cmd) {
              const parts = cmd.split(' - ')
              const cmdName = parts[0]
              const desc = parts[1] ? `  ⋯ ${parts[1]}` : ''
              section += `┃ ${currentEmojis.bullet} ${_p}${cmdName}${desc}\n`
            }
          }
          section += `┃\n╰━━━━━━━━━━━━━━━━━━╯`
          menuSections.push(section)
        }
      }

      const fullText = menuSections.join("\n\n")
      const imageBuffer = getMenuImage()

      let header = { hasMediaAttachment: false }
      if (imageBuffer) {
          const media = await prepareWAMessageMedia({ image: imageBuffer }, { upload: conn.waUploadToServer })
          header = { hasMediaAttachment: true, imageMessage: media.imageMessage }
      }

      const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
        body: { text: fullText },
        footer: { text: `${currentEmojis.bullet} ${toElegantFont('𝙼𝙸𝙽𝙸-𝙺𝙰𝚁 𝚂𝙸𝚂𝚃𝙴𝙼𝙰')} ${currentEmojis.bullet}` },
        header: header,
        nativeFlowMessage: {
          buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({ 
                display_text: `🩷 Soporte`, 
                url: `https://wa.me/${config.owner[0]}` 
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({ 
                display_text: `🌸 Grupo Oficial`, 
                url: `https://chat.whatsapp.com/K2cIBxrPhPF1WLpLBhEIN0` 
              })
            }
          ]
        }
      })

      const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

    } catch (e) {
      console.error(e)
      m.reply(`🍃 Error al generar el menú.`)
    }
  }
}