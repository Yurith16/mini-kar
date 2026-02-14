const path = require('path')
const os = require('os')
const fs = require('fs')
const chalk = require('chalk')
const readline = require('readline')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const cfonts = require('cfonts')

// Importar baileys (CommonJS)
const makeWASocket = require('@whiskeysockets/baileys').default
const { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  Browsers 
} = require('@whiskeysockets/baileys')

// Cargar config
const config = require('./config.js')

// Handler
const { handler } = require('./handler.js')

// Config global
global.prefix = config.prefix
global.owner = config.owner
global.botName = config.botName
global.plugins = {}

// Crear carpeta tmp
if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp")

// Función para cargar plugins
async function loadPlugins() {
  const pluginsPath = path.join(__dirname, 'plugins')
  
  if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath, { recursive: true })
    console.log(chalk.yellow('📁 Carpeta plugins creada'))
    return
  }
  
  const pluginFiles = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'))
  let loadedCount = 0
  
  for (const file of pluginFiles) {
    try {
      const pluginPath = path.join(pluginsPath, file)
      delete require.cache[require.resolve(pluginPath)]
      const plugin = require(pluginPath)
      
      if (plugin && plugin.command) {
        const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
        
        for (const cmd of commands) {
          global.plugins[cmd.toLowerCase()] = plugin
        }
        loadedCount++
        console.log(chalk.green(`📦 Plugin cargado: ${file} (${commands.join(', ')})`))
      }
    } catch (e) {
      console.log(chalk.red(`❌ Error cargando ${file}:`), e.message)
    }
  }
  
  console.log(chalk.cyan(`✅ Total: ${loadedCount} plugins cargados\n`))
}

// Función para preguntar en terminal
function ask(question) {
  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
  })
  return new Promise(resolve => {
    rl.question(question, ans => { 
      rl.close()
      resolve(ans) 
    })
  })
}

// Elegir método de autenticación
async function chooseMethod(authDir) {
  const credsPath = path.join(authDir, 'creds.json')
  
  if (fs.existsSync(credsPath)) {
    console.log(chalk.green('✅ Usando sesión existente'))
    return 'existing'
  }
  
  if (process.argv.includes('--qr')) return 'qr'
  if (process.argv.includes('--code')) return 'code'
  
  console.clear()
  console.log(chalk.cyan.bold(`\n╭━━━ ${config.botName} ━━━╮`))
  console.log(chalk.cyan('┃    Selecciona método'))
  console.log(chalk.cyan('┃    ━━━━━━━━━━━━━━━'))
  console.log(chalk.cyan('┃ 1. 📱 Escanear QR'))
  console.log(chalk.cyan('┃ 2. 🔢 Código de 8 dígitos'))
  console.log(chalk.cyan('╰━━━━━━━━━━━━━━━━━━╯\n'))
  
  let ans = await ask('➤ Elige (1 o 2): ')
  
  while (!['1','2'].includes(ans)) {
    console.log(chalk.red('❌ Opción inválida'))
    ans = await ask('➤ Elige (1 o 2): ')
  }
  
  return ans === '1' ? 'qr' : 'code'
}

// Mostrar banner
try {
  cfonts.say(config.botName, {
    font: 'simple',
    align: 'left',
    gradient: ['green', 'cyan']
  })
  console.log(chalk.cyan(`💾 RAM: ${(os.totalmem() / 1e9).toFixed(2)}GB total`))
} catch (e) {}

// Función principal
async function startBot() {
  await loadPlugins()
  
  const authDir = path.join(__dirname, config.sessionDirName)
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
    browser: method === 'code' ? Browsers.macOS('Chrome') : ['KarBot', 'Chrome', '1.0.0']
  })

  let pairingRequested = false

  async function startPairing() {
    if (method !== 'code' || sock.authState.creds.registered || pairingRequested) return
    
    pairingRequested = true
    
    let number = config.botNumber || ''
    
    if (!number) {
      console.log(chalk.yellow('\n📱 Ingresa el número del bot (ej: 50498729368):'))
      number = await ask('Número: ')
    }
    
    number = number.replace(/[^0-9]/g, '')
    
    if (!number) {
      console.log(chalk.red('❌ Número inválido'))
      pairingRequested = false
      return
    }
    
    try {
      console.log(chalk.cyan(`⏳ Generando código para +${number}...`))
      const code = await sock.requestPairingCode(number)
      const formattedCode = code.match(/.{1,4}/g)?.join('-') || code
      
      console.log('\n' + chalk.green.bold('╭━━━━━━━━━━━━━━━━━━━━╮'))
      console.log(chalk.green.bold('┃   CÓDIGO DE 8 DÍGITOS  ┃'))
      console.log(chalk.green.bold('├──────────────────────┤'))
      console.log(chalk.green.bold(`┃   ${chalk.white.bold(formattedCode)}   ┃`))
      console.log(chalk.green.bold('╰━━━━━━━━━━━━━━━━━━━━╯\n'))
      
      console.log(chalk.yellow('📌 Pasos:'))
      console.log(chalk.yellow('1. Abre WhatsApp en tu teléfono'))
      console.log(chalk.yellow('2. Menú > Dispositivos vinculados'))
      console.log(chalk.yellow('3. Vincular con número de teléfono'))
      console.log(chalk.yellow(`4. Ingresa: ${chalk.white.bold(formattedCode)}\n`))
      
    } catch (e) {
      console.error(chalk.red('❌ Error:', e.message))
      pairingRequested = false
    }
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    
    if (qr && method === 'qr') {
      console.clear()
      console.log(chalk.green.bold('\n╭━━━━━━━━━━━━━━━━━━━━╮'))
      console.log(chalk.green.bold('┃   ESCANEA ESTE QR   ┃'))
      console.log(chalk.green.bold('╰━━━━━━━━━━━━━━━━━━━━╯\n'))
      qrcode.generate(qr, { small: true })
      console.log('\n' + chalk.yellow('📌 Abre WhatsApp > Menú > Dispositivos vinculados > Escanear QR'))
    }
    
    if (method === 'code' && !sock.authState.creds.registered && !pairingRequested) {
      setTimeout(startPairing, 1000)
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      
      if (shouldReconnect) {
        console.log(chalk.yellow('🔄 Reconectando...'))
        startBot()
      } else {
        console.log(chalk.red('❌ Sesión cerrada, elimina la carpeta ' + config.sessionDirName + ' para reiniciar'))
      }
    }
    
    if (connection === 'open') {
      console.log(chalk.green.bold('\n✅ ¡BOT CONECTADO EXITOSAMENTE!\n'))
      console.log(chalk.cyan(`📱 Número: ${sock.user?.id.split(':')[0]}`))
      console.log(chalk.cyan(`👤 Creador: ${config.owner[0]}`))
      console.log(chalk.cyan(`🔰 Prefijos: ${config.prefix.join(' ')}`))
      console.log(chalk.cyan(`📦 Plugins: ${Object.keys(global.plugins).length} comandos\n`))
      
      setTimeout(() => {
        const jid = config.owner[0].includes('@s.whatsapp.net') 
          ? config.owner[0] 
          : config.owner[0] + '@s.whatsapp.net'
        
        sock.sendMessage(jid, { 
          text: `✅ *${config.botName} activado*\n\n📱 Bot: ${sock.user?.id.split(':')[0]}\n📦 Comandos: ${Object.keys(global.plugins).length}\n⏰ ${new Date().toLocaleString()}`
        }).catch(() => {})
      }, 3000)
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    await handler.call(sock, chatUpdate, config)
  })

  return sock
}

startBot().catch(console.error)

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Cerrando bot...'))
  process.exit(0)
})