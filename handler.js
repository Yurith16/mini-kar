import { smsg } from './lib/simple.js'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

// Prefijos globales
const globalPrefixes = ['.', ',', '!', '#', '$', '%', '&', '*', '-', '_', '+', '=', '/', '?']

// Detectar prefijo
function detectPrefix(text, customPrefix = null) {
  if (!text || typeof text !== 'string') return null
  
  // Prefijos personalizados del grupo
  if (customPrefix) {
    const prefixes = Array.isArray(customPrefix) ? customPrefix : [customPrefix]
    for (const p of prefixes) {
      if (text.startsWith(p)) return { match: p, prefix: p, type: 'custom' }
    }
  }
  
  // Prefijos globales
  for (const p of globalPrefixes) {
    if (text.startsWith(p)) return { match: p, prefix: p, type: 'global' }
  }
  
  return null
}

// Función principal del handler
export async function handler(chatUpdate) {
  try {
    if (!chatUpdate?.messages?.length) return
    if (!global.db?.data) await global.loadDatabase?.()
    
    const m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (m.key?.fromMe) return
    
    // Serializar mensaje
    const msg = smsg(this, m)
    if (!msg) return
    
    msg.exp = 0
    
    // Inicializar usuario
    const sender = msg.sender
    if (!global.db.data.users[sender]) {
      global.db.data.users[sender] = {
        name: msg.pushName || 'Usuario',
        exp: 0,
        coin: 0,
        bank: 0,
        level: 0,
        health: 100,
        registered: false,
        premium: false,
        premiumTime: 0,
        banned: false,
        commands: 0,
        afk: -1,
        warn: 0
      }
    }
    
    const user = global.db.data.users[sender]
    
    // Actualizar nombre si cambió
    if (msg.pushName && msg.pushName !== user.name && !user.registered) {
      user.name = msg.pushName
    }
    
    // Verificar premium expirado
    if (user.premium && user.premiumTime > 0 && Date.now() > user.premiumTime) {
      user.premium = false
      user.premiumTime = 0
      this.sendMessage(sender, { text: '> 💎 *Premium expirado*\nRenueva con .buypremium' })
    }
    
    // Inicializar chat
    const chatId = msg.chat
    if (!global.db.data.chats[chatId]) {
      global.db.data.chats[chatId] = {
        isBanned: false,
        welcome: false,
        antiLink: true,
        nsfw: false,
        economy: true,
        prefix: null,
        prefixes: []
      }
    }
    
    const chat = global.db.data.chats[chatId]
    
    // Detectar si es comando
    let usedPrefix = null
    let isCommand = false
    let command = ''
    let args = []
    let text = ''
    
    // Usar prefijos del grupo + global
    const allPrefixes = [
      ...(chat.prefixes || []),
      chat.prefix,
      global.prefix,
      ...globalPrefixes
    ].filter(Boolean)
    
    const prefixMatch = detectPrefix(msg.text, [...new Set(allPrefixes)])
    
    if (prefixMatch) {
      usedPrefix = prefixMatch.prefix
      const withoutPrefix = msg.text.slice(usedPrefix.length).trim()
      const parts = withoutPrefix.split(/\s+/)
      command = parts[0]?.toLowerCase() || ''
      args = parts.slice(1)
      text = args.join(' ')
      isCommand = true
    }
    
    msg.isCommand = isCommand
    
    // Verificar si es owner
    const isOwner = global.owner?.some(o => {
      const num = Array.isArray(o) ? o[0] : o
      return sender.includes(num.replace(/[^0-9]/g, ''))
    }) || false
    
    // Ejecutar plugin si es comando
    if (isCommand && command) {
      const plugin = global.commandIndex?.[command]
      
      if (plugin) {
        try {
          // Verificaciones básicas
          if (chat.isBanned && !isOwner) {
            await msg.reply('> Bot desactivado en este grupo')
            return
          }
          
          if (user.banned && !isOwner) {
            await msg.reply(`> Estás baneado\nRazón: ${user.bannedReason || 'Sin especificar'}`)
            return
          }
          
          user.commands = (user.commands || 0) + 1
          msg.exp += plugin.exp || 10
          
          // Ejecutar plugin
          await plugin.call(this, msg, {
            command,
            args,
            text,
            usedPrefix,
            isOwner,
            user,
            chat
          })
          
        } catch (err) {
          console.error(`[Plugin] Error en ${command}:`, err)
          await msg.react('❌')
        }
      }
    }
    
    // Añadir exp
    user.exp += msg.exp
    
  } catch (err) {
    console.error('[Handler] Error:', err)
  }
}

// Función de fallo
global.dfail = (type, m, conn) => {
  const msgs = {
    owner: '> Solo el owner puede usar este comando',
    premium: '> Comando solo para usuarios premium',
    group: '> Comando solo para grupos',
    admin: '> Solo admins del grupo',
    botAdmin: '> Necesito ser admin',
    registered: '> Debes registrarte primero\nUsa: .reg nombre.edad'
  }
  
  const txt = msgs[type]
  if (txt) conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

export default { handler }