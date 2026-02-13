import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs'
import readline from 'readline'
import qrcode from 'qrcode-terminal'
import cfonts from 'cfonts'
import pino from 'pino'
import { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  makeWASocket,
  Browsers
} from '@whiskeysockets/baileys'
import { loadDatabase, saveDatabase } from './lib/db.js'
import config from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuraciones globales
global.owner = config.owner || []
global.prefix = config.prefix || '.'
global.botname = config.botname || 'Bot'
global.moneda = config.moneda || 'Kryons'
global.multiplier = config.multiplier || 69

// Crear carpetas necesarias
if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp")
if (!fs.existsSync("./database")) fs.mkdirSync("./database")

// Cargar plugins
global.plugins = {}
global.commandIndex = {}

async function loadPlugins() {
  const pluginDir = path.join(__dirname, 'plugins')
  if (!fs.existsSync(pluginDir)) return
  
  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'))
  
  for (const file of files) {
    try {
      const fullPath = path.join(pluginDir, file)
      const mod = await import(pathToFileURL(fullPath).href + `?update=${Date.now()}`)
      const plugin = mod.default || mod
      
      if (!plugin) continue
      
      plugin.__file = file
      global.plugins[file] = plugin
      
      // Indexar comandos
      const cmds = []
      if (typeof plugin.command === 'string') cmds.push(plugin.command.toLowerCase())
      else if (Array.isArray(plugin.command)) cmds.push(...plugin.command.map(c => c.toLowerCase()))
      
      for (const cmd of cmds) {
        global.commandIndex[cmd] = plugin
      }
    } catch (e) {
      console.log(`[Plugin] Error en ${file}:`, e.message)
    }
  }
  
  console.log(`[Plugins] ${Object.keys(global.plugins).length} cargados`)
}

// Cargar handler
let handler
try {
  const handlerMod = await import('./handler.js')
  handler = handlerMod.handler || handlerMod.default?.handler || handlerMod.default
} catch (e) {
  console.log('[Handler] Error:', e.message)
}

// Función para preguntar en consola
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(res => rl.question(question, ans => { rl.close(); res(ans) }))
}

// Seleccionar método de login
async function chooseMethod(authDir) {
  const credsPath = path.join(authDir, 'creds.json')
  if (fs.existsSync(credsPath)) return 'existing'
  
  console.log('\n=== MÉTODO DE CONEXIÓN ===')
  console.log('1. Escanear QR')
  console.log('2. Código de 8 dígitos')
  
  let ans = ''
  do {
    ans = await ask('Elige (1 o 2): ')
  } while (!['1','2'].includes(ans))
  
  return ans === '1' ? 'qr' : 'code'
}

// Notificar a owners
async function sendOwnerNotification(sock, message) {
  try {
    if (!global.owner || !global.owner.length) return
    
    for (const ownerInfo of global.owner) {
      let ownerNumber = Array.isArray(ownerInfo) ? ownerInfo[0] : ownerInfo
      if (!ownerNumber) continue
      
      const ownerJid = ownerNumber.includes('@') ? ownerNumber : `${ownerNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`
      await sock.sendMessage(ownerJid, { text: `🔔 *BOT*\n\n${message}` }).catch(() => {})
    }
  } catch (error) {
    console.log('[OwnerNotify] Error:', error.message)
  }
}

// Iniciar bot
async function startBot() {
  await loadDatabase()
  await loadPlugins()
  
  // Banner
  cfonts.say('KAR-MINI', { font: 'simple', align: 'center', colors: ['cyan'] })
  
  const authDir = path.join(__dirname, config.sessionDir || 'sessions')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })
  
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const method = await chooseMethod(authDir)
  const { version } = await fetchLatestBaileysVersion()
  
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: method === 'code' ? Browsers.macOS('Safari') : ['KAR-MINI', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true
  })
  
  sock.__botReady = false
  
  // Manejar mensajes
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      if (!sock.__botReady) return
      if (!handler) return
      
      const messages = chatUpdate.messages || []
      if (!messages.length) return
      
      const filtered = messages.filter(m => !m.key?.fromMe)
      if (!filtered.length) return
      
      await handler.call(sock, { ...chatUpdate, messages: filtered })
    } catch (e) {
      console.log('[Handler] Error:', e.message)
    }
  })
  
  // Guardar credenciales
  sock.ev.on('creds.update', saveCreds)
  
  // Manejar conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    
    if (qr && method === 'qr') {
      console.log('\n[QR] Escanea este código:')
      qrcode.generate(qr, { small: true })
    }
    
    if (method === 'code' && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          if (sock.authState.creds.registered) return
          
          let number = config.botNumber || ''
          if (!number) {
            number = await ask('Número (ej: 50498729368): ')
          }
          
          number = number.replace(/[^0-9]/g, '')
          if (!number) return
          
          console.log('[Code] Solicitando código...')
          const code = await sock.requestPairingCode(number)
          const formatted = code.match(/.{1,4}/g)?.join('-') || code
          console.log(`\n🔐 CÓDIGO: ${formatted}\n`)
        } catch (e) {
          console.log('[Code] Error:', e.message)
        }
      }, 2000)
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('[Bot] Reconectando...')
        setTimeout(startBot, 3000)
      }
    } else if (connection === 'open') {
      await sock.sendPresenceUpdate('available')
      
      const userName = sock.user?.name || 'Desconocido'
      console.log(`\n✅ Conectado: ${userName}`)
      
      setTimeout(() => {
        sock.__botReady = true
        console.log('[Bot] ✅ Listo para comandos')
        sendOwnerNotification(sock, `✅ Bot iniciado\nVersión: Mini`)
      }, 3000)
    }
  })
  
  // Guardar DB periódicamente
  setInterval(() => saveDatabase(), 60000)
  
  // Manejar cierre
  const shutdown = async () => {
    await saveDatabase()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

startBot().catch(console.error)