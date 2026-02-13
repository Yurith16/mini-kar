import pkg from '@whiskeysockets/baileys'
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, makeWASocket } = pkg
import pino from "pino"
import { protoType, serialize } from '../lib/simple.js'
import path from 'path'
import fs from 'fs'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Solo el Owner tiene el poder
  if (!global.owner.some(owner => owner[0] === m.sender.split('@')[0])) return 

  if (!text) return m.reply(`> 🌿 *Sistema KarBot*\n\n> Ingrese el ID (número) del subbot para forzar su reconexión.\n\n> *Ejemplo:* ${usedPrefix + command} 50234705271`)

  let userName = text.replace(/[^0-9]/g, '')
  const folder = path.join('Sessions/SubBot', userName)
  const credsPath = path.join(folder, 'creds.json')

  // 1. Verificar si la sesión existe físicamente
  if (!fs.existsSync(credsPath)) {
    await m.react('🤌')
    return m.reply(`> 💨 *Sin rastro de sesión*\n\n> No existe una carpeta de sesión para el número: *${userName}*.\n> El usuario debe vincularse primero con *${usedPrefix}code*.`)
  }

  // 2. Verificar si la sesión es válida (tamaño del archivo creds)
  const stats = fs.statSync(credsPath)
  if (stats.size < 500) {
    await m.react('⚡')
    return m.reply(`> 🥀 *Sesión Corrupta*\n\n> El archivo de sesión de *${userName}* es demasiado pequeño o está dañado. No se puede reconectar.`)
  }

  // 3. Verificar si ya está conectado en la lista global
  const existing = global.subbots?.find(s => s.id === userName && s.connection === 'open')
  if (existing) {
    await m.react('✨')
    return m.reply(`> 🤖 *Aviso*\n\n> El subbot *${userName}* ya se encuentra activo y conectado.`)
  }

  // --- INICIO DE LÓGICA DE RECONEXIÓN ---
  await m.react('⚙️')
  m.reply(`> 🌿 *KarBot System*\n\n> Intentando despertar la sesión de: *${userName}*...`)

  const startSubBot = async () => {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(folder)
      const { version } = await fetchLatestBaileysVersion()

      const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        browser: Browsers.macOS('Safari'),
        printQRInTerminal: false
      })

      sock.id = userName
      sock.connection = 'connecting'
      
      // Cargar handlers (Importante para que el subbot responda)
      try {
        protoType()
        serialize()
      } catch (e) {}

      let handlerr
      try {
        ({ handler: handlerr } = await import('../handler.js'))
      } catch (e) {
        console.error('Error importando handler:', e)
      }

      sock.ev.on("messages.upsert", async (chatUpdate) => {
        if (!handlerr) return
        await handlerr.call(sock, chatUpdate)
      })

      sock.ev.on('creds.update', saveCreds)

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'open') {
          sock.connection = 'open'
          if (!global.subbots) global.subbots = []
          global.subbots = global.subbots.filter(c => c.id !== userName)
          global.subbots.push(sock)
          
          await m.react('🔥')
          conn.reply(m.chat, `> ✅ *RECONEXIÓN EXITOSA*\n\n> El subbot *${userName}* ahora está en línea.`, m)
          console.log(`[OWNER-RECONNECT] Subbot ${userName} conectado.`)
        }

        if (connection === 'close') {
          const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
          console.log(`[OWNER-RECONNECT] Cerrado: ${userName}. Razón: ${reason}`)
          global.subbots = global.subbots.filter(c => c.id !== userName)
        }
      })

    } catch (err) {
      console.error('Error en reconexión forzada:', err)
      await m.react('⚡')
    }
  }

  startSubBot()
}

handler.help = ['reconectar <id>']
handler.tags = ['owner']
handler.command = ['reconectar', 'reconnect']
handler.owner = true 

export default handler