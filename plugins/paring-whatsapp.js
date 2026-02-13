import pkg from '@whiskeysockets/baileys'
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg
import pino from "pino"
import { protoType, serialize, makeWASocket } from '../lib/simple.js'
import path from 'path'
import fs from 'fs'

// Inicializamos global.subbots
if (!global.subbots) global.subbots = []

// Sistema de gestión de sesiones persistentes
if (!global.subBotSessions) {
  global.subBotSessions = {
    // Mapa para controlar reconexiones: userName -> { lastAttempt, attempts, isActive }
    reconnectMap: new Map(),
    
    // Función para verificar y reconectar sesiones automáticamente
    autoReconnectAll: async function() {
      try {
        const sessionsDir = 'Sessions/SubBot'
        if (!fs.existsSync(sessionsDir)) return
        
        const folders = fs.readdirSync(sessionsDir).filter(f => {
          try {
            return fs.statSync(path.join(sessionsDir, f)).isDirectory()
          } catch {
            return false
          }
        })
        
        console.log(`[AUTO-RECONNECT] Verificando ${folders.length} sesiones...`)
        
        for (const folder of folders) {
          try {
            const credsPath = path.join(sessionsDir, folder, 'creds.json')
            if (fs.existsSync(credsPath)) {
              const stats = fs.statSync(credsPath)
              // Credenciales válidas (más de 500 bytes)
              if (stats.size > 500) {
                // Verificar si ya está conectado
                const alreadyConnected = global.subbots?.find(s => s.id === folder && s.connection === 'open')
                if (!alreadyConnected) {
                  console.log(`[AUTO-RECONNECT] Sesión válida encontrada: ${folder}`)
                  
                  // Verificar si ya estamos intentando reconectar esta sesión
                  const reconnectData = this.reconnectMap.get(folder)
                  if (!reconnectData || !reconnectData.isActive) {
                    // Programar reconexión para esta sesión
                    this.scheduleReconnect(folder)
                  }
                }
              }
            }
          } catch (error) {
            console.error(`[AUTO-RECONNECT Error ${folder}]:`, error.message)
          }
        }
      } catch (error) {
        console.error('[AUTO-RECONNECT General Error]:', error.message)
      }
    },
    
    // Programar reconexión para una sesión específica
    scheduleReconnect: function(userName, delay = 5000) {
      // Limpiar intento anterior si existe
      if (this.reconnectMap.has(userName)) {
        const existing = this.reconnectMap.get(userName)
        if (existing.timeout) clearTimeout(existing.timeout)
      }
      
      // Configurar nuevo intento
      const reconnectData = {
        attempts: 0,
        maxAttempts: 12, // 12 intentos en 5 minutos (cada 25 segundos aprox)
        startTime: Date.now(),
        isActive: true,
        timeout: null
      }
      
      this.reconnectMap.set(userName, reconnectData)
      
      // Función de intento de reconexión
      const attemptReconnect = async () => {
        const data = this.reconnectMap.get(userName)
        if (!data || !data.isActive) return
        
        data.attempts++
        const elapsed = Date.now() - data.startTime
        
        // Verificar límite de tiempo (5 minutos)
        if (elapsed > 300000) { // 5 minutos = 300,000 ms
          console.log(`[AUTO-RECONNECT ${userName}] Tiempo límite alcanzado (5 minutos)`)
          data.isActive = false
          this.reconnectMap.delete(userName)
          return
        }
        
        // Verificar límite de intentos
        if (data.attempts > data.maxAttempts) {
          console.log(`[AUTO-RECONNECT ${userName}] Límite de intentos alcanzado (${data.attempts})`)
          data.isActive = false
          this.reconnectMap.delete(userName)
          return
        }
        
        console.log(`[AUTO-RECONNECT ${userName}] Intento ${data.attempts}/${data.maxAttempts}`)
        
        // Intentar reconectar (simulando un mensaje del usuario)
        // Nota: No podemos crear un socket aquí directamente porque necesitamos el contexto del handler
        // En su lugar, marcamos la sesión para reconexión cuando se use .reconectar
        
        // Programar siguiente intento (aproximadamente cada 25 segundos para 12 intentos en 5 minutos)
        const nextDelay = 25000 // 25 segundos
        data.timeout = setTimeout(attemptReconnect, nextDelay)
        this.reconnectMap.set(userName, data)
      }
      
      // Iniciar primer intento
      reconnectData.timeout = setTimeout(attemptReconnect, delay)
      this.reconnectMap.set(userName, reconnectData)
    },
    
    // Detener reconexión para una sesión
    stopReconnect: function(userName) {
      if (this.reconnectMap.has(userName)) {
        const data = this.reconnectMap.get(userName)
        if (data.timeout) clearTimeout(data.timeout)
        this.reconnectMap.delete(userName)
      }
    }
  }
  
  // Iniciar reconexión automática 30 segundos después de iniciar el bot
  setTimeout(() => {
    global.subBotSessions.autoReconnectAll()
  }, 30000)
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let user = global.db.data.users[m.sender]
  
  // --- VALIDACIÓN DE TOKEN ---
  let inputToken = args[0] // El usuario deberá poner: .code TOKEN
  
  if (!user.hasToken || !user.subbotToken) {
    try { await conn.sendMessage(m.chat, { react: { text: '🔒', key: m.key } }) } catch {}
    return conn.reply(m.chat, `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🍃 *𝙻𝙾 𝚂𝙸𝙴𝙽𝚃𝙾, 𝙲𝙸𝙴𝙻𝙾.* 𝙽𝙴𝙲𝙴𝚂𝙸𝚃𝙰𝚂 𝚄𝙽 𝚃𝙾𝙺𝙴𝙽 𝙴𝚂𝙿𝙴𝙲𝙸𝙰𝙻 𝙿𝙰𝚁𝙰 𝚂𝙴𝚁 𝚂𝚄𝙱𝙱𝙾𝚃.\n> 📩 𝙴𝚂𝙲𝚁𝙸𝙱𝙴 𝙰𝙻 𝙾𝚆𝙽𝙴𝚁 𝙿𝙰𝚁𝙰 𝚀𝚄𝙴 𝚃𝙴 𝙶𝙴𝙽𝙴𝚁𝙴 𝚄𝙽𝙾.`, m)
  }

  if (inputToken !== user.subbotToken) {
    try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
    return conn.reply(m.chat, `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ❌ *𝚃𝙾𝙺𝙴𝙽 𝙸𝙽𝙲𝙾𝚁𝚁𝙴𝙲𝚃𝙾.*\n> 🔍 𝚅𝙴𝚁𝙸𝙵𝙸𝙲𝙰 𝙴𝙻 𝙲𝙾́𝙳𝙸𝙶𝙾 𝚀𝚄𝙴 𝚃𝙴 𝙳𝙸𝙾 𝙴𝙻 𝙾𝚆𝙽𝙴𝚁 𝙾 𝙿𝙸́𝙳𝙴𝙻𝙴 𝚄𝙽𝙾 𝙽𝚄𝙴𝚅𝙾.`, m)
  }
  // ========== FIN DE LA VALIDACIÓN ==========
  
  // --- CORRECCIÓN CRÍTICA: USERNAME POR NÚMERO DE TELÉFONO ---
  // Forzamos que el nombre de la carpeta sea siempre el ID del usuario, no el token
  let userName = m.sender.split("@")[0] // Ej: "50412345678"
  const folder = path.join('Sessions/SubBot', userName)

  // Verificar límite de subbots
  if (global.subbots.length >= 100) {
    try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
    return conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🚫 𝙻𝙸𝙼𝙸𝚃𝙴 𝙳𝙴 𝚂𝚄𝙱𝙱𝙾𝚃𝚂 𝙰𝙻𝙲𝙰𝙽𝚉𝙰𝙳𝙾', m)
  }

  // Verificar conexión existente (ahora por número de teléfono)
  const existing = global.subbots.find(c => c.id === userName && c.connection === 'open')
  if (existing) {
    try { await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key } }) } catch {}
    return conn.reply(m.chat, `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝚈𝙰 𝚃𝙸𝙴𝙽𝙴𝚂 𝚂𝚄𝙱𝙱𝙾𝚃 𝙰𝙲𝚃𝙸𝚅𝙾\n> 📱 𝚄𝚂𝚄𝙰𝚁𝙸𝙾: ${userName}`, m)
  }

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  try { await conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } }) } catch {}
  try { await conn.sendPresenceUpdate('composing', m.chat) } catch {}

  // util
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // reconnection/backoff state
  let retryCount = 0
  let destroyed = false
  
  // Verificar si ya hay sesión válida
  const credsPath = path.join(folder, 'creds.json')
  const hasExistingSession = fs.existsSync(credsPath)
  let sessionIsValid = false
  
  if (hasExistingSession) {
    try {
      const stats = fs.statSync(credsPath)
      sessionIsValid = stats.size > 500
      console.log(`[SUB-BOT ${userName}] Sesión existente detectada (${stats.size} bytes)`)
    } catch (error) {
      console.error(`[SUB-BOT ${userName}] Error verificando sesión:`, error.message)
    }
  }

  const start = async () => {
    if (destroyed) return
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

      // identify
      sock.id = userName
      sock.saveCreds = saveCreds
      sock.connection = 'connecting'
      sock.uptime = null
      
      // ========== NUEVO: Configurar reconexión automática si hay sesión válida ==========
      if (sessionIsValid) {
        sock.__hasValidSession = true
        sock.__autoReconnect = true
        sock.__reconnectAttempts = 0
        sock.__maxReconnectTime = 300000 // 5 minutos
        sock.__reconnectStartTime = Date.now()
        
        console.log(`[SUB-BOT ${userName}] Configurando reconexión automática (sesión válida)`)
      }
      // ================================================================================
      
      let pairingCodeSent = false
      let cleanedForInvalidCreds = false

      try {
        protoType()
        serialize()
      } catch (e) {
        console.log(e)
      }

      let handlerr
      try {
        ({ handler: handlerr } = await import('../handler.js'))
      } catch (e) {
        console.error('[Handler] Error importando handler:', e)
      }

      // message upsert
      sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
          if (!handlerr) return
          await handlerr.call(sock, chatUpdate)
        } catch (e) {
          console.error("Error en handler subbot:", e)
        }
      })

      // save creds
      sock.ev.on('creds.update', saveCreds)

      // ========== MODIFICADO: NO ELIMINAR SESIONES AUTOMÁTICAMENTE ==========
      // Solo limpiar si realmente no hay credenciales después de mucho tiempo
      const initTimeout = setTimeout(async () => {
        // Verificar si realmente no hay usuario (credenciales inválidas)
        if (!sock.user) {
          try {
            // Solo verificar si las credenciales son realmente inválidas
            const currentCredsPath = path.join(folder, 'creds.json')
            if (fs.existsSync(currentCredsPath)) {
              const stats = fs.statSync(currentCredsPath)
              if (stats.size < 100) { // Archivo muy pequeño = inválido
                cleanedForInvalidCreds = true
                try { sock.ws?.close() } catch {}
                sock.ev.removeAllListeners()
                global.subbots = global.subbots.filter(c => c.id !== userName)
                try { 
                  fs.rmSync(folder, { recursive: true, force: true }) 
                } catch (e) {
                  console.error('Error eliminando carpeta de sesión: ', e)
                }
                console.log(`[SUB-BOT ${userName}] Limpiado - credenciales inválidas (<100 bytes)`)
              } else {
                // Credenciales válidas pero no se pudo conectar, mantener sesión
                console.log(`[SUB-BOT ${userName}] Credenciales válidas pero no conectado, manteniendo sesión`)
              }
            }
          } catch (e) {
            console.error('Error en verificación de sesión:', e)
          }
        }
      }, 600000) // 10 minutos para verificación

      sock.ev.on('connection.update', async (update) => {
        try {
          const { connection, lastDisconnect } = update

          if (connection === 'open') {
            retryCount = 0
            
            // ========== NUEVO: Detener reconexión automática si está activa ==========
            if (global.subBotSessions) {
              global.subBotSessions.stopReconnect(userName)
            }
            // ========================================================================
            
            sock.__sessionOpenAt = Date.now()
            sock.connection = 'open'
            sock.uptime = new Date()

            global.subbots = global.subbots.filter(c => c.id !== userName)
            global.subbots.push(sock)
            clearTimeout(initTimeout)
            
            // ========== OPCIONAL: TOKEN DE UN SOLO USO ==========
            // Descomenta la siguiente línea si quieres que el token sea de un solo uso
            // user.hasToken = false
            // user.subbotToken = ''
            // console.log(`[SUB-BOT ${userName}] Token invalidado (uso único)`)
            // =====================================================
            
            try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}
            
            try {
              await sleep(500)
              let message = `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ✅ 𝚂𝚄𝙱𝙱𝙾𝚃 𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾\n> 🤖 𝚂𝙴𝚂𝙸𝙾𝙽: ${userName}\n> 📱 𝙸𝙳 𝚄𝚂𝚄𝙰𝚁𝙸𝙾: ${userName}`
              
              // Si se reconectó de una sesión existente
              if (sessionIsValid) {
                message += '\n> 🔄 𝚂𝙴𝚂𝙸𝙾́𝙽 𝚁𝙴𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙳𝙰 𝙰𝚄𝚃𝙾𝙼𝙰́𝚃𝙸𝙲𝙰𝙼𝙴𝙽𝚃𝙴'
              }
              
              await conn.reply(m.chat, message, m)
            } catch (e) {}
            
            console.log(`[SUB-BOT ${userName}] Conectado exitosamente`)
            
          } else if (connection === 'close') {
            sock.connection = 'close'
            global.subbots = global.subbots.filter(c => c.id !== userName)
            
            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
            
            // ========== MODIFICADO: Solo eliminar si son credenciales realmente inválidas ==========
            const fatalReasons = [DisconnectReason.loggedOut, 401, 405, 403]
            if (fatalReasons.includes(reason)) {
              console.log(`[SUB-BOT ${userName}] Desconexión fatal (${reason}), verificando credenciales...`)
              
              // Verificar si las credenciales son realmente inválidas antes de eliminar
              try {
                if (fs.existsSync(credsPath)) {
                  const stats = fs.statSync(credsPath)
                  if (stats.size < 100) {
                    // Credenciales inválidas, eliminar
                    fs.rmSync(folder, { recursive: true, force: true })
                    console.log(`[SUB-BOT ${userName}] Credenciales inválidas eliminadas`)
                  } else {
                    // Credenciales válidas, mantener sesión
                    console.log(`[SUB-BOT ${userName}] Credenciales válidas, manteniendo sesión`)
                    
                    // Programar reconexión automática si hay sesión válida
                    if (global.subBotSessions && stats.size > 500) {
                      global.subBotSessions.scheduleReconnect(userName, 10000) // Reintentar en 10 segundos
                    }
                  }
                }
              } catch (e) {
                console.error('Error verificando credenciales:', e)
              }
              
              destroyed = true
              return
            }

            console.log(`[SUB-BOT ${userName}] Conexión cerrada (reason: ${reason}). Reintentando...`)

            // ========== NUEVO: Configurar reconexión automática extendida ==========
            const maxReconnectTime = 300000 // 5 minutos
            const startTime = sock.__reconnectStartTime || Date.now()
            const elapsed = Date.now() - startTime
            
            if (elapsed < maxReconnectTime) {
              // Aún estamos dentro del período de 5 minutos, seguir intentando
              retryCount = (retryCount || 0) + 1
              const backoff = Math.min(60000, 2000 * (2 ** Math.min(retryCount, 6)))
              
              console.log(`[SUB-BOT ${userName}] Intento ${retryCount}, reconectando en ${backoff}ms (${Math.round(elapsed/1000)}s/${maxReconnectTime/1000}s)`)
              
              setTimeout(() => {
                if (cleanedForInvalidCreds) return
                if (destroyed) return
                try {
                  start()
                } catch (e) {
                  console.error(`[SUB-BOT ${userName}] Error al reiniciar:`, e)
                }
              }, backoff)
              
              // Programar también en el sistema global
              if (global.subBotSessions && sessionIsValid) {
                global.subBotSessions.scheduleReconnect(userName, backoff + 1000)
              }
              
            } else {
              // Tiempo de reconexión excedido
              console.log(`[SUB-BOT ${userName}] Tiempo de reconexión excedido (${Math.round(elapsed/1000)}s)`)
              
              // Mantener sesión pero detener intentos
              if (global.subBotSessions) {
                global.subBotSessions.stopReconnect(userName)
              }
              
              // Notificar que la sesión se mantiene
              console.log(`[SUB-BOT ${userName}] Sesión mantenida, usar .reconectar para reactivar`)
            }
          }
        } catch (e) {
          console.error('Error en connection.update (subbot):', e)
        }
      })

      // group participants placeholder
      sock.ev.on('group-participants.update', async (update) => {
        try {
          const { id, participants, action } = update || {}
          if (!id || !participants || !participants.length) return
        } catch (e) {}
      })

      // pairing code flow (solo si no hay sesión válida registrada)
      if (!state.creds?.registered && !pairingCodeSent) {
        pairingCodeSent = true

        try { await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }) } catch {}
        setTimeout(async () => {
          try {
            const rawCode = await sock.requestPairingCode(userName)

            try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}

            // Crear mensaje interactivo SIN imagen
            const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n` +
                      `> 🔐 𝙲𝙾𝙳𝙸𝙶𝙾 𝙳𝙴 𝚅𝙸𝙽𝙲𝚄𝙻𝙰𝙲𝙸𝙾𝙽\n` +
                      `> 📲 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 → 𝙰𝙹𝚄𝚂𝚃𝙴𝚂\n` +
                      `> ⛓️ 𝙳𝙸𝚂𝙿𝙾𝚂𝙸𝚃𝙸𝚅𝙾𝚂 𝚅𝙸𝙽𝙲𝚄𝙻𝙰𝙳𝙾𝚂\n` +
                      `> 🆕 𝚃𝙾𝙲𝙰 𝚅𝙸𝙽𝙲𝚄𝙻𝙰𝚁 𝚄𝙽 𝙳𝙸𝚂𝙿𝙾𝚂𝙸𝚃𝙸𝚅𝙾\n` +
                      `> 📋 𝙲𝙾𝙿𝙸𝙰 𝙴𝙻 𝙲𝙾𝙳𝙸𝙶𝙾:\n\n` +
                      `*${rawCode.match(/.{1,4}/g)?.join(' ')}*`
              }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: "𝚅𝙰𝙻𝙸𝙳𝙾 𝙿𝙾𝚁 𝟼𝟶 𝚂𝙴𝙶𝚄𝙽𝙳𝙾𝚂"
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                      display_text: "📋 𝙲𝙾𝙿𝙸𝙰𝚁 𝙲𝙾𝙳𝙸𝙶𝙾",
                      copy_code: rawCode
                    })
                  }
                ]
              })
            })

            const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
            try {
              await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
            } catch (e) {
              try {
                await sock.sendMessage(m.chat, { text: `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🔐 𝙲𝙾𝙳𝙸𝙶𝙾: ${rawCode}` }, { quoted: m })
              } catch (e2) {}
            }

            console.log(`Código de vinculación enviado: ${rawCode}`)

          } catch (err) {
            console.error('Error al obtener pairing code:', err)
            try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
            try { await conn.reply(m.chat, `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝙴𝚁𝚁𝙾𝚁: ${err.message}`, m) } catch {}
          }
        }, 3000)
      }

    } catch (error) {
      console.error('Error al crear socket:', error)
      try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
      try { await conn.reply(m.chat, `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝙴𝚁𝚁𝙾𝚁: ${error.message}`, m) } catch {}
      
      retryCount = (retryCount || 0) + 1
      
      // Programar reintento con backoff
      const backoff = Math.min(60000, 2000 * (2 ** Math.min(retryCount, 6)))
      setTimeout(() => {
        if (!destroyed) {
          // También programar en el sistema global si hay sesión válida
          if (global.subBotSessions && sessionIsValid) {
            global.subBotSessions.scheduleReconnect(userName, backoff)
          }
          start()
        }
      }, backoff)
    }
  }

  start()
}

handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code']

export default handler