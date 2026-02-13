import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import os from 'os'
import fs from 'fs'
import chalk from 'chalk'
import readline from 'readline'
import qrcode from 'qrcode-terminal'
import libPhoneNumber from 'google-libphonenumber'
import cfonts from 'cfonts'
import pino from 'pino'
import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, jidNormalizedUser } from '@whiskeysockets/baileys'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import config from './config.js'
import { loadDatabase, saveDatabase, DB_PATH } from './lib/db.js'
import { watchFile } from 'fs'

const phoneUtil = (libPhoneNumber.PhoneNumberUtil || libPhoneNumber.default?.PhoneNumberUtil).getInstance()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global._filename = __filename
global.prefixes = Array.isArray(config.prefix) ? [...config.prefix] : []
global.owner = Array.isArray(config.owner) ? config.owner : []
global.opts = global.opts && typeof global.opts === 'object' ? global.opts : {}

if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp")

const CONFIG_PATH = path.join(__dirname, 'config.js')
watchFile(CONFIG_PATH, async () => {
  try {
    const fresh = (await import('./config.js?update=' + Date.now())).default
    if (Array.isArray(fresh.prefix)) global.prefixes = [...fresh.prefix]
    if (Array.isArray(fresh.owner)) global.owner = fresh.owner
    console.log(chalk.green('[Config] Configuración actualizada'))
  } catch (e) {
    console.log('[Config] Error:', e.message)
  }
})

global.plugins = {}
global.commandIndex = {}
async function loadPlugins() {
  global.plugins = {}
  global.commandIndex = {}
  const PLUGIN_PATH = path.join(__dirname, 'plugins')
  if (!fs.existsSync(PLUGIN_PATH)) return
  const entries = fs.readdirSync(PLUGIN_PATH)
  for (const entry of entries) {
    const entryPath = path.join(PLUGIN_PATH, entry)
    if (fs.statSync(entryPath).isDirectory()) {
      const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.js'))
      for (const file of files) await importAndIndexPlugin(path.join(entryPath, file))
    } else if (entry.endsWith('.js')) {
      await importAndIndexPlugin(entryPath)
    }
  }
  console.log(chalk.green(`[Plugins] ${Object.keys(global.plugins).length} cargados`))
}

async function importAndIndexPlugin(fullPath) {
  try {
    const mod = await import(pathToFileURL(fullPath).href + `?update=${Date.now()}`)
    const plug = mod.default || mod
    if (!plug) return
    plug.__file = path.basename(fullPath)
    if (Array.isArray(plug.command)) plug.command = plug.command.map(c => typeof c === 'string' ? c.toLowerCase() : c)
    else if (typeof plug.command === 'string') plug.command = plug.command.toLowerCase()
    global.plugins[plug.__file] = plug
    const cmds = []
    if (typeof plug.command === 'string') cmds.push(plug.command)
    else if (Array.isArray(plug.command)) cmds.push(...plug.command.filter(c => typeof c === 'string'))
    for (const c of cmds) {
      const key = c.toLowerCase()
      if (!global.commandIndex[key]) global.commandIndex[key] = plug
    }
  } catch (e) {
    console.error('[PluginLoadError]', path.basename(fullPath), e.message)
  }
}

try { await loadDatabase() } catch (e) { console.log('[DB] Error:', e.message) }
await loadPlugins()
let handler
try { ({ handler } = await import('./handler.js')) } catch (e) { console.error('[Handler] Error:', e.message) }

try {
  const { say } = cfonts
  const botDisplayName = config.botName || config.name || global.namebot || 'Bot'
  console.log(chalk.magentaBright(`\n🌱Iniciando ${botDisplayName}...`))
  say('ItsukiV3', { font: 'simple', align: 'left', gradient: ['green','white'] })
  say('Powered by leo 👑', { font: 'console', align: 'center', colors: ['cyan','magenta','yellow'] })
  try { protoType() } catch {}
  try { serialize() } catch {}
  const ramInGB = os.totalmem() / (1024 * 1024 * 1024)
  const freeRamInGB = os.freemem() / (1024 * 1024 * 1024)
  console.log(chalk.cyan(`💾 RAM: ${ramInGB.toFixed(2)}GB total, ${freeRamInGB.toFixed(2)}GB libre`))
} catch (e) {
  console.log('[Banner] Error:', e.message)
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(res => rl.question(question, ans => { rl.close(); res(ans) }))
}

