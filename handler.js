const chalk = require('chalk')
const fs = require('fs')

const globalPrefixes = ['.', ',', '!', '#', '$', '%', '&', '*', '-', '_', '+', '=', '|', '/', '~', '>', '<', '^', '?', ':', ';']

const detectPrefix = (text, customPrefix = null) => {
  if (!text || typeof text !== 'string') return null

  if (customPrefix) {
    if (Array.isArray(customPrefix)) {
      for (const prefix of customPrefix) {
        if (text.startsWith(prefix)) {
          return { match: prefix, prefix: prefix, type: 'custom' }
        }
      }
    } else if (typeof customPrefix === 'string' && text.startsWith(customPrefix)) {
      return { match: customPrefix, prefix: customPrefix, type: 'custom' }
    }
  }

  for (const prefix of globalPrefixes) {
    if (text.startsWith(prefix)) {
      return { match: prefix, prefix: prefix, type: 'global' }
    }
  }

  return null
}

async function handler(chatUpdate, config) {
  try {
    if (!chatUpdate?.messages?.length) return
    
    for (const msg of chatUpdate.messages) {
      if (!msg || !msg.message) continue
      
      if (msg.key?.fromMe) continue

      const m = { ...msg }
      m.sender = m.key.remoteJid.endsWith('@g.us') 
        ? m.key.participant 
        : m.key.remoteJid
      
      m.chat = m.key.remoteJid
      m.isGroup = m.chat.endsWith('@g.us')
      
      // Obtener texto del mensaje
      m.text = m.message?.conversation ||
               m.message?.extendedTextMessage?.text ||
               m.message?.imageMessage?.caption ||
               m.message?.videoMessage?.caption ||
               ''
      
      m.pushName = m.pushName || 'Usuario'
      
      if (typeof m.text !== "string" || !m.text) continue

      // Detectar prefijo
      const prefixMatch = detectPrefix(m.text, config.prefix)
      if (!prefixMatch) continue

      const usedPrefix = prefixMatch.prefix
      const noPrefix = m.text.replace(usedPrefix, "")
      let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
      args = args || []
      let text = args.join(" ")
      command = (command || "").toLowerCase()

      // Buscar plugin que coincida con el comando
      let plugin = null
      for (const key in global.plugins) {
        const p = global.plugins[key]
        if (p.command && Array.isArray(p.command) && p.command.includes(command)) {
          plugin = p
          break
        }
      }
      
      if (!plugin) continue

      // Validaciones del plugin
      
      // Validar si requiere ser owner
      if (plugin.rowner) {
        const isOwner = global.owner.includes(m.sender.split('@')[0])
        if (!isOwner) {
          await m.reply('❌ Este comando solo para el owner')
          continue
        }
      }
      
      // Validar si requiere ser admin del grupo
      if (plugin.admin && m.isGroup) {
        const groupMetadata = await this.groupMetadata(m.chat).catch(() => null)
        const participant = groupMetadata?.participants.find(p => p.id === m.sender)
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'
        if (!isAdmin) {
          await m.reply('❌ Este comando solo para admins del grupo')
          continue
        }
      }
      
      // Validar si el bot requiere ser admin
      if (plugin.botAdmin && m.isGroup) {
        const groupMetadata = await this.groupMetadata(m.chat).catch(() => null)
        const botParticipant = groupMetadata?.participants.find(p => p.id === this.user.jid)
        const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'
        if (!isBotAdmin) {
          await m.reply('❌ Necesito ser admin para ejecutar este comando')
          continue
        }
      }
      
      // Validar si solo funciona en grupos
      if (plugin.group && !m.isGroup) {
        await m.reply('❌ Este comando solo funciona en grupos')
        continue
      }
      
      // Validar si solo funciona en privado
      if (plugin.private && m.isGroup) {
        await m.reply('❌ Este comando solo funciona en chat privado')
        continue
      }

      const tipo = m.isGroup ? '👥 GRUPO' : '👤 PRIVADO'
      const senderShort = m.sender.split('@')[0]
      console.log(chalk.cyan(`[${tipo}] ${senderShort}: ${usedPrefix}${command} ${text}`))

      // Ejecutar comando
      try {
        await plugin.handler.call(this, m, {
          conn: this,
          args,
          text,
          command,
          usedPrefix,
          prefixMatch,
          config,
          isGroup: m.isGroup,
          sender: m.sender,
          chat: m.chat,
          react: async (emoji) => {
            try {
              await this.sendMessage(m.chat, {
                react: {
                  text: emoji,
                  key: m.key
                }
              })
            } catch (e) {}
          }
        })
      } catch (err) {
        console.log(chalk.red(`[ERROR] ${command}:`), err.message)
      }
    }

  } catch (error) {
    if (!error.message?.includes('Bad MAC')) {
      console.error('Error en handler:', error.message)
    }
  }
}

// Recarga automática
const file = __filename
fs.watchFile(file, async () => {
  fs.unwatchFile(file)
  console.log(chalk.yellow("🔄 Handler recargado"))
})

module.exports = { handler }