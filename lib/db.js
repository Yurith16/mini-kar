import { Low } from 'lowdb'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Asegurar que existe la carpeta database
const dbDir = join(__dirname, '..', 'database')
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const file = join(dbDir, 'database.json')

// Adaptador simple para lowdb
class SimpleAdapter {
  constructor(filePath) {
    this.filePath = filePath
  }

  async read() {
    try {
      const data = await fs.promises.readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      if (e.code === 'ENOENT') return null
      throw e
    }
  }

  async write(data) {
    await fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2))
  }
}

const adapter = new SimpleAdapter(file)
export const db = new Low(adapter, { 
  users: {}, 
  chats: {}, 
  settings: {} 
})

export async function loadDatabase() {
  await db.read()
  db.data ||= { users: {}, chats: {}, settings: {} }
  
  // Inicializar estructura por defecto
  if (!db.data.users) db.data.users = {}
  if (!db.data.chats) db.data.chats = {}
  if (!db.data.settings) db.data.settings = {}
  
  // Referencia global
  global.db = db
  global.db.data = db.data
  
  console.log('[DB] Base de datos cargada')
}

export async function saveDatabase() {
  try {
    await db.write()
  } catch (e) {
    console.log('[DB] Error guardando:', e.message)
  }
}

// Auto-save cada 30 segundos
setInterval(saveDatabase, 30000)