async function chooseMethod(authDir) {
  const credsPath = path.join(authDir, 'creds.json')
  if (fs.existsSync(credsPath)) return 'existing'
  if (process.argv.includes('--qr')) return 'qr'
  if (process.argv.includes('--code')) return 'code'
  if (process.env.LOGIN_MODE === 'qr') return 'qr'
  if (process.env.LOGIN_MODE === 'code') return 'code'
  let ans
  do {
    console.clear()
    console.log(chalk.yellow('Selecciona método:'))
    console.log('1. Escanear QR')
    console.log('2. Código de emparejamiento')
    ans = await ask('Elige (1 o 2): ')
  } while (!['1','2'].includes(ans))
  return ans === '1' ? 'qr' : 'code'
}

const PROCESS_START_AT = Date.now()

async function sendOwnerNotification(sock, message) {
  try {
    if (!global.owner || !global.owner.length) return
    for (const ownerInfo of global.owner) {
      let ownerNumber = ''
      if (Array.isArray(ownerInfo)) ownerNumber = ownerInfo[0] || ''
      else if (typeof ownerInfo === 'string') ownerNumber = ownerInfo
      if (ownerNumber && ownerNumber.length > 5) {
        const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : `${ownerNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`
        await sock.sendMessage(ownerJid, { text: `🔔 *NOTIFICACIÓN*\n\n${message}` }).catch(() => {})
      }
    }
  } catch (error) {
    console.log('[OwnerNotification] Error:', error.message)
  }
}

async function startBot() {
  const authDir = path.join(__dirname, config.sessionDirName || config.sessionName || global.sessions || 'sessions')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const method = await chooseMethod(authDir)
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    browser: method === 'code' ? Browsers.macOS('Safari') : ['SuperBot','Chrome','1.0.0']
  })

  sock.__sessionOpenAt = sock.__sessionOpenAt || 0
  sock.__botReady = false
  sock.__messageBuffer = []

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      if (!sock.__botReady) {
        console.log(chalk.yellow('[Bot] Bot no listo, ignorando mensajes'))
        return
      }
      
      const msgs = Array.isArray(chatUpdate?.messages) ? chatUpdate.messages : []
      if (!msgs.length) return
      
      // DEBUG: Mostrar mensajes recibidos
      for (const m of msgs) {
        const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
        if (text.trim()) {
          console.log(chalk.cyan(`[MSG] ${m.key.remoteJid}: ${text.substring(0, 30)}`))
        }
      }
      
      const filteredMsgs = msgs.filter(m => !(m.key?.fromMe || false))
      if (!filteredMsgs.length) return
      
      // Procesar inmediatamente sin timeout
      await handler?.call(sock, { ...chatUpdate, messages: filteredMsgs })
      
    } catch (e) { 
      console.error('[HandlerError]', e?.message || e) 
    }
  })

  sock.ev.on('creds.update', saveCreds)

  try {
    setInterval(() => { saveDatabase().catch(() => {}) }, 60000)
    const shutdown = async () => { try { await saveDatabase() } catch {} process.exit(0) }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch {}

  let pairingRequested = false
  let pairingCodeGenerated = false

  async function maybeStartPairingFlow() {
    if (method !== 'code' || sock.authState.creds.registered || pairingRequested) return
    pairingRequested = true
    
    let number = ''
    if (config.botNumber) {
      number = config.botNumber.toString().replace(/[^0-9]/g,'')
    }
    
    if (!number) {
      console.log(chalk.yellow('Ingresa número (ej: +50412345678):'))
      const raw = await ask('Número: ')
      let cleaned = String(raw || '').trim().replace(/\s+/g,'')
      if (!cleaned.startsWith('+')) cleaned = '+' + cleaned
      number = cleaned.replace(/[^0-9]/g,'')
    }
    
    if (!number) {
      console.log(chalk.red('Número no válido'))
      pairingRequested = false
      return
    }
    
    const launchCodeGeneration = async () => {
      if (pairingCodeGenerated || sock.authState.creds.registered) return
      pairingCodeGenerated = true
      try {
        console.log(chalk.gray(`Generando código para +${number}...`))
        const code = await sock.requestPairingCode(number)
        const formatted = code.match(/.{1,4}/g)?.join('-') || code
        console.log(chalk.green(`🔐 Código: ${formatted}`))
        console.log(chalk.yellow('WhatsApp > Dispositivos vinculados > Vincular con número'))
      } catch (e) {
        console.error('[PairingCode Error]', e.message || e)
        pairingRequested = false
        pairingCodeGenerated = false
      }
    }
    
    if (sock?.ws?.readyState === 1) launchCodeGeneration()
    else setTimeout(() => { if (!pairingCodeGenerated) launchCodeGeneration() }, 6000)
  }

  setTimeout(maybeStartPairingFlow, 2500)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr && method === 'qr') {
      console.clear()
      console.log(chalk.cyan('Escanear QR:'))
      qrcode.generate(qr, { small: true })
    }
    
    if (method === 'code' && !sock.authState.creds.registered && !pairingRequested) {
      setTimeout(maybeStartPairingFlow, 800)
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow('[Bot] Reconectando...'))
        startBot()
      } else {
        console.log('[Sesión cerrada]')
      }
    } 
    
    else if (connection === 'open') {
      try {
        // Delay corto para estabilizar
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        sock.__sessionOpenAt = Date.now()
        await sock.sendPresenceUpdate('available')
        
        const userName = sock?.user?.name || sock?.user?.verifiedName || 'Desconocido'
        console.log(chalk.green.bold(`✅ Conectado: ${userName}`))
        
        // Notificar reinicio
        const restartMessage = `✅ *BOT REINICIADO*\nConectado: ${userName}\nPlugins: ${Object.keys(global.plugins).length}`
        setTimeout(() => sendOwnerNotification(sock, restartMessage), 3000)
        
        // Marcar bot como listo después de 3 segundos
        setTimeout(() => {
          sock.__botReady = true
          console.log(chalk.green('[Bot] ✅ Listo para comandos'))
        }, 3000)
        
      } catch (e) {
        console.log(chalk.red('[Open] Error:', e.message))
      }
    }
  })

  sock.ev.on('group-participants.update', async (ev) => {
    try {
      const { id, participants, action } = ev || {}
      if (!id || !participants || !participants.length) return
      // Grupo events aquí si necesitas
    } catch (e) { 
      console.error('[GroupUpdate]', e) 
    }
  })
}

startBot()

const PLUGIN_DIR = path.join(__dirname, 'plugins')
let __syntaxErrorFn = null
try { const mod = await import('syntax-error'); __syntaxErrorFn = mod.default || mod } catch {}
global.reload = async (_ev, filename) => {
  try {
    if (!filename || !filename.endsWith('.js')) return
    const filePath = path.join(PLUGIN_DIR, filename)
    if (!fs.existsSync(filePath)) {
      console.log(chalk.yellow(`⚠️ Plugin eliminado: ${filename}`))
      delete global.plugins[filename]
      return
    }
    await importAndIndexPlugin(filePath)
    console.log(chalk.green(`✅ Recargado: ${filename}`))
  } catch (e) {
    console.error('[ReloadPlugin]', e.message || e)
  }
}
try {
  fs.watch(PLUGIN_DIR, { recursive: false }, (ev, fname) => {
    if (!fname) return
    global.reload(ev, fname).catch(() => {})
  })
} catch {}

async function isValidPhoneNumber(number) {
  try {
    let n = number.replace(/\s+/g, '')
    if (n.startsWith('+521')) n = n.replace('+521', '+52')
    else if (n.startsWith('+52') && n[4] === '1') n = n.replace('+521', '+52')
    const parsed = phoneUtil.parseAndKeepRawInput(n)
    return phoneUtil.isValidNumber(parsed)
  } catch (error) {
    return false
  }
}